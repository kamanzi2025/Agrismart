import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Role, AdvisoryType } from '@prisma/client';
import prisma from '../utils/prisma';
import { calculateSeasonalSummary } from '../services/financial.service';
import { sendSMS } from '../services/notification.service';

// ─────────────────────────────────────────────────────────────────
// Helper: current season name
// ─────────────────────────────────────────────────────────────────

function getCurrentSeasonName(): string {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();
  if (month >= 3 && month <= 6) return `Season A ${year}`;
  if (month >= 9 && month <= 12) return `Season B ${year}`;
  // Off-season: return previous season B
  return `Season B ${year - 1}`;
}

// ─────────────────────────────────────────────────────────────────
// GET /api/officer/farmers
// ─────────────────────────────────────────────────────────────────

export async function getFarmers(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string | undefined;
    const skip = (page - 1) * limit;

    const isAdmin = req.user!.role === Role.ADMIN;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = isAdmin ? {} : { assignedOfficerId: req.user!.id };

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
          user: {
            select: { id: true, name: true, phone: true, location: true, createdAt: true },
          },
        },
        skip,
        take: limit,
      }),
      prisma.farmer.count({ where }),
    ]);

    res.json({ success: true, data: { farmers, total, page, limit } });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// GET /api/officer/farmer/:id
// ─────────────────────────────────────────────────────────────────

export async function getFarmerDetail(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const farmer = await prisma.farmer.findUnique({
      where: { userId: req.params.id },
      include: { user: true },
    });

    if (!farmer) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Farmer not found.' },
      });
      return;
    }

    const [lastPestReports, lastAdvisories] = await Promise.all([
      prisma.pestReport.findMany({
        where: { farmerId: req.params.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.advisory.findMany({
        where: { farmerId: req.params.id },
        orderBy: { dateGenerated: 'desc' },
        take: 5,
      }),
    ]);

    const season = getCurrentSeasonName();
    const financialSummary = await calculateSeasonalSummary(req.params.id, season);

    res.json({
      success: true,
      data: { farmer, lastPestReports, lastAdvisories, currentSeason: season, financialSummary },
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// GET /api/officer/pest-reports
// ─────────────────────────────────────────────────────────────────

export async function getPestReports(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const isAdmin = req.user!.role === Role.ADMIN;

    // Get assigned farmer IDs
    let farmerIds: string[] | undefined;
    if (!isAdmin) {
      const assignedFarmers = await prisma.farmer.findMany({
        where: { assignedOfficerId: req.user!.id },
        select: { userId: true },
      });
      farmerIds = assignedFarmers.map((f) => f.userId);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (farmerIds !== undefined) where.farmerId = { in: farmerIds };
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [reports, total] = await Promise.all([
      prisma.pestReport.findMany({
        where,
        include: {
          farmer: { include: { user: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.pestReport.count({ where }),
    ]);

    res.json({ success: true, data: { reports, total, page, limit } });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// PUT /api/pest/report/:id/diagnose
// ─────────────────────────────────────────────────────────────────

const diagnoseSchema = z.object({
  diagnosis: z.string().min(1),
  recommendation: z.string().min(1),
});

export async function diagnoseReport(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = diagnoseSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
      });
      return;
    }

    const { diagnosis, recommendation } = parsed.data;

    const report = await prisma.pestReport.findUnique({ where: { id: req.params.id } });
    if (!report) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Pest report not found.' },
      });
      return;
    }

    const [updatedReport] = await Promise.all([
      prisma.pestReport.update({
        where: { id: req.params.id },
        data: {
          diagnosis,
          recommendation,
          status: 'ANALYZED',
          analyzedByOfficerId: req.user!.id,
        },
      }),
      prisma.advisory.create({
        data: {
          farmerId: report.farmerId,
          officerId: req.user!.id,
          type: AdvisoryType.PEST,
          content: recommendation,
          isAutomated: false,
        },
      }),
    ]);

    // Send SMS notification to farmer
    try {
      const farmer = await prisma.user.findUnique({
        where: { id: report.farmerId },
        select: { phone: true },
      });
      if (farmer) {
        await sendSMS(
          farmer.phone,
          'Your pest report has been reviewed. Check your advisory inbox on AgriSmart.',
        );
      }
    } catch {
      // Non-critical: don't fail the request if SMS fails
    }

    res.json({ success: true, data: updatedReport });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// POST /api/advisory/send
// ─────────────────────────────────────────────────────────────────

const sendAdvisorySchema = z.object({
  farmerId: z.string().optional(),
  sendToAll: z.boolean().optional(),
  type: z.nativeEnum(AdvisoryType),
  content: z.string().min(1),
});

export async function sendAdvisory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = sendAdvisorySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
      });
      return;
    }

    const { farmerId, sendToAll, type, content } = parsed.data;

    let farmerIds: string[] = [];

    if (sendToAll) {
      const farmers = await prisma.farmer.findMany({
        where: { assignedOfficerId: req.user!.id },
        select: { userId: true },
      });
      farmerIds = farmers.map((f) => f.userId);
    } else if (farmerId) {
      farmerIds = [farmerId];
    } else {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Either farmerId or sendToAll is required.' },
      });
      return;
    }

    const advisories = await Promise.all(
      farmerIds.map((fId) =>
        prisma.advisory.create({
          data: {
            farmerId: fId,
            officerId: req.user!.id,
            type,
            content,
            isAutomated: false,
          },
        }),
      ),
    );

    res.status(201).json({
      success: true,
      data: { created: advisories.length, advisories },
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// GET /api/officer/analytics
// ─────────────────────────────────────────────────────────────────

export async function getAnalytics(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const isAdmin = req.user!.role === Role.ADMIN;
    const officerWhere = isAdmin ? {} : { assignedOfficerId: req.user!.id };

    const assignedFarmers = await prisma.farmer.findMany({
      where: officerWhere,
      select: { userId: true, farmSize: true },
    });

    const farmerIds = assignedFarmers.map((f) => f.userId);
    const season = getCurrentSeasonName();

    const [pendingCount, analyzedCount] = await Promise.all([
      prisma.pestReport.count({
        where: { farmerId: { in: farmerIds }, status: 'PENDING' },
      }),
      prisma.pestReport.count({
        where: { farmerId: { in: farmerIds }, status: 'ANALYZED' },
      }),
    ]);

    // Average farm size
    const totalSize = assignedFarmers.reduce((sum, f) => sum + f.farmSize, 0);
    const avgFarmSize = assignedFarmers.length > 0 ? totalSize / assignedFarmers.length : 0;

    // Financial summary across all assigned farmers
    let totalRevenue = 0;
    let totalExpenses = 0;
    for (const farmer of assignedFarmers) {
      const summary = await calculateSeasonalSummary(farmer.userId, season);
      totalRevenue += summary.totalRevenue;
      totalExpenses += summary.totalExpenses;
    }
    const avgProfit =
      assignedFarmers.length > 0
        ? (totalRevenue - totalExpenses) / assignedFarmers.length
        : 0;

    res.json({
      success: true,
      data: {
        totalAssignedFarmers: assignedFarmers.length,
        pendingPestReports: pendingCount,
        analyzedPestReports: analyzedCount,
        avgFarmSize,
        currentSeason: season,
        financialSummary: {
          totalRevenue,
          totalExpenses,
          profit: totalRevenue - totalExpenses,
          avgProfit,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
