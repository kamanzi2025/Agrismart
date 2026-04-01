// Mock weather.service.ts
jest.mock('../src/services/weather.service', () => ({
  getCurrentWeather: jest.fn(),
  getPlantingRisk: jest.fn(),
}));
jest.mock('../src/utils/prisma', () => ({
  plantingCalendar: { findFirst: jest.fn().mockResolvedValue(null) },
}));

import { getCurrentWeather, getPlantingRisk } from '../src/services/weather.service';
import {
  generatePlantingAdvice,
  generateSoilAdvice,
  generateAutomatedPestAdvice,
} from '../src/services/advisoryEngine.service';

const mockGetWeather = getCurrentWeather as jest.MockedFunction<typeof getCurrentWeather>;
const mockGetRisk = getPlantingRisk as jest.MockedFunction<typeof getPlantingRisk>;

describe('AdvisoryEngine', () => {
  describe('generatePlantingAdvice', () => {
    it('returns LOW risk for sunny weather', async () => {
      mockGetWeather.mockResolvedValue({
        temp: 24,
        humidity: 60,
        rainfall7days: 10,
        forecast3days: [],
        uvIndex: 5,
      });
      mockGetRisk.mockResolvedValue('LOW');
      const result = await generatePlantingAdvice(-1.9, 30.1, 'Kigali');
      expect(result.riskLevel).toBe('LOW');
      expect(Array.isArray(result.soilTips)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(result.optimalPlantingDate).toBeTruthy();
    });

    it('returns HIGH risk for heavy rain', async () => {
      mockGetWeather.mockResolvedValue({
        temp: 18,
        humidity: 95,
        rainfall7days: 90,
        forecast3days: [],
        uvIndex: 2,
      });
      mockGetRisk.mockResolvedValue('HIGH');
      const result = await generatePlantingAdvice(-1.9, 30.1, 'Kigali');
      expect(result.riskLevel).toBe('HIGH');
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('returns MEDIUM risk for borderline weather', async () => {
      mockGetWeather.mockResolvedValue({
        temp: 21,
        humidity: 75,
        rainfall7days: 40,
        forecast3days: [],
        uvIndex: 4,
      });
      mockGetRisk.mockResolvedValue('MEDIUM');
      const result = await generatePlantingAdvice(-1.9, 30.1, 'Kigali');
      expect(result.riskLevel).toBe('MEDIUM');
    });
  });

  describe('generateSoilAdvice', () => {
    const soilTypes = ['clay', 'loam', 'sandy', 'silty', 'peaty'];
    soilTypes.forEach((soilType) => {
      it(`returns advice for ${soilType} soil`, () => {
        const result = generateSoilAdvice(soilType, 'Kigali');
        expect(result.tips.length).toBeGreaterThan(0);
        expect(result.cropRotationPlan.length).toBeGreaterThan(0);
        expect(result.fertilizerGuide.length).toBeGreaterThan(0);
      });
    });
  });

  describe('generateAutomatedPestAdvice', () => {
    it('returns advice for BCMV', () => {
      const result = generateAutomatedPestAdvice('Bean Common Mosaic Virus');
      expect(result.treatment.length).toBeGreaterThanOrEqual(3);
      expect(result.prevention.length).toBeGreaterThanOrEqual(3);
    });
    it('returns advice for aphids', () => {
      const result = generateAutomatedPestAdvice('aphid');
      expect(result.treatment.length).toBeGreaterThan(0);
    });
    it('returns general advice for unknown pest', () => {
      const result = generateAutomatedPestAdvice('unknown xyz disease');
      expect(result).toBeTruthy();
      expect(result.treatment).toBeDefined();
    });
  });
});
