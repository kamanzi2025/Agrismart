import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import prisma from '../utils/prisma';

// ─────────────────────────────────────────────────────────────────
// POST /api/pest/report
// ─────────────────────────────────────────────────────────────────

export async function submitReport(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'Image file is required.' },
      });
      return;
    }

    const report = await prisma.pestReport.create({
      data: {
        farmerId: req.user!.id,
        imagePath: req.file.path,
        status: 'PENDING',
      },
    });

    res.status(201).json({
      success: true,
      data: {
        reportId: report.id,
        status: 'PENDING',
        message: 'Report submitted. An officer will review it.',
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// GET /api/pest/reports
// ─────────────────────────────────────────────────────────────────

export async function getReports(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status as string | undefined;

    const where: Record<string, unknown> = {
      farmerId: req.user!.id,
      ...(status ? { status } : {}),
    };

    const [reports, total] = await Promise.all([
      prisma.pestReport.findMany({
        where,
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
// GET /api/pest/report/:id
// ─────────────────────────────────────────────────────────────────

export async function getReport(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const report = await prisma.pestReport.findUnique({
      where: { id: req.params.id },
    });

    if (!report) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Pest report not found.' },
      });
      return;
    }

    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// GET /api/pest/library
// ─────────────────────────────────────────────────────────────────

export async function getPestLibrary(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const libraryPath = path.join(__dirname, '../data/pest-library.json');
    const raw = fs.readFileSync(libraryPath, 'utf8');
    let pests = JSON.parse(raw) as Array<{ name: string; [key: string]: unknown }>;

    const search = req.query.search as string | undefined;
    if (search) {
      const lower = search.toLowerCase();
      pests = pests.filter((p) => p.name.toLowerCase().includes(lower));
    }

    res.json({ success: true, data: { pests, total: pests.length } });
  } catch (err) {
    next(err);
  }
}
