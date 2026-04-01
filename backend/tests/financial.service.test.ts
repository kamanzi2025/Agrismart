// Mock encryption to be identity functions for testing
jest.mock('../src/utils/encryption', () => ({
  encrypt: (v: string) => v,
  decrypt: (v: string) => v,
}));

const mockFindMany = jest.fn();
jest.mock('../src/utils/prisma', () => ({
  financialRecord: { findMany: (...args: unknown[]) => mockFindMany(...args) },
  farmer: { findMany: jest.fn() },
}));

import {
  calculateSeasonalSummary,
  getCategoryBreakdown,
} from '../src/services/financial.service';

describe('FinancialService', () => {
  beforeEach(() => {
    mockFindMany.mockReset();
  });

  describe('calculateSeasonalSummary', () => {
    it('returns zeros when no records', async () => {
      mockFindMany.mockResolvedValue([]);
      const result = await calculateSeasonalSummary('farmer-1', 'Season A 2025');
      expect(result.totalRevenue).toBe(0);
      expect(result.totalExpenses).toBe(0);
      expect(result.profit).toBe(0);
      expect(result.profitMargin).toBe(0);
    });

    it('returns negative profit for all expenses', async () => {
      mockFindMany.mockResolvedValue([
        { type: 'EXPENSE', category: 'Seeds', amount: '100', description: null },
        { type: 'EXPENSE', category: 'Labour', amount: '100', description: null },
        { type: 'EXPENSE', category: 'Transport', amount: '100', description: null },
      ]);
      const result = await calculateSeasonalSummary('farmer-1', 'Season A 2025');
      expect(result.totalExpenses).toBe(300);
      expect(result.totalRevenue).toBe(0);
      expect(result.profit).toBe(-300);
    });

    it('returns correct profit for all revenue', async () => {
      mockFindMany.mockResolvedValue([
        { type: 'REVENUE', category: 'Bean Sale', amount: '500', description: null },
        { type: 'REVENUE', category: 'Bean Sale', amount: '500', description: null },
      ]);
      const result = await calculateSeasonalSummary('farmer-1', 'Season A 2025');
      expect(result.totalRevenue).toBe(1000);
      expect(result.profit).toBe(1000);
    });

    it('calculates mixed records correctly', async () => {
      mockFindMany.mockResolvedValue([
        { type: 'REVENUE', category: 'Bean Sale', amount: '800', description: null },
        { type: 'EXPENSE', category: 'Seeds', amount: '150', description: null },
        { type: 'EXPENSE', category: 'Labour', amount: '150', description: null },
      ]);
      const result = await calculateSeasonalSummary('farmer-1', 'Season A 2025');
      expect(result.totalRevenue).toBe(800);
      expect(result.totalExpenses).toBe(300);
      expect(result.profit).toBe(500);
      expect(result.profitMargin).toBeCloseTo(62.5, 1);
    });
  });

  describe('getCategoryBreakdown', () => {
    it('groups by category correctly', async () => {
      mockFindMany.mockResolvedValue([
        { type: 'EXPENSE', category: 'Seeds', amount: '100', description: null },
        { type: 'EXPENSE', category: 'Seeds', amount: '50', description: null },
        { type: 'EXPENSE', category: 'Labour', amount: '200', description: null },
      ]);
      const result = await getCategoryBreakdown('farmer-1', 'Season A 2025');
      expect(result['Seeds'].count).toBe(2);
      expect(result['Seeds'].total).toBe(150);
      expect(result['Labour'].count).toBe(1);
    });
  });
});
