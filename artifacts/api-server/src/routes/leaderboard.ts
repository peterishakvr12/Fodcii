import { Router } from "express";
import { db, usersTable, submissionsTable, userStatsTable, problemsTable } from "@workspace/db";
import { desc, eq, sql, count, countDistinct } from "drizzle-orm";
import { readRateLimit } from "../middleware/rate-limit.js";

const router = Router();

function getLevel(points: number): string {
  if (points >= 2000) return "Expert";
  if (points >= 1500) return "Advanced";
  if (points >= 500) return "Intermediate";
  return "Beginner";
}

router.get("/leaderboard", readRateLimit, async (req, res) => {
  try {
    const rows = await db
      .select({
        id: usersTable.id,
        name: usersTable.username,
        points: userStatsTable.points,
        currentStreak: userStatsTable.currentStreak,
      })
      .from(usersTable)
      .leftJoin(userStatsTable, eq(userStatsTable.userId, usersTable.id))
      .where(sql`${usersTable.role} = 'user'`)
      .orderBy(desc(sql`COALESCE(${userStatsTable.points}, 0)`));

    const [totalProblemsResult] = await db.select({ count: count() }).from(problemsTable);
    const totalProblems = Number(totalProblemsResult?.count ?? 0);

    const [totalUsersResult] = await db
      .select({ count: count() })
      .from(usersTable)
      .where(sql`${usersTable.role} = 'user'`);
    const totalUsers = Number(totalUsersResult?.count ?? 0);

    const solvedPerUser = await db
      .select({
        userId: submissionsTable.userId,
        count: countDistinct(submissionsTable.problemId),
      })
      .from(submissionsTable)
      .where(sql`${submissionsTable.status} = 'accepted'`)
      .groupBy(submissionsTable.userId);

    const solvedMap = new Map(solvedPerUser.map((r) => [r.userId, Number(r.count)]));

    const leaderboard = rows.map((user, index) => {
      const solved = solvedMap.get(user.id) ?? 0;
      const points = user.points ?? 0;
      return {
        id: user.id,
        rank: index + 1,
        name: user.name,
        avatar: "/diverse-user-avatars.png",
        solvedProblems: solved,
        totalProblems,
        points,
        streak: user.currentStreak ?? 0,
        level: getLevel(points),
      };
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [[activeTodayResult], [solvedTodayResult]] = await Promise.all([
      db
        .select({ count: countDistinct(submissionsTable.userId) })
        .from(submissionsTable)
        .where(sql`${submissionsTable.createdAt} >= ${todayStart}`),
      db
        .select({ count: countDistinct(submissionsTable.problemId) })
        .from(submissionsTable)
        .where(sql`${submissionsTable.createdAt} >= ${todayStart} AND ${submissionsTable.status} = 'accepted'`),
    ]);

    const activeToday = Number(activeTodayResult?.count ?? 0);
    const problemsSolvedToday = Number(solvedTodayResult?.count ?? 0);
    const totalSolved = leaderboard.reduce((sum, u) => sum + u.solvedProblems, 0);
    const averageProblems = totalUsers > 0 ? Math.round(totalSolved / totalUsers) : 0;

    return res.json({
      leaderboard,
      stats: { totalUsers, activeToday, problemsSolvedToday, averageProblems },
    });
  } catch (err: unknown) {
    const e = err as { message?: string };
    return res.status(500).json({ error: e.message ?? "Failed to fetch leaderboard" });
  }
});

router.get("/leaderboard/user/:rank", readRateLimit, async (req, res) => {
  const rank = parseInt(req.params.rank);
  if (isNaN(rank) || rank < 1) {
    return res.status(400).json({ error: "Invalid rank" });
  }

  try {
    const rows = await db
      .select({
        id: usersTable.id,
        name: usersTable.username,
        points: userStatsTable.points,
        currentStreak: userStatsTable.currentStreak,
      })
      .from(usersTable)
      .leftJoin(userStatsTable, eq(userStatsTable.userId, usersTable.id))
      .where(sql`${usersTable.role} = 'user'`)
      .orderBy(desc(sql`COALESCE(${userStatsTable.points}, 0)`));

    const userRow = rows[rank - 1];
    if (!userRow) {
      return res.status(404).json({ error: "User not found" });
    }

    const [[totalProblemsResult], [solvedResult]] = await Promise.all([
      db.select({ count: count() }).from(problemsTable),
      db
        .select({ count: countDistinct(submissionsTable.problemId) })
        .from(submissionsTable)
        .where(sql`${submissionsTable.userId} = ${userRow.id} AND ${submissionsTable.status} = 'accepted'`),
    ]);

    const totalProblems = Number(totalProblemsResult?.count ?? 0);
    const solved = Number(solvedResult?.count ?? 0);
    const points = userRow.points ?? 0;

    return res.json({
      user: {
        id: userRow.id,
        rank,
        name: userRow.name,
        avatar: "/diverse-user-avatars.png",
        solvedProblems: solved,
        totalProblems,
        points,
        streak: userRow.currentStreak ?? 0,
        level: getLevel(points),
      },
    });
  } catch (err: unknown) {
    const e = err as { message?: string };
    return res.status(500).json({ error: e.message ?? "Failed to fetch user" });
  }
});

export default router;
