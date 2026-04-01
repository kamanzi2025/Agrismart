import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import prisma from '../utils/prisma';
import { getCooperativeSummary } from '../services/financial.service';
import { generateCooperativeReport } from '../services/report.service';

// ─────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────

async function getMyCooperative(leaderId: string) {
  const coop = await prisma.cooperative.findFirst({ where: { leaderId } });
  if (!coop) throw new Error('COOPERATIVE_NOT_FOUND');
  return coop;
}

function getCurrentSeasonName(): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  if (month >= 3 && month <= 6) return `Season A ${year}`;
  if (month >= 9 && month <= 12) return `Season B ${year}`;
  return `Season B ${year - 1}`;
}

// ─────────────────────────────────────────────────────────────────
// GET /api/cooperative/overview
// ─────────────────────────────────────────────────────────────────

export async function getOverview(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    let cooperativeId: string;

    if (req.user!.role === Role.ADMIN) {
      cooperativeId = req.query.cooperativeId as string;
      if (!cooperativeId) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'cooperativeId query param is required for ADMIN.' },
        });
        return;
      }
    } else {
      const coop = await getMyCooperative(req.user!.id);
      cooperativeId = coop.id;
    }

    const cooperative = await prisma.cooperative.findUnique({
      where: { id: cooperativeId },
      include: { leader: { select: { name: true } } },
    });

    if (!cooperative) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Cooperative not found.' },
      });
      return;
    }

    const season = getCurrentSeasonName();
    const [memberCount, financialSummary] = await Promise.all([
      prisma.farmer.count({ where: { cooperativeId } }),
      getCooperativeSummary(cooperativeId, season),
    ]);

    // Count pending pest reports for all member farmers
    const farmerIds = financialSummary.byMember.map((m) => m.userId);
    const pendingPestCount =
      farmerIds.length > 0
        ? await prisma.pestReport.count({
            where: { farmerId: { in: farmerIds }, status: 'PENDING' },
          })
        : 0;

    res.json({
      success: true,
      data: {
        cooperative,
        memberCount,
        currentSeason: season,
        financialSummary,
        pendingPestReports: pendingPestCount,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// GET /api/cooperative/trends
// ─────────────────────────────────────────────────────────────────

export async function getTrends(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    let cooperativeId: string;

    if (req.user!.role === Role.ADMIN) {
      cooperativeId = req.query.cooperativeId as string;
      if (!cooperativeId) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'cooperativeId query param is required for ADMIN.' },
        });
        return;
      }
    } else {
      const coop = await getMyCooperative(req.user!.id);
      cooperativeId = coop.id;
    }

    const seasons = ['Season B 2023', 'Season A 2024', 'Season B 2024', 'Season A 2025'];
    const memberCount = await prisma.farmer.count({ where: { cooperativeId } });

    const trends = await Promise.all(
      seasons.map(async (season) => {
        const summary = await getCooperativeSummary(cooperativeId, season);
        const { memberCount: _ignore, ...summaryRest } = summary as unknown as Record<string, unknown>;
        return { season, memberCount, ...summaryRest };
      }),
    );

    res.json({ success: true, data: { trends } });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// GET /api/cooperative/members
// ─────────────────────────────────────────────────────────────────

export async function getMembers(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    let cooperativeId: string;

    if (req.user!.role === Role.ADMIN) {
      cooperativeId = req.query.cooperativeId as string;
      if (!cooperativeId) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'cooperativeId query param is required for ADMIN.' },
        });
        return;
      }
    } else {
      const coop = await getMyCooperative(req.user!.id);
      cooperativeId = coop.id;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string | undefined;
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { cooperativeId };
    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [farmers, total] = await Promise.all([
      prisma.farmer.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, phone: true, location: true, createdAt: true } },
          pestReports: { select: { id: true } },
        },
        skip,
        take: limit,
      }),
      prisma.farmer.count({ where }),
    ]);

    const members = farmers.map((f) => ({
      ...f,
      pestReportCount: f.pestReports.length,
      pestReports: undefined,
    }));

    res.json({ success: true, data: { members, total, page, limit } });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// GET /api/cooperative/report/:season
// ─────────────────────────────────────────────────────────────────

export async function getReport(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    let cooperativeId: string;

    if (req.user!.role === Role.ADMIN) {
      cooperativeId = req.query.cooperativeId as string;
      if (!cooperativeId) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'cooperativeId query param is required for ADMIN.' },
        });
        return;
      }
    } else {
      const coop = await getMyCooperative(req.user!.id);
      cooperativeId = coop.id;
    }

    const season = decodeURIComponent(req.params.season);
    const report = await generateCooperativeReport(cooperativeId, season);

    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
}
