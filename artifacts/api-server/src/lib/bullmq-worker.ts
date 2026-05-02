/**
 * bullmq-worker.ts — Standalone distributed judge worker (BullMQ / Redis)
 *
 * This file can run as an independent process for horizontal scaling:
 *
 *   REDIS_URL=redis://127.0.0.1:6379 node dist/bullmq-worker.mjs
 *
 * Multiple instances of this worker can run against the same Redis queue,
 * automatically distributing submissions across all available workers.
 *
 * Each worker:
 *  - Connects to Redis via REDIS_URL (default: redis://127.0.0.1:6379)
 *  - Pulls jobs from the "fodci-submissions" queue
 *  - Judges code in the secure sandbox (sandbox.ts)
 *  - Writes results to PostgreSQL via submission.service.ts
 *  - Handles SIGTERM/SIGINT for graceful shutdown
 *
 * BullMQ features used:
 *  - Concurrency-limited workers (configurable via WORKER_CONCURRENCY)
 *  - Exponential-backoff retry on failure (3 attempts)
 *  - Stalled-job detection (30s stall timeout)
 *  - Job progress events for real-time UI updates
 */

import { Worker, Queue } from "bullmq";
import IORedis from "ioredis";
import { judgeSubmission } from "./judge.js";
import {
  updateSubmissionResult,
  updateSubmissionStatus,
} from "../services/submission.service.js";
import { recordCompletedSubmission } from "../services/ranking.service.js";
import { metricsStore } from "./metrics-store.js";
import { cache, TAGS } from "./cache.js";
import { logger } from "./logger.js";
import type { SubmissionJobData } from "./submission-worker.js";

// ── Queue name (must match the producer) ─────────────────────────────────────
export const SUBMISSION_QUEUE_NAME = "fodci-submissions";

// ── Redis connection ──────────────────────────────────────────────────────────
function createRedisConnection() {
  const url = process.env["REDIS_URL"] ?? "redis://127.0.0.1:6379";
  const conn = new IORedis(url, {
    maxRetriesPerRequest: null,  // Required by BullMQ
    enableReadyCheck: false,
    lazyConnect: true,
  });
  conn.on("error", (err) => {
    logger.warn({ err: err.message }, "BullMQ Redis connection error");
  });
  return conn;
}

// ── Job processor (shared logic with in-process worker) ──────────────────────
export async function processSubmissionJob(
  job: { id?: string; data: SubmissionJobData; updateProgress: (v: number) => Promise<void> },
) {
  const { submissionId, problemId, code, language, userId, enqueuedAt } = job.data;
  const queueTimeMs = Date.now() - (enqueuedAt ?? Date.now());

  logger.info(
    { submissionId, problemId, language, userId, queueTimeMs, jobId: job.id },
    "BullMQ worker processing submission",
  );

  await job.updateProgress(10);
  await updateSubmissionStatus(submissionId, "processing");

  const judgment = await judgeSubmission(problemId, language, code, { failFast: true });
  await job.updateProgress(80);

  const { results, passedTests, totalTests, overallVerdict: status, totalExecutionTimeMs } = judgment;

  const testCasesJson = results.map((r) => ({
    description: r.description, input: r.input, expected: r.expected,
    actual: r.actual, passed: r.passed, verdict: r.verdict,
    executionTimeMs: r.executionTimeMs, stderr: r.stderr,
  }));

  await updateSubmissionResult(submissionId, {
    status, passedTests, totalTests,
    executionTime: totalExecutionTimeMs,
    testCasesJson,
  });

  try {
    const { isFirstSolve, pointsAwarded } = await recordCompletedSubmission({
      userId, problemId, status, executionTime: totalExecutionTimeMs,
    });
    if (isFirstSolve) {
      logger.info({ submissionId, userId, problemId, pointsAwarded }, "First solve");
    }
  } catch (err) {
    logger.error({ err, submissionId }, "Ranking update failed (non-fatal)");
  }

  metricsStore.recordSubmission();
  metricsStore.recordJudgment({ language, status, executionTimeMs: totalExecutionTimeMs, queueTimeMs });

  cache.invalidateByTag(TAGS.PROBLEMS);
  if (status === "accepted") cache.invalidateByTag(TAGS.LEADERBOARD);

  await job.updateProgress(100);
  logger.info({ submissionId, status, passedTests, totalTests }, "BullMQ worker done");

  return { status, passedTests, totalTests, totalExecutionTimeMs };
}

// ── Create a BullMQ Queue (producer side) ─────────────────────────────────────
export function createSubmissionQueue(connection: IORedis) {
  return new Queue<SubmissionJobData>(SUBMISSION_QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: { age: 3600, count: 1000 },
      removeOnFail: { age: 86400 },
    },
  });
}

// ── Start the standalone worker ───────────────────────────────────────────────
export async function startWorker() {
  const concurrency = parseInt(process.env["WORKER_CONCURRENCY"] ?? "4", 10);
  const connection  = createRedisConnection();

  logger.info(
    { queue: SUBMISSION_QUEUE_NAME, concurrency, redisUrl: process.env["REDIS_URL"] ?? "redis://127.0.0.1:6379" },
    "Starting BullMQ judge worker",
  );

  const worker = new Worker<SubmissionJobData>(
    SUBMISSION_QUEUE_NAME,
    async (job) => processSubmissionJob({
      id: job.id,
      data: job.data,
      updateProgress: (v) => job.updateProgress(v),
    }),
    {
      connection,
      concurrency,
      stalledInterval: 30_000,  // detect stalled jobs every 30s
      lockDuration:    60_000,  // job lock held for 60s
    },
  );

  worker.on("completed", (job) => {
    logger.info({ jobId: job.id, submissionId: job.data.submissionId }, "Job completed");
  });

  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, submissionId: job?.data.submissionId, err: err.message }, "Job failed");
  });

  worker.on("stalled", (jobId) => {
    logger.warn({ jobId }, "Job stalled — will be retried");
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutting down BullMQ worker...");
    await worker.close();
    await connection.quit();
    process.exit(0);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT",  () => void shutdown("SIGINT"));

  logger.info("BullMQ judge worker is ready and listening for jobs");
  return worker;
}

// ── Entrypoint when run directly ─────────────────────────────────────────────
// Usage: REDIS_URL=redis://... node dist/bullmq-worker.mjs
const isMain = process.argv[1]?.endsWith("bullmq-worker.mjs") ||
               process.argv[1]?.endsWith("bullmq-worker.js");

if (isMain) {
  startWorker().catch((err) => {
    logger.error({ err }, "Failed to start BullMQ worker");
    process.exit(1);
  });
}
