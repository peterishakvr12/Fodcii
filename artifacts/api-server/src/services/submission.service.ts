import { eq } from "drizzle-orm";
import { db, submissionsTable } from "@workspace/db";
import { dbCircuitBreaker } from "../lib/circuit-breaker.js";

export interface TestCaseResult {
  description: string;
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  verdict?: string;
  executionTimeMs?: number;
  stderr?: string;
}

export interface CreateSubmissionParams {
  userId: number | null;
  problemId: number;
  code: string;
  language: string;
}

export interface UpdateSubmissionParams {
  status: string;
  passedTests: number;
  totalTests: number;
  executionTime?: number | null;
  testCasesJson?: TestCaseResult[];
  errorMessage?: string;
}

export async function createPendingSubmission(params: CreateSubmissionParams): Promise<number> {
  const [row] = await dbCircuitBreaker.execute(() =>
    db
      .insert(submissionsTable)
      .values({
        userId: params.userId,
        problemId: params.problemId,
        code: params.code,
        language: params.language,
        status: "pending",
      })
      .returning({ id: submissionsTable.id })
  );
  return row.id;
}

export async function updateSubmissionResult(
  submissionId: number,
  params: UpdateSubmissionParams
): Promise<void> {
  await dbCircuitBreaker.execute(() =>
    db
      .update(submissionsTable)
      .set({
        status: params.status,
        passedTests: params.passedTests,
        totalTests: params.totalTests,
        executionTime: params.executionTime ?? null,
        testCasesJson: params.testCasesJson ?? null,
        errorMessage: params.errorMessage ?? null,
        processedAt: new Date(),
      })
      .where(eq(submissionsTable.id, submissionId))
  );
}

export async function updateSubmissionStatus(
  submissionId: number,
  status: string
): Promise<void> {
  await dbCircuitBreaker.execute(() =>
    db
      .update(submissionsTable)
      .set({ status })
      .where(eq(submissionsTable.id, submissionId))
  );
}

export async function getSubmissionById(submissionId: number) {
  const [row] = await dbCircuitBreaker.execute(() =>
    db
      .select()
      .from(submissionsTable)
      .where(eq(submissionsTable.id, submissionId))
      .limit(1)
  );
  return row ?? null;
}
