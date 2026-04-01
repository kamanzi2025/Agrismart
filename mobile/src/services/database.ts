import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('agrismart.db');
    await initDb(db);
  }
  return db;
}

async function initDb(database: SQLite.SQLiteDatabase) {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS financial_records (
      id TEXT PRIMARY KEY,
      client_uuid TEXT UNIQUE NOT NULL,
      farmer_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      category TEXT,
      season TEXT,
      date TEXT NOT NULL,
      synced INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS pest_reports (
      id TEXT PRIMARY KEY,
      client_uuid TEXT UNIQUE NOT NULL,
      farmer_id TEXT NOT NULL,
      image_uri TEXT,
      notes TEXT,
      status TEXT DEFAULT 'PENDING',
      pest_name TEXT,
      ai_diagnosis TEXT,
      officer_notes TEXT,
      synced INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS advisories (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      crop_type TEXT,
      season TEXT,
      target_location TEXT,
      created_at TEXT
    );
  `);
}

export async function saveFinancialRecord(record: {
  clientUuid: string;
  farmerId: string;
  type: 'EXPENSE' | 'SALE';
  amount: number;
  description: string;
  category?: string;
  season?: string;
  date: string;
}) {
  const database = await getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO financial_records
     (id, client_uuid, farmer_id, type, amount, description, category, season, date, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [record.clientUuid, record.clientUuid, record.farmerId, record.type, record.amount,
     record.description, record.category ?? null, record.season ?? null, record.date],
  );
}

export async function savePestReport(report: {
  clientUuid: string;
  farmerId: string;
  imageUri?: string;
  notes?: string;
}) {
  const database = await getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO pest_reports (id, client_uuid, farmer_id, image_uri, notes, synced)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [report.clientUuid, report.clientUuid, report.farmerId, report.imageUri ?? null, report.notes ?? null],
  );
}

export async function getPendingRecords() {
  const database = await getDb();
  const financials = await database.getAllAsync<{
    client_uuid: string; farmer_id: string; type: string; amount: number;
    description: string; category: string | null; season: string | null; date: string;
  }>('SELECT * FROM financial_records WHERE synced = 0');
  const pestReports = await database.getAllAsync<{
    client_uuid: string; farmer_id: string; image_uri: string | null; notes: string | null;
  }>('SELECT * FROM pest_reports WHERE synced = 0');
  return { financials, pestReports };
}

export async function markSynced(type: 'financial' | 'pest', clientUuid: string) {
  const database = await getDb();
  if (type === 'financial') {
    await database.runAsync('UPDATE financial_records SET synced = 1 WHERE client_uuid = ?', [clientUuid]);
  } else {
    await database.runAsync('UPDATE pest_reports SET synced = 1 WHERE client_uuid = ?', [clientUuid]);
  }
}

export async function saveAdvisories(advisories: Array<{
  id: string; title: string; content: string; cropType?: string;
  season?: string; targetLocation?: string; createdAt: string;
}>) {
  const database = await getDb();
  for (const a of advisories) {
    await database.runAsync(
      `INSERT OR REPLACE INTO advisories (id, title, content, crop_type, season, target_location, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [a.id, a.title, a.content, a.cropType ?? null, a.season ?? null, a.targetLocation ?? null, a.createdAt],
    );
  }
}

export async function getLocalAdvisories() {
  const database = await getDb();
  return database.getAllAsync<{ id: string; title: string; content: string; crop_type: string | null; season: string | null; created_at: string }>(
    'SELECT * FROM advisories ORDER BY created_at DESC'
  );
}
