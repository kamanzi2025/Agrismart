import { FinancialType } from '@prisma/client';
import prisma from '../utils/prisma';
import { decrypt } from '../utils/encryption';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface CategorySummary {
  category: string;
  total: number;
  count: number;
  type?: FinancialType;
}

interface SeasonalSummary {
  season: string;
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  profitMargin: number;
  byCategory: CategorySummary[];
}

interface MemberSummary {
  userId: string;
  name: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface CooperativeSummary {
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  memberCount: number;
  byMember: MemberSummary[];
}

// ─────────────────────────────────────────────────────────────────
// calculateSeasonalSummary
// ─────────────────────────────────────────────────────────────────

export async function calculateSeasonalSummary(
  farmerId: string,
  season: string,
): Promise<SeasonalSummary> {
  const records = await prisma.financialRecord.findMany({
    where: { farmerId, season },
  });

  let totalRevenue = 0;
  let totalExpenses = 0;
  const categoryMap: Record<string, CategorySummary> = {};

  for (const record of records) {
    let amount = 0;
    try {
      amount = parseFloat(decrypt(record.amount.toString()));
      if (isNaN(amount)) amount = 0;
    } catch {
      amount = 0;
    }

    if (record.type === FinancialType.REVENUE) {
      totalRevenue += amount;
    } else {
      totalExpenses += amount;
    }

    const cat = record.category;
    if (!categoryMap[cat]) {
      categoryMap[cat] = { category: cat, total: 0, count: 0, type: record.type };
    }
    categoryMap[cat].total += amount;
    categoryMap[cat].count += 1;
  }

  const profit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  return {
    season,
    totalRevenue,
    totalExpenses,
    profit,
    profitMargin,
    byCategory: Object.values(categoryMap),
  };
}

// ─────────────────────────────────────────────────────────────────
// getCategoryBreakdown
// ─────────────────────────────────────────────────────────────────

export async function getCategoryBreakdown(
  farmerId: string,
  season: string,
): Promise<Record<string, CategorySummary>> {
  const records = await prisma.financialRecord.findMany({
    where: { farmerId, season },
  });

  const categoryMap: Record<string, CategorySummary> = {};

  for (const record of records) {
    let amount = 0;
    try {
      amount = parseFloat(decrypt(record.amount.toString()));
      if (isNaN(amount)) amount = 0;
    } catch {
      amount = 0;
    }

    const cat = record.category;
    if (!categoryMap[cat]) {
      categoryMap[cat] = { category: cat, total: 0, count: 0, type: record.type };
    }
    categoryMap[cat].total += amount;
    categoryMap[cat].count += 1;
  }

  return categoryMap;
}

// ─────────────────────────────────────────────────────────────────
// getCooperativeSummary
// ─────────────────────────────────────────────────────────────────

export async function getCooperativeSummary(
  cooperativeId: string,
  season: string,
): Promise<CooperativeSummary> {
  const farmers = await prisma.farmer.findMany({
    where: { cooperativeId },
    include: { user: { select: { id: true, name: true } } },
  });

  let totalRevenue = 0;
  let totalExpenses = 0;
  const byMember: MemberSummary[] = [];

  for (const farmer of farmers) {
    const summary = await calculateSeasonalSummary(farmer.userId, season);
    totalRevenue += summary.totalRevenue;
    totalExpenses += summary.totalExpenses;
    byMember.push({
      userId: farmer.userId,
      name: farmer.user.name,
      revenue: summary.totalRevenue,
      expenses: summary.totalExpenses,
      profit: summary.profit,
    });
  }

  const profit = totalRevenue - totalExpenses;

  return {
    totalRevenue,
    totalExpenses,
    profit,
    memberCount: farmers.length,
    byMember,
  };
}
