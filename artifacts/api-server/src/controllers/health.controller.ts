import type { Request, Response } from "express";
import { pool } from "@workspace/db";
import { metricsStore } from "../lib/metrics-store.js";
import { submissionQueue } from "../lib/submission-worker.js";
import { dbCircuitBreaker } from "../lib/circuit-breaker.js";
import { cache } from "../lib/cache.js";

export async function healthCheck(_req: Request, res: Response) {
  const checks: Record<string, unknown> = {};
  let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy";

  const dbStart = Date.now();
  try {
    const cbState = dbCircuitBreaker.getStats();
    if (cbState.state === "open") {
      overallStatus = "unhealthy";
      checks.database = { status: "unhealthy", reason: "Circuit breaker OPEN", circuitBreaker: cbState };
    } else {
      await pool.query("SELECT 1");
      checks.database = {
        status: "healthy",
        latencyMs: Date.now() - dbStart,
        circuitBreaker: cbState,
      };
    }
  } catch (err) {
    overallStatus = "unhealthy";
    checks.database = {
      status: "unhealthy",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }

  const snap = metricsStore.getSnapshot();
  checks.api = {
    status: "healthy",
    uptimeSeconds: snap.uptimeSeconds,
    totalRequests: snap.totalRequests,
    averageResponseTimeMs: snap.averageResponseTimeMs,
  };

  const queueStats = submissionQueue.getStats();
  checks.queue = {
    status: "healthy",
    depth: queueStats.pending,
    processing: queueStats.processing,
    completed: queueStats.completed,
    failed: queueStats.failed,
    avgProcessingTimeMs: queueStats.avgProcessingTimeMs,
  };

  checks.cache = {
    status: "healthy",
    ...cache.getStats(),
  };

  checks.judgeEngine = {
    status: "active",
    mode: "in-process",
    note: "Judge engine runs within the API process. Scale via worker concurrency setting.",
  };

  const statusCode = overallStatus === "unhealthy" ? 503 : 200;

  res.status(statusCode).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? "0.0.0",
    environment: process.env.NODE_ENV ?? "development",
    checks,
  });
}
