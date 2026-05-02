import { eq, asc } from "drizzle-orm";
import { db, problemsTable, testCasesTable, submissionsTable } from "@workspace/db";
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
        p.category.toLowerCase().includes(q)
    );
  }

  return results.map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    difficulty: p.difficulty,
    level: p.level,
    solved: false,
    submissions: p.submissionsCount,
    acceptanceRate: parseFloat(p.acceptanceRate ?? "0"),
  }));
}

export async function getProblemById(id: number) {
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
    solved: false,
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

  if (params.status === "accepted") {
    await db
      .update(problemsTable)
      .set({
        submissionsCount: db.$count(
          submissionsTable,
          eq(submissionsTable.problemId, params.problemId)
        ) as unknown as number,
      })
      .where(eq(problemsTable.id, params.problemId));
  }

  return submission;
}
