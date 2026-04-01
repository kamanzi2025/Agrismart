import { Request, Response, NextFunction } from 'express';
import { FinancialType } from '@prisma/client';
import prisma from '../utils/prisma';
import { encrypt } from '../utils/encryption';

interface SyncRecord {
  clientUUID: string;
  type: 'FINANCIAL' | 'PEST_REPORT';
  data: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────
// POST /api/sync
// ─────────────────────────────────────────────────────────────────

export async function sync(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { records } = req.body as { records: SyncRecord[] };

    if (!records || records.length === 0) {
      res.json({
        success: true,
        data: { total: 0, created: 0, skipped: 0, failed: 0, results: [] },
      });
      return;
    }

    const results: Array<{
      clientUUID: string;
      status: string;
      id?: string;
      reason?: string;
    }> = [];
    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const record of records) {
      try {
        if (record.type === 'FINANCIAL') {
          const existing = await prisma.financialRecord.findUnique({
            where: { clientUUID: record.clientUUID },
          });

          if (existing) {
            results.push({ clientUUID: record.clientUUID, status: 'skipped', id: existing.id });
            skipped++;
            continue;
          }

          // Validate required fields
          const d = record.data as {
            type?: string;
            category?: string;
            amount?: number;
            date?: string;
            season?: string;
            description?: string;
          };

          if (!d.type || !d.category || !d.amount || !d.date || !d.season) {
            throw new Error('Missing required fields');
          }

          // Validate type is a valid FinancialType
          if (!Object.values(FinancialType).includes(d.type as FinancialType)) {
            throw new Error(`Invalid type: ${d.type}`);
          }

          const encAmount = encrypt(String(d.amount));
          const newRecord = await prisma.financialRecord.create({
            data: {
              farmerId: req.user!.id,
              type: d.type as FinancialType,
              category: d.category,
              amount: encAmount,
              description: d.description ? encrypt(d.description) : null,
              date: new Date(d.date),
              season: d.season,
              clientUUID: record.clientUUID,
            },
          });

          results.push({ clientUUID: record.clientUUID, status: 'created', id: newRecord.id });
          created++;
        } else {
          results.push({
            clientUUID: record.clientUUID,
            status: 'failed',
            reason: 'PEST_REPORT sync not supported via batch',
          });
          failed++;
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        results.push({ clientUUID: record.clientUUID, status: 'failed', reason: message });
        failed++;
      }
    }

    res.json({
      success: true,
      data: { total: records.length, created, skipped, failed, results },
    });
  } catch (err) {
    next(err);
  }
}
