import { randomUUID } from "crypto";
import { logger } from "./logger.js";

export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface Job<T> {
  id: string;
  data: T;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  processedAt?: number;
  error?: string;
}

export interface QueueOptions {
  concurrency: number;
  maxRetries: number;
  retryBaseDelayMs: number;
  gcIntervalMs: number;
  gcMaxAgeMs: number;
}

const DEFAULT_OPTIONS: QueueOptions = {
  concurrency: 4,
  maxRetries: 3,
  retryBaseDelayMs: 1000,
  gcIntervalMs: 300_000,
  gcMaxAgeMs: 3_600_000,
};

export class JobQueue<T> {
  private jobs = new Map<string, Job<T>>();
  private pendingIds: string[] = [];
  private processingCount = 0;
  private completedCount = 0;
  private failedCount = 0;
  private totalProcessingTimeMs = 0;
  private opts: QueueOptions;

  constructor(
    private processor: (job: Job<T>) => Promise<void>,
    options: Partial<QueueOptions> = {}
  ) {
    this.opts = { ...DEFAULT_OPTIONS, ...options };
    const gcTimer = setInterval(() => this.gc(), this.opts.gcIntervalMs);
    if (typeof gcTimer.unref === "function") gcTimer.unref();
  }

  enqueue(data: T): string {
    const id = randomUUID();
    const job: Job<T> = {
      id,
      data,
      status: "pending",
      attempts: 0,
      maxAttempts: this.opts.maxRetries + 1,
      createdAt: Date.now(),
    };
    this.jobs.set(id, job);
    this.pendingIds.push(id);
    setImmediate(() => this.tick());
    return id;
  }

  getJob(id: string): Job<T> | undefined {
    return this.jobs.get(id);
  }

  getStats() {
    return {
      pending: this.pendingIds.length,
      processing: this.processingCount,
      completed: this.completedCount,
      failed: this.failedCount,
      total: this.jobs.size,
      avgProcessingTimeMs:
        this.completedCount > 0
          ? Math.round(this.totalProcessingTimeMs / this.completedCount)
          : 0,
    };
  }

  private tick() {
    while (
      this.processingCount < this.opts.concurrency &&
      this.pendingIds.length > 0
    ) {
      const id = this.pendingIds.shift()!;
      void this.processJob(id);
    }
  }

  private async processJob(id: string) {
    const job = this.jobs.get(id);
    if (!job) return;

    job.status = "processing";
    job.attempts++;
    this.processingCount++;
    const start = Date.now();

    try {
      await this.processor(job);
      job.status = "completed";
      job.processedAt = Date.now();
      this.completedCount++;
      this.totalProcessingTimeMs += Date.now() - start;
    } catch (err) {
      const delay =
        this.opts.retryBaseDelayMs * Math.pow(2, job.attempts - 1);

      if (job.attempts < job.maxAttempts) {
        logger.warn(
          { jobId: id, attempt: job.attempts, retryIn: delay },
          "Job failed, scheduling retry"
        );
        job.status = "pending";
        setTimeout(() => {
          this.pendingIds.unshift(id);
          this.tick();
        }, delay);
      } else {
        job.status = "failed";
        job.error =
          err instanceof Error ? err.message : String(err);
        job.processedAt = Date.now();
        this.failedCount++;
        logger.error(
          { jobId: id, attempts: job.attempts, err },
          "Job moved to dead-letter after max retries"
        );
      }
    } finally {
      this.processingCount--;
      this.tick();
    }
  }

  private gc() {
    const cutoff = Date.now() - this.opts.gcMaxAgeMs;
    for (const [id, job] of this.jobs.entries()) {
      if (
        (job.status === "completed" || job.status === "failed") &&
        job.processedAt &&
        job.processedAt < cutoff
      ) {
        this.jobs.delete(id);
      }
    }
  }

  drain(): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        if (this.pendingIds.length === 0 && this.processingCount === 0) {
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  }
}
