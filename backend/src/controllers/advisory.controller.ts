import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import {
  generatePlantingAdvice,
  generateSoilAdvice,
} from '../services/advisoryEngine.service';

// ─────────────────────────────────────────────────────────────────
// GET /api/advisory/planting
// ─────────────────────────────────────────────────────────────────

export async function getPlantingAdvisory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const farmer = await prisma.farmer.findUnique({
      where: { userId: req.user!.id },
      include: { user: true },
    });

    if (!farmer) {
      res.status(404).json({
        success: false,
        error: { code: 'FARMER_NOT_FOUND', message: 'Farmer profile not found.' },
      });
      return;
    }

    const loc = farmer.user.location as { lat: number; lng: number; region: string };
    const result = await generatePlantingAdvice(loc.lat, loc.lng, loc.region);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// GET /api/advisory/soil
// ─────────────────────────────────────────────────────────────────

export async function getSoilAdvisory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const farmer = await prisma.farmer.findUnique({
      where: { userId: req.user!.id },
      include: { user: true },
    });

    if (!farmer) {
      res.status(404).json({
        success: false,
        error: { code: 'FARMER_NOT_FOUND', message: 'Farmer profile not found.' },
      });
      return;
    }

    const loc = farmer.user.location as { lat: number; lng: number; region: string };
    const result = generateSoilAdvice(farmer.soilType ?? 'loam', loc.region);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// GET /api/advisory/messages
// ─────────────────────────────────────────────────────────────────

export async function getMessages(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [advisories, total] = await Promise.all([
      prisma.advisory.findMany({
        where: { farmerId: req.user!.id },
        orderBy: { dateGenerated: 'desc' },
        skip,
        take: limit,
      }),
      prisma.advisory.count({ where: { farmerId: req.user!.id } }),
    ]);

    res.json({ success: true, data: { advisories, total, page, limit } });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// PATCH /api/advisory/:id/read
// ─────────────────────────────────────────────────────────────────

export async function markRead(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const updated = await prisma.advisory.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}
