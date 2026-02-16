import { Router } from "express";
import { EntityStatus, Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/async-handler";
import { validateQuery } from "../../middleware/validate";

const dashboardQuerySchema = z.object({
  period: z.enum(["7d", "30d", "90d", "all"]).default("30d"),
  granularity: z.enum(["day"]).default("day"),
});

function periodStart(period: "7d" | "30d" | "90d" | "all"): Date | null {
  if (period === "all") return null;
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export const adminDashboardRouter = Router();

adminDashboardRouter.get(
  "/",
  validateQuery(dashboardQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.query as z.infer<typeof dashboardQuerySchema>;
    const since = periodStart(query.period);

    const attemptWhere = since ? { submittedAt: { gte: since } } : undefined;
    const userWhere = since ? { createdAt: { gte: since } } : undefined;

    const [totalUsers, activeUsers, totalAttempts, average, successCount] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: EntityStatus.ACTIVE } }),
      prisma.quizAttempt.count({ where: attemptWhere }),
      prisma.quizAttempt.aggregate({
        where: attemptWhere,
        _avg: { percentage: true },
      }),
      prisma.quizAttempt.count({
        where: {
          ...(attemptWhere || {}),
          percentage: { gte: 70 },
        },
      }),
    ]);

    const attemptsByDay = await prisma.$queryRaw<Array<{ day: Date; count: number }>>(
      Prisma.sql`SELECT DATE_TRUNC('day', "submittedAt") AS day, COUNT(*)::int AS count
                 FROM "QuizAttempt"
                 ${since ? Prisma.sql`WHERE "submittedAt" >= ${since}` : Prisma.empty}
                 GROUP BY day
                 ORDER BY day ASC`,
    );

    const successByDay = await prisma.$queryRaw<
      Array<{ day: Date; avg_percentage: number; success_count: number; total_count: number }>
    >(
      Prisma.sql`SELECT DATE_TRUNC('day', "submittedAt") AS day,
                        AVG("percentage")::float AS avg_percentage,
                        SUM(CASE WHEN "percentage" >= 70 THEN 1 ELSE 0 END)::int AS success_count,
                        COUNT(*)::int AS total_count
                 FROM "QuizAttempt"
                 ${since ? Prisma.sql`WHERE "submittedAt" >= ${since}` : Prisma.empty}
                 GROUP BY day
                 ORDER BY day ASC`,
    );

    const attemptByDirection = await prisma.quizAttempt.groupBy({
      by: ["directionId"],
      where: attemptWhere,
      _count: { _all: true },
    });

    const directionIds = attemptByDirection.map((row) => row.directionId);
    const directions = directionIds.length
      ? await prisma.quizDirection.findMany({
          where: { id: { in: directionIds } },
          select: { id: true, name: true },
        })
      : [];
    const directionNameMap = new Map(directions.map((direction) => [direction.id, direction.name]));

    const materialsByCategory = await prisma.material.groupBy({
      by: ["categoryId"],
      _count: { _all: true },
    });
    const categoryIds = materialsByCategory.map((row) => row.categoryId);
    const categories = categoryIds.length
      ? await prisma.category.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true },
        })
      : [];
    const categoryMap = new Map(categories.map((category) => [category.id, category.name]));

    const [newUsers, latestAttempts, recentAdminActions] = await Promise.all([
      prisma.user.findMany({
        where: userWhere,
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.quizAttempt.findMany({
        where: attemptWhere,
        orderBy: { submittedAt: "desc" },
        take: 10,
        select: {
          id: true,
          score: true,
          total: true,
          percentage: true,
          submittedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          direction: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.adminAuditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          createdAt: true,
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    res.json({
      kpi: {
        totalUsers,
        activeUsers,
        totalAttempts,
        averageScore: Number((average._avg.percentage || 0).toFixed(2)),
        successRate: totalAttempts > 0 ? Number(((successCount / totalAttempts) * 100).toFixed(2)) : 0,
      },
      charts: {
        attemptsByDay: attemptsByDay.map((row) => ({
          day: row.day,
          attempts: Number(row.count),
        })),
        successByDay: successByDay.map((row) => ({
          day: row.day,
          avgPercentage: Number(row.avg_percentage || 0),
          successCount: Number(row.success_count),
          totalCount: Number(row.total_count),
        })),
        attemptsByDirection: attemptByDirection
          .map((row) => ({
            directionId: row.directionId,
            directionName: directionNameMap.get(row.directionId) || row.directionId,
            attempts: row._count._all,
          }))
          .sort((a, b) => b.attempts - a.attempts),
        materialsByCategory: materialsByCategory
          .map((row) => ({
            categoryId: row.categoryId,
            categoryName: categoryMap.get(row.categoryId) || row.categoryId,
            materials: row._count._all,
          }))
          .sort((a, b) => b.materials - a.materials),
      },
      latest: {
        newUsers,
        latestAttempts,
        recentAdminActions,
      },
      filters: {
        period: query.period,
        granularity: query.granularity,
      },
    });
  }),
);
