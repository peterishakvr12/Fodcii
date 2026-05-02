import { eq, asc, sql } from "drizzle-orm";
import { db, problemsTable, testCasesTable, submissionsTable, userStatsTable } from "@workspace/db";
import type { InsertProblem, InsertTestCase } from "@workspace/db";

export interface CreateProblemInput {
  title: string;
  description: string;
  difficulty: string;
  category?: string;
  level?: number;
  examples?: unknown[];
  constraints?: unknown[];
  starterCode?: Record<string, string>;
  testCases: { input: string; expectedOutput: string; isSample?: boolean }[];
}

export async function listProblems(filters: {
  difficulty?: string;
  category?: string;
  level?: string;
  search?: string;
  userId?: number;
}) {
  const rows = await db
    .select({
      id: problemsTable.id,
      title: problemsTable.title,
      difficulty: problemsTable.difficulty,
      category: problemsTable.category,
      level: problemsTable.level,
      submissionsCount: problemsTable.submissionsCount,
      acceptanceRate: problemsTable.acceptanceRate,
      description: problemsTable.description,
    })
    .from(problemsTable)
    .orderBy(asc(problemsTable.id));

  let results = rows;

  if (filters.difficulty && filters.difficulty !== "All") {
    results = results.filter(
      (p) => p.difficulty.toLowerCase() === filters.difficulty!.toLowerCase()
    );
  }
  if (filters.category && filters.category !== "All") {
    results = results.filter((p) => p.category === filters.category);
  }
  if (filters.level && filters.level !== "All") {
    results = results.filter((p) => p.level.toString() === filters.level);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }

  let solvedSet = new Set<number>();
  if (filters.userId) {
    const solved = await db
      .select({ problemId: submissionsTable.problemId })
      .from(submissionsTable)
      .where(
        sql`${submissionsTable.userId} = ${filters.userId} AND ${submissionsTable.status} = 'accepted'`
      );
    solvedSet = new Set(solved.map((s) => s.problemId));
  }

  return results.map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    difficulty: p.difficulty,
    level: p.level,
    description: p.description,
    solved: solvedSet.has(p.id),
    submissions: p.submissionsCount,
    acceptanceRate: parseFloat(p.acceptanceRate ?? "0"),
  }));
}

export async function getProblemById(id: number, userId?: number) {
  const [problem] = await db
    .select()
    .from(problemsTable)
    .where(eq(problemsTable.id, id))
    .limit(1);

  if (!problem) return null;

  const testCases = await db
    .select()
    .from(testCasesTable)
    .where(eq(testCasesTable.problemId, id))
    .orderBy(asc(testCasesTable.id));

  let solved = false;
  if (userId) {
    const [s] = await db
      .select({ id: submissionsTable.id })
      .from(submissionsTable)
      .where(
        sql`${submissionsTable.userId} = ${userId} AND ${submissionsTable.problemId} = ${id} AND ${submissionsTable.status} = 'accepted'`
      )
      .limit(1);
    solved = !!s;
  }

  return {
    id: problem.id,
    title: problem.title,
    category: problem.category,
    difficulty: problem.difficulty,
    level: problem.level,
    description: problem.description,
    examples: problem.examples as unknown[],
    constraints: problem.constraints as string[],
    starterCode: problem.starterCode as Record<string, string>,
    solved,
    submissions: problem.submissionsCount,
    acceptanceRate: parseFloat(problem.acceptanceRate ?? "0"),
    testCases: testCases.map((tc) => ({
      id: tc.id,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      isSample: tc.isSample,
    })),
  };
}

export async function createProblem(input: CreateProblemInput) {
  const problemData: InsertProblem = {
    title: input.title,
    description: input.description,
    difficulty: input.difficulty,
    category: input.category ?? "Algorithms",
    level: input.level ?? 1,
    examples: input.examples ?? [],
    constraints: input.constraints ?? [],
    starterCode: input.starterCode ?? {},
    acceptanceRate: "0",
  };

  const [problem] = await db
    .insert(problemsTable)
    .values(problemData)
    .returning();

  if (input.testCases.length > 0) {
    const tcData: InsertTestCase[] = input.testCases.map((tc) => ({
      problemId: problem.id,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      isSample: tc.isSample ?? false,
    }));
    await db.insert(testCasesTable).values(tcData);
  }

  return getProblemById(problem.id);
}

function difficultyPoints(difficulty: string): number {
  switch (difficulty.toLowerCase()) {
    case "easy": return 10;
    case "medium": return 20;
    case "hard": return 30;
    default: return 10;
  }
}

export async function recordSubmission(params: {
  userId: number | null;
  problemId: number;
  code: string;
  language: string;
  status: string;
  passedTests: number;
  totalTests: number;
  executionTime?: number;
}) {
  const [submission] = await db
    .insert(submissionsTable)
    .values({
      userId: params.userId,
      problemId: params.problemId,
      code: params.code,
      language: params.language,
      status: params.status,
      passedTests: params.passedTests,
      totalTests: params.totalTests,
      executionTime: params.executionTime,
    })
    .returning({ id: submissionsTable.id });

  await db
    .update(problemsTable)
    .set({
      submissionsCount: sql`${problemsTable.submissionsCount} + 1`,
    })
    .where(eq(problemsTable.id, params.problemId));

  if (params.userId && params.status === "accepted") {
    const [problem] = await db
      .select({ difficulty: problemsTable.difficulty })
      .from(problemsTable)
      .where(eq(problemsTable.id, params.problemId))
      .limit(1);

    const alreadySolved = await db
      .select({ id: submissionsTable.id })
      .from(submissionsTable)
      .where(
        sql`${submissionsTable.userId} = ${params.userId} AND ${submissionsTable.problemId} = ${params.problemId} AND ${submissionsTable.status} = 'accepted' AND ${submissionsTable.id} != ${submission.id}`
      )
      .limit(1);

    const isFirstSolve = alreadySolved.length === 0;
    const pts = isFirstSolve && problem ? difficultyPoints(problem.difficulty) : 0;

    const today = new Date().toISOString().split("T")[0];

    const [existing] = await db
      .select()
      .from(userStatsTable)
      .where(eq(userStatsTable.userId, params.userId))
      .limit(1);

    if (!existing) {
      await db.insert(userStatsTable).values({
        userId: params.userId,
        points: pts,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: today,
      });
    } else {
      const lastDate = existing.lastActivityDate;
      let newStreak = existing.currentStreak;

      if (lastDate) {
        const last = new Date(lastDate);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - last.getTime()) / 86400000);
        if (diffDays === 1) {
          newStreak = existing.currentStreak + 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }

      const newLongest = Math.max(existing.longestStreak, newStreak);

      await db
        .update(userStatsTable)
        .set({
          points: existing.points + pts,
          currentStreak: newStreak,
          longestStreak: newLongest,
          lastActivityDate: today,
          updatedAt: new Date(),
        })
        .where(eq(userStatsTable.userId, params.userId));
    }
  }

  return submission;
}
