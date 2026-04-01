import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { FinancialType } from '@prisma/client';
import prisma from '../utils/prisma';
import { encrypt, decrypt } from '../utils/encryption';
import { calculateSeasonalSummary } from '../services/financial.service';

// ─────────────────────────────────────────────────────────────────
// Zod schema
// ─────────────────────────────────────────────────────────────────

const recordSchema = z.object({
  type: z.nativeEnum(FinancialType),
  category: z.string().min(1),
  amount: z.number().positive(),
  description: z.string().optional(),
  date: z.string(),
  season: z.string().min(1),
  clientUUID: z.string().uuid(),
});

// ─────────────────────────────────────────────────────────────────
// POST /api/finance/record
// ─────────────────────────────────────────────────────────────────

export async function createRecord(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = recordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
      });
      return;
    }

    const data = parsed.data;

    // Idempotency check
    const existing = await prisma.financialRecord.findUnique({
      where: { clientUUID: data.clientUUID },
    });

    if (existing) {
      let amount = 0;
      try {
        amount = parseFloat(decrypt(existing.amount.toString()));
      } catch {
        amount = 0;
      }
      let description: string | null = null;
      if (existing.description) {
        try {
          description = decrypt(existing.description);
        } catch {
          description = null;
        }
      }
      res.json({
        success: true,
        data: { ...existing, amount, description },
      });
      return;
    }

    // Encrypt fields
    const encryptedAmount = encrypt(String(data.amount));
    const encryptedDescription = data.description ? encrypt(data.description) : null;

    const record = await prisma.financialRecord.create({
      data: {
        farmerId: req.user!.id,
        type: data.type,
        category: data.category,
        amount: encryptedAmount,
        description: encryptedDescription,
        date: new Date(data.date),
        season: data.season,
        clientUUID: data.clientUUID,
      },
    });

    // Decrypt for response
    const responseAmount = parseFloat(decrypt(record.amount.toString()));
    let responseDescription: string | null = null;
    if (record.description) {
      try {
        responseDescription = decrypt(record.description);
      } catch {
        responseDescription = null;
      }
    }

    res.status(201).json({
      success: true,
      data: { ...record, amount: responseAmount, description: responseDescription },
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// GET /api/finance/records
// ─────────────────────────────────────────────────────────────────

export async function getRecords(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const season = req.query.season as string | undefined;
    const type = req.query.type as FinancialType | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { farmerId: req.user!.id };
    if (season) where.season = season;
    if (type) where.type = type;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [records, total] = await Promise.all([
      prisma.financialRecord.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.financialRecord.count({ where }),
    ]);

    // Decrypt each record
    const decrypted = records.map((r) => {
      let amount = 0;
      try {
        amount = parseFloat(decrypt(r.amount.toString()));
      } catch {
        amount = 0;
      }
      let description: string | null = null;
      if (r.description) {
        try {
          description = decrypt(r.description);
        } catch {
          description = null;
        }
      }
      return { ...r, amount, description };
    });

    res.json({ success: true, data: { records: decrypted, total, page, limit } });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// DELETE /api/finance/record/:id
// ─────────────────────────────────────────────────────────────────

export async function deleteRecord(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await prisma.financialRecord.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: { message: 'Record deleted.' } });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// GET /api/finance/summary
// ─────────────────────────────────────────────────────────────────

export async function getSummary(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const season = req.query.season as string | undefined;
    if (!season) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'season query parameter is required.' },
      });
      return;
    }

    const summary = await calculateSeasonalSummary(req.user!.id, season);
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
}
