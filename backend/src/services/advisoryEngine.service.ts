import path from 'path';
import fs from 'fs';
import prisma from '../utils/prisma';
import { getCurrentWeather, getPlantingRisk } from './weather.service';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface PlantingAdvice {
  optimalPlantingDate: string;
  weatherSummary: string;
  soilTips: string[];
  warnings: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  season: string;
}

interface SoilAdvice {
  soilType: string;
  tips: string[];
  cropRotationPlan: string[];
  fertilizerGuide: string;
}

interface PestAdvice {
  pestName: string;
  treatment: string[];
  prevention: string[];
  severity: string;
}

interface PestLibraryEntry {
  id: string;
  name: string;
  treatment: string[];
  prevention: string[];
  severityLevel: string;
  [key: string]: unknown;
}

// ─────────────────────────────────────────────────────────────────
// Season helper — Rwanda seasons
// ─────────────────────────────────────────────────────────────────

function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 3 && month <= 6) return 'Season A';
  if (month >= 9 && month <= 12) return 'Season B';
  return 'Off-season';
}

// ─────────────────────────────────────────────────────────────────
// Planting Advice
// ─────────────────────────────────────────────────────────────────

export async function generatePlantingAdvice(
  lat: number,
  lng: number,
  region: string,
): Promise<PlantingAdvice> {
  const [weather, riskLevel] = await Promise.all([
    getCurrentWeather(lat, lng),
    getPlantingRisk(lat, lng),
  ]);

  // Query planting calendar for region (case-insensitive LIKE)
  const calendarEntry = await prisma.plantingCalendar.findFirst({
    where: {
      region: {
        contains: region,
        mode: 'insensitive',
      },
    },
    orderBy: { startDate: 'asc' },
  });

  const season = getCurrentSeason();

  // Determine optimal planting date
  let optimalPlantingDate: string;
  if (calendarEntry) {
    optimalPlantingDate = calendarEntry.startDate.toISOString().split('T')[0];
  } else {
    // Default: first Monday of the next planting window
    const now = new Date();
    const month = now.getMonth() + 1;
    let targetMonth: number;
    if (month < 3) targetMonth = 3;
    else if (month < 9) targetMonth = 9;
    else targetMonth = 3; // next year season A
    const year = targetMonth <= now.getMonth() + 1 ? now.getFullYear() + 1 : now.getFullYear();
    optimalPlantingDate = `${year}-${String(targetMonth).padStart(2, '0')}-01`;
  }

  const weatherSummary = `Temperature: ${weather.temp}°C, Humidity: ${weather.humidity}%, 7-day rainfall: ${weather.rainfall7days}mm, UV Index: ${weather.uvIndex}`;

  const soilTips: string[] = [
    'Ensure soil pH is between 6.0 and 7.0 for optimal bean growth.',
    'Apply compost or well-decomposed manure to improve soil structure.',
    'Carry out a soil test before planting to identify nutrient deficiencies.',
  ];

  const warnings: string[] = [];
  if (riskLevel === 'HIGH') {
    warnings.push(
      'Heavy rainfall detected — consider delaying planting to avoid waterlogging.',
    );
    warnings.push(
      'High humidity increases risk of fungal diseases. Prepare fungicide spray programme.',
    );
  } else if (riskLevel === 'MEDIUM') {
    warnings.push('Moderate weather conditions — monitor rainfall closely before planting.');
  } else {
    warnings.push('Conditions look favourable. Ensure irrigation is available if rainfall is low.');
  }

  if (weather.uvIndex > 8) {
    warnings.push('High UV index — seedlings may need shade protection in early stages.');
  }

  return {
    optimalPlantingDate,
    weatherSummary,
    soilTips,
    warnings,
    riskLevel,
    season,
  };
}

// ─────────────────────────────────────────────────────────────────
// Soil Advice
// ─────────────────────────────────────────────────────────────────

export function generateSoilAdvice(soilType: string, region: string): SoilAdvice {
  const type = soilType.toLowerCase().trim();

  const adviceMap: Record<
    string,
    { tips: string[]; cropRotationPlan: string[]; fertilizerGuide: string }
  > = {
    clay: {
      tips: [
        'Improve drainage by creating raised beds or ridges to prevent waterlogging.',
        'Add organic matter (compost, manure) to break up heavy clay texture.',
        'Avoid working clay soil when wet to prevent compaction and structural damage.',
        'Consider deep tillage (subsoiling) once per season to break hardpan layers.',
      ],
      cropRotationPlan: ['beans', 'maize', 'sorghum'],
      fertilizerGuide:
        'Apply 150 kg/ha of NPK 17:17:17 at planting. Top-dress with 50 kg/ha CAN at flowering. Clay soils retain nutrients well but ensure adequate aeration.',
    },
    loam: {
      tips: [
        'Ideal soil for bean farming — maintain organic matter by adding compost annually.',
        'Monitor moisture levels; loam drains well but may dry out in dry spells.',
        'Rotate crops to maintain soil fertility and prevent pest build-up.',
        'Standard NPK fertilisation is sufficient; avoid over-application.',
      ],
      cropRotationPlan: ['beans', 'maize', 'vegetables'],
      fertilizerGuide:
        'Apply standard NPK 17:17:17 at 100 kg/ha at planting. Top-dress with 50 kg/ha urea at 3-4 weeks after emergence.',
    },
    sandy: {
      tips: [
        'Add generous amounts of organic matter (compost, manure) to improve water retention.',
        'Irrigate frequently as sandy soils lose moisture rapidly.',
        'Apply mulch around plants to reduce evaporation from the soil surface.',
        'Use fertigation or split fertiliser applications to reduce leaching losses.',
      ],
      cropRotationPlan: ['beans', 'cassava', 'groundnuts'],
      fertilizerGuide:
        'Sandy soils have poor nutrient retention. Apply smaller, more frequent doses of NPK. Use slow-release fertiliser formulations. Add 5-10 t/ha of compost before planting.',
    },
    silty: {
      tips: [
        'Silty soils are naturally fertile — maintain this by adding organic matter.',
        'Watch for surface crusting and compaction, especially after heavy rain.',
        'Avoid heavy machinery on silty soil when wet.',
        'Mulching helps prevent crusting and maintains moisture balance.',
      ],
      cropRotationPlan: ['beans', 'sorghum', 'maize'],
      fertilizerGuide:
        'Apply NPK 17:17:17 at 100 kg/ha at planting. Silty soils generally have good fertility; conduct soil tests before heavy fertiliser application.',
    },
    peaty: {
      tips: [
        'Peaty soils are acidic — apply agricultural lime (2-4 t/ha) to raise pH to 6.0-6.5.',
        'Improve drainage as peat soils are often waterlogged.',
        'High organic matter is an advantage but may cause nitrogen lock-up initially.',
        'Raised beds are strongly recommended for peaty wetland areas.',
      ],
      cropRotationPlan: ['beans', 'potatoes', 'vegetables'],
      fertilizerGuide:
        'Lime soil before planting season. Apply phosphate fertiliser (TSP) at 50 kg/ha as peat fixes phosphorus. NPK 17:17:17 at 100 kg/ha after liming is complete.',
    },
  };

  const advice = adviceMap[type];

  if (!advice) {
    return {
      soilType,
      tips: [
        `Soil type "${soilType}" not specifically catalogued. Conduct a professional soil test.`,
        'Apply balanced NPK fertiliser and add compost to improve general soil health.',
        'Ensure adequate drainage to prevent root diseases in beans.',
        `Consider consulting your extension officer in ${region} for localised advice.`,
      ],
      cropRotationPlan: ['beans', 'maize', 'sorghum'],
      fertilizerGuide:
        'Apply NPK 17:17:17 at 100 kg/ha at planting as a general recommendation. Get a soil test for precise rates.',
    };
  }

  return {
    soilType,
    tips: advice.tips,
    cropRotationPlan: advice.cropRotationPlan,
    fertilizerGuide: advice.fertilizerGuide,
  };
}

// ─────────────────────────────────────────────────────────────────
// Automated Pest Advice
// ─────────────────────────────────────────────────────────────────

export function generateAutomatedPestAdvice(diagnosis: string): PestAdvice {
  const libraryPath = path.join(__dirname, '../data/pest-library.json');
  let library: PestLibraryEntry[] = [];
  try {
    const raw = fs.readFileSync(libraryPath, 'utf8');
    library = JSON.parse(raw) as PestLibraryEntry[];
  } catch {
    // fallback to empty
  }

  const lower = diagnosis.toLowerCase();
  const found = library.find((p) => p.name.toLowerCase().includes(lower));

  if (found) {
    return {
      pestName: found.name,
      treatment: found.treatment,
      prevention: found.prevention,
      severity: found.severityLevel,
    };
  }

  // General fallback advice
  return {
    pestName: 'Unknown / General Pest',
    treatment: [
      'Consult your local extension officer for an accurate diagnosis.',
      'Remove and isolate affected plants to limit spread.',
      'Apply a broad-spectrum pesticide only if infestation is severe.',
    ],
    prevention: [
      'Use certified, disease-resistant seed varieties.',
      'Practice crop rotation every season to break pest cycles.',
      'Monitor fields regularly and report unusual symptoms early.',
    ],
    severity: 'UNKNOWN',
  };
}
