import type { Request, Response } from "express";
import { metricsStore } from "../lib/metrics-store.js";
import { submissionQueue } from "../lib/submission-worker.js";
import { cache } from "../lib/cache.js";
import { dbCircuitBreaker } from "../lib/circuit-breaker.js";

export function getMetrics(_req: Request, res: Response) {
  const snapshot = metricsStore.getSnapshot();
  res.json({
    timestamp: new Date().toISOString(),
    metrics: snapshot,
  });
}

export function getLiveMetrics(_req: Request, res: Response) {
  const reqSnapshot = metricsStore.getSnapshot();
  const queueStats = submissionQueue.getStats();
  const cacheStats = cache.getStats();
  const circuitBreaker = dbCircuitBreaker.getStats();

  res.json({
    timestamp: new Date().toISOString(),
    requests: {
      total: reqSnapshot.totalRequests,
      failed: reqSnapshot.failedRequests,
      successRate: reqSnapshot.successRate,
      avgResponseTimeMs: reqSnapshot.averageResponseTimeMs,
    },
    queue: {
      pending: queueStats.pending,
      processing: queueStats.processing,
      completed: queueStats.completed,
      failed: queueStats.failed,
      avgProcessingTimeMs: queueStats.avgProcessingTimeMs,
      deadLetterCount: queueStats.failed,
    },
    submissions: {
      total: reqSnapshot.submissionsCount,
    },
    cache: cacheStats,
    circuitBreaker,
    uptime: {
      seconds: reqSnapshot.uptimeSeconds,
      human: formatUptime(reqSnapshot.uptimeSeconds),
    },
  });
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${d}d ${h}h ${m}m ${s}s`;
}
