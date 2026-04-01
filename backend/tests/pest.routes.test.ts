// Mock JWT so we can control the user for each test
const mockVerify = jest.fn();
jest.mock('../src/utils/jwt', () => ({
  verifyAccessToken: (...args: any[]) => mockVerify(...args),
}));

// Mock Prisma
const mockPestCreate = jest.fn();
const mockPestFindUnique = jest.fn();
const mockPestFindMany = jest.fn();
const mockPestCount = jest.fn();
const mockPestUpdate = jest.fn();
const mockAdvisoryCreate = jest.fn();
const mockUserFindUnique = jest.fn();

jest.mock('../src/utils/prisma', () => ({
  pestReport: {
    create: (...args: any[]) => mockPestCreate(...args),
    findUnique: (...args: any[]) => mockPestFindUnique(...args),
    findMany: (...args: any[]) => mockPestFindMany(...args),
    count: (...args: any[]) => mockPestCount(...args),
    update: (...args: any[]) => mockPestUpdate(...args),
  },
  advisory: { create: (...args: any[]) => mockAdvisoryCreate(...args) },
  user: { findUnique: (...args: any[]) => mockUserFindUnique(...args) },
  farmer: { findMany: jest.fn().mockResolvedValue([]) },
  auditLog: { create: jest.fn().mockResolvedValue({}) },
}));

jest.mock('../src/services/notification.service', () => ({
  sendSMS: jest.fn().mockResolvedValue(undefined),
}));

import request from 'supertest';
import app from '../src/app';

beforeEach(() => {
  jest.clearAllMocks();
  mockPestFindMany.mockResolvedValue([]);
  mockPestCount.mockResolvedValue(0);
});

describe('GET /api/pest/library', () => {
  it('returns pest list for any authenticated user', async () => {
    mockVerify.mockReturnValue({ id: 'u1', role: 'FARMER', phone: '+250' });
    const res = await request(app)
      .get('/api/pest/library')
      .set('Authorization', 'Bearer valid-token');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.pests)).toBe(true);
    expect(res.body.data.pests.length).toBeGreaterThan(0);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/pest/library');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/pest/report/:id/diagnose', () => {
  it('returns 403 when a FARMER tries to diagnose', async () => {
    mockVerify.mockReturnValue({ id: 'farmer-1', role: 'FARMER', phone: '+250' });
    const res = await request(app)
      .put('/api/pest/report/some-id/diagnose')
      .set('Authorization', 'Bearer farmer-token')
      .send({ diagnosis: 'Bean rust detected', recommendation: 'Apply fungicide' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 404 when report does not exist (officer)', async () => {
    mockVerify.mockReturnValue({ id: 'officer-1', role: 'EXTENSION_OFFICER', phone: '+250' });
    mockPestFindUnique.mockResolvedValue(null);
    const res = await request(app)
      .put('/api/pest/report/nonexistent-id/diagnose')
      .set('Authorization', 'Bearer officer-token')
      .send({ diagnosis: 'Bean rust detected', recommendation: 'Apply fungicide' });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/pest/reports', () => {
  it('returns empty list for farmer with no reports', async () => {
    mockVerify.mockReturnValue({ id: 'farmer-1', role: 'FARMER', phone: '+250' });
    mockPestFindMany.mockResolvedValue([]);
    mockPestCount.mockResolvedValue(0);
    const res = await request(app)
      .get('/api/pest/reports')
      .set('Authorization', 'Bearer farmer-token');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
