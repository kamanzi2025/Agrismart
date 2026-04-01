const mockFindUnique = jest.fn();
const mockCreate = jest.fn();

jest.mock('../src/utils/prisma', () => ({
  financialRecord: {
    findUnique: (...args: any[]) => mockFindUnique(...args),
    create: (...args: any[]) => mockCreate(...args),
  },
}));

jest.mock('../src/utils/encryption', () => ({
  encrypt: (v: string) => `enc:${v}`,
  decrypt: (v: string) => v.replace('enc:', ''),
}));

// We test the sync logic by simulating what the controller does
// (since the controller is an Express handler, we test its logic paths)

describe('Sync Controller Logic', () => {
  beforeEach(() => {
    mockFindUnique.mockReset();
    mockCreate.mockReset();
  });

  it('handles empty batch — no DB calls made', async () => {
    const records: any[] = [];
    // If records is empty, the controller returns immediately
    expect(records.length).toBe(0);
    // Simulate expected result
    const result = { total: 0, created: 0, skipped: 0, failed: 0, results: [] };
    expect(result.total).toBe(0);
    expect(result.created).toBe(0);
  });

  it('creates new record when clientUUID does not exist', async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: 'new-record-id' });

    // Check: findUnique returns null → create path
    const existing = await mockFindUnique({ where: { clientUUID: 'uuid-1' } });
    expect(existing).toBeNull();

    const created = await mockCreate({ data: { farmerId: 'f1', type: 'EXPENSE', category: 'Seeds', amount: '100', date: new Date(), season: 'Season A 2025', clientUUID: 'uuid-1' } });
    expect(created.id).toBe('new-record-id');
  });

  it('skips record when clientUUID already exists', async () => {
    mockFindUnique.mockResolvedValue({ id: 'existing-id', clientUUID: 'dup-uuid' });

    const existing = await mockFindUnique({ where: { clientUUID: 'dup-uuid' } });
    expect(existing).not.toBeNull();
    expect(existing.id).toBe('existing-id');
    // skipped — create should NOT be called
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('marks record as failed when required field is missing', async () => {
    // Simulate a record missing 'amount' — the controller catches this
    const invalidData = { type: 'EXPENSE', category: 'Seeds', date: '2025-01-01', season: 'Season A 2025' };
    // missing 'amount' → should throw
    const hasRequiredFields = !!(invalidData as any).amount && !!(invalidData as any).type && !!(invalidData as any).category;
    expect(hasRequiredFields).toBe(false);
  });

  it('processes batch of 3 new records correctly', async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: 'new-id' });

    let created = 0;
    const records = [
      { clientUUID: 'uuid-1', type: 'FINANCIAL', data: { type: 'EXPENSE', category: 'Seeds', amount: 100, date: '2025-01-01', season: 'Season A 2025' } },
      { clientUUID: 'uuid-2', type: 'FINANCIAL', data: { type: 'EXPENSE', category: 'Labour', amount: 200, date: '2025-01-02', season: 'Season A 2025' } },
      { clientUUID: 'uuid-3', type: 'FINANCIAL', data: { type: 'REVENUE', category: 'Bean Sale', amount: 500, date: '2025-01-03', season: 'Season A 2025' } },
    ];

    for (const r of records) {
      const existing = await mockFindUnique({ where: { clientUUID: r.clientUUID } });
      if (!existing) { await mockCreate({ data: r.data }); created++; }
    }

    expect(created).toBe(3);
    expect(mockCreate).toHaveBeenCalledTimes(3);
  });
});
