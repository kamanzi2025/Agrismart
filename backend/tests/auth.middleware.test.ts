import { Request, Response, NextFunction } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

jest.mock('../src/utils/jwt', () => ({
  verifyAccessToken: jest.fn(),
}));

import { authenticateJWT } from '../src/middleware/authenticateJWT';
import { authorizeRole } from '../src/middleware/authorizeRole';
import { verifyAccessToken } from '../src/utils/jwt';

const mockVerify = verifyAccessToken as jest.MockedFunction<typeof verifyAccessToken>;

function makeReq(authHeader?: string): any {
  return { headers: authHeader ? { authorization: authHeader } : {} };
}

function makeRes(): any {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('authenticateJWT', () => {
  let next: NextFunction;
  beforeEach(() => { next = jest.fn(); mockVerify.mockReset(); });

  it('populates req.user and calls next() for valid token', () => {
    const user = { id: 'u1', role: 'FARMER' as any, phone: '+250' };
    mockVerify.mockReturnValue(user);
    const req = makeReq('Bearer valid-token');
    const res = makeRes();
    authenticateJWT(req, res, next);
    expect(req.user).toEqual(user);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 401 MISSING_TOKEN when Authorization header is absent', () => {
    const req = makeReq();
    const res = makeRes();
    authenticateJWT(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'MISSING_TOKEN' }) })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 MISSING_TOKEN for non-Bearer scheme', () => {
    const req = makeReq('Basic abc123');
    const res = makeRes();
    authenticateJWT(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'MISSING_TOKEN' }) })
    );
  });

  it('returns 401 TOKEN_EXPIRED for expired token', () => {
    mockVerify.mockImplementation(() => { throw new TokenExpiredError('jwt expired', new Date()); });
    const req = makeReq('Bearer expired-token');
    const res = makeRes();
    authenticateJWT(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'TOKEN_EXPIRED' }) })
    );
  });

  it('returns 401 INVALID_TOKEN for malformed token', () => {
    mockVerify.mockImplementation(() => { throw new JsonWebTokenError('invalid signature'); });
    const req = makeReq('Bearer bad-token');
    const res = makeRes();
    authenticateJWT(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'INVALID_TOKEN' }) })
    );
  });
});

describe('authorizeRole', () => {
  let next: NextFunction;
  beforeEach(() => { next = jest.fn(); });

  it('returns 403 FORBIDDEN when user role is not in allowed list', () => {
    const req = { user: { id: 'u1', role: 'FARMER', phone: '+250' } } as any;
    const res = makeRes();
    authorizeRole(['ADMIN'] as any)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'FORBIDDEN' }) })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() when role is in allowed list', () => {
    const req = { user: { id: 'u1', role: 'ADMIN', phone: '+250' } } as any;
    const res = makeRes();
    authorizeRole(['ADMIN'] as any)(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('calls next() for EXTENSION_OFFICER when both roles allowed', () => {
    const req = { user: { id: 'u1', role: 'EXTENSION_OFFICER', phone: '+250' } } as any;
    const res = makeRes();
    authorizeRole(['EXTENSION_OFFICER', 'ADMIN'] as any)(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('returns 403 when req.user is missing', () => {
    const req = {} as any;
    const res = makeRes();
    authorizeRole(['ADMIN'] as any)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
