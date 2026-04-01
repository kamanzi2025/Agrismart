const mockCoopFindFirst = jest.fn();
const mockFarmerFindMany = jest.fn();
const mockFarmerCount = jest.fn();
const mockFinancialFindMany = jest.fn();
const mockPestFindMany = jest.fn();
const mockPestCount = jest.fn();

jest.mock('../src/utils/prisma', () => ({
  cooperative: { findFirst: (...args: any[]) => mockCoopFindFirst(...args) },
  farmer: {
    findMany: (...args: any[]) => mockFarmerFindMany(...args),
    count: (...args: any[]) => mockFarmerCount(...args),
  },
  financialRecord: { findMany: (...args: any[]) => mockFinancialFindMany(...args) },
  pestReport: {
    findMany: (...args: any[]) => mockPestFindMany(...args),
    count: (...args: any[]) => mockPestCount(...args),
  },
}));

jest.mock('../src/utils/encryption', () => ({
  encrypt: (v: string) => v,
  decrypt: (v: string) => v,
}));

import { generateCooperativeReport } from '../src/services/report.service';

const MOCK_COOP = {
  id: 'coop-1',
  name: 'Kigali Farmers',
  region: 'Kigali',
  leaderId: 'leader-1',
  leader: { name: 'Jean Pierre' },
};

const MOCK_FARMERS = [
  { userId: 'f1', farmSize: 2, user: { name: 'Alice', phone: '+250781111111' } },
  { userId: 'f2', farmSize: 1.5, user: { name: 'Bob', phone: '+250782222222' } },
  { userId: 'f3', farmSize: 3, user: { name: 'Carol', phone: '+250783333333' } },
];

describe('generateCooperativeReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCoopFindFirst.mockResolvedValue(MOCK_COOP);
    mockFarmerFindMany.mockResolvedValue(MOCK_FARMERS);
    mockFarmerCount.mockResolvedValue(3);
    // Each farmer: 1 REVENUE 1000, 1 EXPENSE 400
    mockFinancialFindMany.mockResolvedValue([
      { type: 'REVENUE', category: 'Bean Sale', amount: '1000', description: null },
      { type: 'EXPENSE', category: 'Seeds', amount: '400', description: null },
    ]);
    mockPestFindMany.mockResolvedValue([]);
    mockPestCount.mockResolvedValue(0);
  });

  it('aggregates revenue and expenses correctly across 3 farmers', async () => {
    const report = await generateCooperativeReport('coop-1', 'Season A 2025');

    expect(report.summary.totalMembers).toBe(3);
    // Each farmer: 1000 revenue × 3 = 3000
    expect(report.summary.totalRevenue).toBe(3000);
    // Each farmer: 400 expense × 3 = 1200
    expect(report.summary.totalExpenses).toBe(1200);
    expect(report.summary.profit).toBe(1800);
  });

  it('includes one entry per member in memberBreakdown', async () => {
    const report = await generateCooperativeReport('coop-1', 'Season A 2025');
    expect(report.memberBreakdown.length).toBe(3);
    expect(report.memberBreakdown[0]).toHaveProperty('name');
    expect(report.memberBreakdown[0]).toHaveProperty('revenue');
    expect(report.memberBreakdown[0]).toHaveProperty('expenses');
    expect(report.memberBreakdown[0]).toHaveProperty('profit');
  });

  it('counts pending and analyzed pest reports correctly', async () => {
    mockPestFindMany.mockResolvedValue([
      { id: 'p1', status: 'PENDING' },
      { id: 'p2', status: 'ANALYZED' },
      { id: 'p3', status: 'PENDING' },
    ]);
    mockPestCount.mockResolvedValue(3);

    const report = await generateCooperativeReport('coop-1', 'Season A 2025');
    expect(report.pestSummary.total).toBe(3);
    expect(report.pestSummary.pending).toBe(2);
    expect(report.pestSummary.analyzed).toBe(1);
    expect(report.pestSummary.resolved).toBe(0);
  });

  it('returns correct cooperative metadata', async () => {
    const report = await generateCooperativeReport('coop-1', 'Season A 2025');
    expect(report.cooperative.name).toBe('Kigali Farmers');
    expect(report.cooperative.region).toBe('Kigali');
    expect(report.season).toBe('Season A 2025');
  });

  it('handles zero members gracefully', async () => {
    mockFarmerFindMany.mockResolvedValue([]);
    mockFarmerCount.mockResolvedValue(0);
    const report = await generateCooperativeReport('coop-1', 'Season A 2025');
    expect(report.summary.totalMembers).toBe(0);
    expect(report.summary.totalRevenue).toBe(0);
    expect(report.summary.profit).toBe(0);
  });
});
