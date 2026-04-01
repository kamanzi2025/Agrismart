import prisma from '../utils/prisma';
import { decrypt } from '../utils/encryption';
import { calculateSeasonalSummary } from './financial.service';

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Convert a season string to an approximate date range.
 * Season A = Mar–Jun, Season B = Sep–Dec.
 */
function getSeasonDateRange(season: string): { start: Date; end: Date } {
  // season format: "Season A 2025" or "Season B 2024"
  const parts = season.split(' ');
  const letter = parts[1]; // 'A' or 'B'
  const year = parseInt(parts[2] ?? parts[1], 10) || new Date().getFullYear();

  if (letter === 'A') {
    return {
      start: new Date(`${year}-03-01`),
      end: new Date(`${year}-06-30`),
    };
  } else {
    return {
      start: new Date(`${year}-09-01`),
      end: new Date(`${year}-12-31`),
    };
  }
}

// ─────────────────────────────────────────────────────────────────
// generateCooperativeReport
// ─────────────────────────────────────────────────────────────────

export async function generateCooperativeReport(cooperativeId: string, season: string) {
  // 1. Get cooperative with leader
  const cooperative = await prisma.cooperative.findFirst({
    where: { id: cooperativeId },
    include: { leader: { select: { name: true } } },
  });

  if (!cooperative) {
    throw new Error('COOPERATIVE_NOT_FOUND');
  }

  // 2. Get all farmers in cooperative with user data
  const farmers = await prisma.farmer.findMany({
    where: { cooperativeId },
    include: { user: { select: { id: true, name: true, phone: true } } },
  });

  const farmerIds = farmers.map((f) => f.userId);

  // 3. For each farmer: calculateSeasonalSummary
  const memberBreakdown = [];
  let totalRevenue = 0;
  let totalExpenses = 0;

  for (const farmer of farmers) {
    const summary = await calculateSeasonalSummary(farmer.userId, season);
    totalRevenue += summary.totalRevenue;
    totalExpenses += summary.totalExpenses;
    memberBreakdown.push({
      userId: farmer.userId,
      name: farmer.user.name,
      revenue: summary.totalRevenue,
      expenses: summary.totalExpenses,
      profit: summary.profit,
    });
  }

  const profit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  // 4. Get all PestReports for these farmers in the season date range
  const { start, end } = getSeasonDateRange(season);
  const pestReports =
    farmerIds.length > 0
      ? await prisma.pestReport.findMany({
          where: {
            farmerId: { in: farmerIds },
            createdAt: { gte: start, lte: end },
          },
        })
      : [];

  const pestSummary = {
    total: pestReports.length,
    pending: pestReports.filter((r) => r.status === 'PENDING').length,
    analyzed: pestReports.filter((r) => r.status === 'ANALYZED').length,
    resolved: pestReports.filter((r) => r.status === 'RESOLVED').length,
  };

  // 5. Group expenses by category across all farmers, calculate percentage of total expenses
  const expenseCategoryMap: Record<string, number> = {};

  if (farmerIds.length > 0) {
    const expenseRecords = await prisma.financialRecord.findMany({
      where: { farmerId: { in: farmerIds }, season, type: 'EXPENSE' },
    });

    for (const record of expenseRecords) {
      let amount = 0;
      try {
        amount = parseFloat(decrypt(record.amount.toString()));
        if (isNaN(amount)) amount = 0;
      } catch {
        amount = 0;
      }
      expenseCategoryMap[record.category] = (expenseCategoryMap[record.category] ?? 0) + amount;
    }
  }

  const topExpenseCategories = Object.entries(expenseCategoryMap)
    .map(([category, total]) => ({
      category,
      total,
      percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    season,
    cooperative: {
      id: cooperative.id,
      name: cooperative.name,
      region: cooperative.region,
      leaderName: cooperative.leader.name,
    },
    summary: {
      totalMembers: farmers.length,
      totalRevenue,
      totalExpenses,
      profit,
      profitMargin,
    },
    memberBreakdown,
    pestSummary,
    topExpenseCategories,
  };
}
