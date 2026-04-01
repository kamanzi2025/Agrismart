import { Role, Language } from '@prisma/client';

/** Attached to req.user after JWT verification */
export interface AuthUser {
  id: string;
  role: Role;
  phone: string;
}

/** Standard API success response */
export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
}

/** Standard API error response */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

/** Extend Express Request to include authenticated user */
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export { Role, Language };
