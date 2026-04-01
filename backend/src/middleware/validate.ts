import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Middleware factory: validate(schema)
 * Validates req.body against the provided Zod schema.
 * On failure, passes the ZodError to next() so the global errorHandler catches it.
 * On success, req.body is replaced with the parsed (coerced + stripped) value.
 *
 * @param schema - Zod schema to validate against
 */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(result.error);
      return;
    }
    // Replace body with parsed value (coercions applied, extra fields stripped)
    req.body = result.data;
    next();
  };
}
