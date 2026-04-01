"""
AgriSmart – Flask REST API backend
Run: python app.py   (serves on http://localhost:5000)
"""
from __future__ import annotations
from flask import Flask, request, jsonify, send_from_directory
import hashlib, uuid, os
from datetime import datetime
from typing import Optional

app = Flask(__name__, static_folder="../frontend", static_url_path="")

# ─────────────────────────────────────────────────────────────────
# IN-MEMORY STORE  (replace with a real DB in production)
# ─────────────────────────────────────────────────────────────────
_users: list[dict] = []
_records: list[dict] = []
_sessions: dict[str, int] = {}          # token → user_id
_next_user_id = 1
_next_record_id = 1

SALT = "AgriSmartSalt2025"

def _hash(pw: str) -> str:
    return hashlib.sha256(f"{pw}{SALT}".encode()).hexdigest()

def _seed():
    global _next_user_id
    for name, phone, pw, role, region in [
        ("Demo Farmer",       "+250700000001", "farmer123",  "Farmer",             "Kigali"),
        ("Extension Officer", "+250700000002", "officer123", "Extension Officer",   "Kigali"),
        ("Admin",             "+250700000000", "admin123",   "Administrator",       "Kigali"),
    ]:
        _users.append({
            "id": _next_user_id, "name": name, "phone": phone,
            "pw_hash": _hash(pw), "role": role, "region": region, "active": True,
        })
        _next_user_id += 1

_seed()

# ─────────────────────────────────────────────────────────────────
# AUTH HELPERS
# ─────────────────────────────────────────────────────────────────
def _token_from_request() -> str:
    return request.headers.get("Authorization", "").replace("Bearer ", "").strip()

def _current_user() -> Optional[dict]:
    uid = _sessions.get(_token_from_request())
    return next((u for u in _users if u["id"] == uid), None) if uid else None

def _require_auth():
    u = _current_user()
    if not u:
        return None, (jsonify({"error": "Unauthorized"}), 401)
    return u, None

# ─────────────────────────────────────────────────────────────────
# AUTH ROUTES
# ─────────────────────────────────────────────────────────────────
@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    data  = request.get_json(force=True)
    phone = data.get("phone", "").strip()
    pw    = data.get("password", "")
    user  = next((u for u in _users
                  if u["phone"] == phone
                  and u["pw_hash"] == _hash(pw)
                  and u["active"]), None)
    if not user:
        return jsonify({"error": "Invalid phone number or password."}), 401
    token = str(uuid.uuid4())
    _sessions[token] = user["id"]
    return jsonify({
        "token": token,
        "user": {k: user[k] for k in ("id", "name", "role", "region")},
    })

@app.route("/api/auth/register", methods=["POST"])
def auth_register():
    global _next_user_id
    data   = request.get_json(force=True)
    name   = data.get("name", "").strip()
    phone  = data.get("phone", "").strip()
    pw     = data.get("password", "")
    role   = data.get("role", "Farmer")
    region = data.get("region", "Kigali")
    if not name or not phone or not pw:
        return jsonify({"error": "Please fill all required fields."}), 400
    if any(u["phone"] == phone for u in _users):
        return jsonify({"error": "Phone number already registered."}), 409
    _users.append({
        "id": _next_user_id, "name": name, "phone": phone,
        "pw_hash": _hash(pw), "role": role, "region": region, "active": True,
    })
    _next_user_id += 1
    return jsonify({"message": "Registration successful."})

@app.route("/api/auth/logout", methods=["POST"])
def auth_logout():
    _sessions.pop(_token_from_request(), None)
    return jsonify({"message": "Logged out."})

# ─────────────────────────────────────────────────────────────────
# PLANTING ADVISORY
# ─────────────────────────────────────────────────────────────────
_PLANTING = {
    "Kigali":        {"A": "March 1–15",     "B": "Aug 20–Sep 5",   "variety": "RWR 2245 (Angular Leaf Spot resistant)"},
    "Huye":          {"A": "March 5–20",     "B": "Aug 25–Sep 10",  "variety": "MAC 44 (high-altitude climbing bean)"},
    "Musanze":       {"A": "Feb 20–Mar 5",   "B": "Aug 10–25",      "variety": "Lyamungu 85 (bush bean, frost-tolerant)"},
    "Rubavu":        {"A": "March 1–15",     "B": "Aug 20–Sep 5",   "variety": "RWR 2245"},
    "Nairobi":       {"A": "March 10–25",    "B": "Sep 1–15",       "variety": "KK8 (Kenya Climbing)"},
    "Kampala":       {"A": "March 5–20",     "B": "Aug 25–Sep 10",  "variety": "NABE 4 (drought-tolerant)"},
    "Dar es Salaam": {"A": "March 15–Apr 1", "B": "Sep 10–25",      "variety": "Jesca (short-season bush bean)"},
}
_SOIL_TIPS = [
    "Plough to 20 cm depth 2–3 weeks before planting",
    "Apply 2 t/ha well-decomposed compost",
    "Target soil pH 5.5–6.5; apply lime if pH < 5.5",
    "Ensure good drainage to prevent root rot",
    "Plant on ridges in high-rainfall areas",
    "Inoculate seed with Rhizobium phaseoli before sowing",
]

@app.route("/api/planting/regions")
def planting_regions():
    return jsonify(list(_PLANTING.keys()))

@app.route("/api/planting/advisory")
def planting_advisory():
    user, err = _require_auth()
    if err: return err
    region = request.args.get("region", user["region"])
    d = _PLANTING.get(region, _PLANTING["Kigali"])
    month = datetime.now().month
    is_a  = month <= 6
    key   = "A" if is_a else "B"
    return jsonify({
        "region":           region,
        "variety":          d["variety"],
        "season":           "Season A (Long Rains)" if is_a else "Season B (Short Rains)",
        "planting_window":  d[key],
        "harvest":          "90–110 days after planting",
        "soil_tips":        _SOIL_TIPS,
    })

# ─────────────────────────────────────────────────────────────────
# PEST & DISEASE
# ─────────────────────────────────────────────────────────────────
_PESTS = [
    {
        "name":       "Bean Stem Maggot (Ophiomyia spp.)",
        "symptoms":   "Yellowing of lower leaves; wilting despite adequate moisture; small exit holes at base of stem.",
        "treatment":  "Apply Imidacloprid seed dressing before planting. For existing infestations use Dimethoate 40 EC as a soil drench around the stem base.",
        "prevention": "Use certified dressed seed. Rotate crops every season. Remove and destroy infested plant material.",
    },
    {
        "name":       "Bean Anthracnose (Colletotrichum lindemuthianum)",
        "symptoms":   "Dark brown to black sunken lesions on pods, stems and leaves. Pink/salmon spore masses visible in wet weather.",
        "treatment":  "Apply copper-based fungicide (Copper Oxychloride) at first sign of infection. Repeat every 7–10 days in wet weather.",
        "prevention": "Use disease-free certified seed. Avoid overhead irrigation. Practice crop rotation with non-legume crops.",
    },
    {
        "name":       "Angular Leaf Spot (Phaeoisariopsis griseola)",
        "symptoms":   "Angular brown water-soaked spots bounded by leaf veins. Grey spore masses on undersides. Premature defoliation.",
        "treatment":  "Apply Mancozeb or Chlorothalonil fungicide every 7–14 days from first sign of symptoms.",
        "prevention": "Plant resistant varieties (e.g. RWR 2245). Use 3-year crop rotation. Avoid working in wet fields.",
    },
    {
        "name":       "Bean Common Mosaic Virus (BCMV)",
        "symptoms":   "Mosaic yellowing and dark-green blistering on young leaves. Stunted growth. Downward curling of leaf margins.",
        "treatment":  "No cure once infected. Remove and destroy affected plants immediately. Control aphid vectors with Imidacloprid spray.",
        "prevention": "Use BCMV-resistant certified varieties. Control aphids early. Disinfect tools between plants.",
    },
    {
        "name":       "Aphids (Aphis fabae)",
        "symptoms":   "Dense colonies of small black/green insects on growing tips and undersides of leaves. Sticky honeydew, sooty mould, leaf curling.",
        "treatment":  "Spray with insecticidal soap or Neem oil (5 ml/L). For severe infestations use Pyrethroids (e.g. Cypermethrin).",
        "prevention": "Encourage natural predators (ladybirds). Avoid excess nitrogen. Scout weekly during early growth.",
    },
    {
        "name":       "Root Rot (Pythium / Rhizoctonia spp.)",
        "symptoms":   "Dark brown/black discolouration of roots and lower stem. Damping-off of seedlings. Stunted yellow plants that wilt and die.",
        "treatment":  "Improve field drainage. Apply Metalaxyl seed treatment. In established crops drench with Fosetyl-Aluminium.",
        "prevention": "Ensure well-drained soils. Avoid waterlogging. Use raised beds in heavy-clay areas. Rotate with cereals.",
    },
]

@app.route("/api/pest/all")
def pest_all():
    return jsonify([{"name": p["name"]} for p in _PESTS])

@app.route("/api/pest/diagnose")
def pest_diagnose():
    user, err = _require_auth()
    if err: return err
    kw = request.args.get("keyword", "").lower().strip()
    if not kw:
        return jsonify({"error": "keyword is required"}), 400
    match = next(
        (p for p in _PESTS
         if kw in p["name"].lower() or kw in p["symptoms"].lower()),
        None,
    )
    return jsonify({"match": match})

# ─────────────────────────────────────────────────────────────────
# FARM FINANCE
# ─────────────────────────────────────────────────────────────────
@app.route("/api/finance/records", methods=["GET"])
def finance_get_records():
    user, err = _require_auth()
    if err: return err
    recs = [r for r in _records if r["user_id"] == user["id"]]
    return jsonify(recs)

@app.route("/api/finance/records", methods=["POST"])
def finance_add_record():
    global _next_record_id
    user, err = _require_auth()
    if err: return err
    data        = request.get_json(force=True)
    season      = data.get("season", "").strip()
    tx_type     = data.get("type", "").strip()
    category    = data.get("category", "").strip()
    description = data.get("description", "").strip()
    try:
        amount = float(data.get("amount", 0))
    except (TypeError, ValueError):
        amount = 0
    if not description or amount <= 0:
        return jsonify({"error": "Please provide a description and valid amount."}), 400
    _records.append({
        "id":          _next_record_id,
        "user_id":     user["id"],
        "season":      season,
        "type":        tx_type,
        "category":    category,
        "description": description,
        "amount":      amount,
        "date":        datetime.now().strftime("%d %b %y"),
    })
    _next_record_id += 1
    return jsonify({"message": "Record saved."})

@app.route("/api/finance/summary")
def finance_summary():
    user, err = _require_auth()
    if err: return err
    season = request.args.get("season", "")
    recs   = [r for r in _records
              if r["user_id"] == user["id"]
              and (not season or r["season"] == season)]
    revenue = sum(r["amount"] for r in recs if r["type"] == "Revenue")
    cost    = sum(r["amount"] for r in recs if r["type"] == "Cost")
    return jsonify({"revenue": revenue, "cost": cost, "net": revenue - cost, "season": season})

# ─────────────────────────────────────────────────────────────────
# SERVE FRONTEND
# ─────────────────────────────────────────────────────────────────
@app.route("/")
def serve_index():
    return send_from_directory("../frontend", "index.html")

if __name__ == "__main__":
    app.run(debug=True, port=5000)
