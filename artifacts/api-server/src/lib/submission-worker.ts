/**
 * submission-worker.ts — Async submission processing queue
 *
 * In-process queue (JobQueue<T>) is the default.
 * When REDIS_URL is set, swap to BullMQ for horizontal scaling
 * (see bullmq-worker.ts for the standalone worker binary).
 */

import { JobQueue } from "./job-queue.js";
import { judgeSubmission } from "./judge.js";
import {
  updateSubmissionResult,
  updateSubmissionStatus,
} from "../services/submission.service.js";
import { recordCompletedSubmission } from "../services/ranking.service.js";
import { metricsStore } from "./metrics-store.js";
import { cache, TAGS } from "./cache.js";
import { logger } from "./logger.js";
import type { Job } from "./job-queue.js";

export interface SubmissionJobData {
  submissionId: number;
  problemId: number;
  code: string;
  language: string;
  userId: number | null;
  enqueuedAt: number;        // epoch ms — used to compute queue latency
}

async function processSubmission(job: Job<SubmissionJobData>): Promise<void> {
  const { submissionId, problemId, code, language, userId, enqueuedAt } = job.data;
  const queueTimeMs = Date.now() - enqueuedAt;

  logger.info(
    { submissionId, problemId, language, userId, queueTimeMs, jobId: job.id },
    "Processing submission",
  );

  await updateSubmissionStatus(submissionId, "processing");

  // ── Judge ────────────────────────────────────────────────────────────────
  const judgment = await judgeSubmission(problemId, language, code, { failFast: true });

  const {
    results,
    passedTests,
    totalTests,
    overallVerdict: status,
    totalExecutionTimeMs,
  } = judgment;

  const testCasesJson = results.map((r) => ({
    description:    r.description,
    input:          r.input,
    expected:       r.expected,
    actual:         r.actual,
    passed:         r.passed,
    verdict:        r.verdict,
    executionTimeMs: r.executionTimeMs,
    stderr:         r.stderr,
  }));

  // ── Persist result ───────────────────────────────────────────────────────
  await updateSubmissionResult(submissionId, {
    status,
    passedTests,
    totalTests,
    executionTime: totalExecutionTimeMs,
    testCasesJson,
  });

  // ── Update ranking + problem stats ───────────────────────────────────────
  try {
    const { isFirstSolve, pointsAwarded } = await recordCompletedSubmission({
      userId,
      problemId,
      status,
      executionTime: totalExecutionTimeMs,
    });

    if (isFirstSolve) {
      logger.info(
        { submissionId, userId, problemId, pointsAwarded },
        "First solve — leaderboard updated",
      );
    }
  } catch (err) {
    logger.error({ err, submissionId, userId }, "Ranking update failed (non-fatal)");
  }

  // ── Metrics ──────────────────────────────────────────────────────────────
  metricsStore.recordSubmission();
  metricsStore.recordJudgment({
    language,
    status,
    executionTimeMs: totalExecutionTimeMs,
    queueTimeMs,
  });

  // ── Cache invalidation ───────────────────────────────────────────────────
  cache.invalidateByTag(TAGS.PROBLEMS);
  if (status === "accepted") {
    cache.invalidateByTag(TAGS.LEADERBOARD);
  }

  logger.info(
    { submissionId, status, passedTests, totalTests, totalExecutionTimeMs, jobId: job.id },
    "Submission processed",
  );
}

export const submissionQueue = new JobQueue<SubmissionJobData>(processSubmission, {
  concurrency: 4,
  maxRetries: 3,
  retryBaseDelayMs: 2000,
});
