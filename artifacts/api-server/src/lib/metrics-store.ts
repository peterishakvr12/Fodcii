const MAX_RESPONSE_TIMES = 1000;

export interface EndpointStat {
  requests: number;
  failures: number;
  totalLatency: number;
}

export interface LanguageStat {
  total: number;
  accepted: number;
  compileErrors: number;
  tle: number;
  re: number;
  totalExecMs: number;
}

class MetricsStore {
  private startedAt = Date.now();
  private totalRequests = 0;
  private failedRequests = 0;
  private responseTimes: number[] = [];
  private submissionsCount = 0;
  private endpointStats = new Map<string, EndpointStat>();

  // Per-language judge metrics
  private langStats = new Map<string, LanguageStat>();

  // Queue latency samples (ms from enqueue → start processing)
  private queueTimes: number[] = [];

  recordRequest(opts: {
    method: string;
    path: string;
    statusCode: number;
    latencyMs: number;
  }) {
    this.totalRequests++;
    if (opts.statusCode >= 400) this.failedRequests++;

    this.responseTimes.push(opts.latencyMs);
    if (this.responseTimes.length > MAX_RESPONSE_TIMES) this.responseTimes.shift();

    const key = `${opts.method} ${opts.path}`;
    const s = this.endpointStats.get(key) ?? { requests: 0, failures: 0, totalLatency: 0 };
    s.requests++;
    if (opts.statusCode >= 400) s.failures++;
    s.totalLatency += opts.latencyMs;
    this.endpointStats.set(key, s);
  }

  recordSubmission() {
    this.submissionsCount++;
  }

  /** Called by the submission worker after every judged submission. */
  recordJudgment(opts: {
    language: string;
    status: string;       // "accepted" | "wrong_answer" | "time_limit_exceeded" | "runtime_error" | "compile_error"
    executionTimeMs: number;
    queueTimeMs?: number;
  }) {
    const lang = opts.language.toLowerCase();
    const s = this.langStats.get(lang) ?? {
      total: 0, accepted: 0, compileErrors: 0, tle: 0, re: 0, totalExecMs: 0,
    };
    s.total++;
    s.totalExecMs += opts.executionTimeMs;
    if (opts.status === "accepted")           s.accepted++;
    if (opts.status === "compile_error")      s.compileErrors++;
    if (opts.status === "time_limit_exceeded") s.tle++;
    if (opts.status === "runtime_error")      s.re++;
    this.langStats.set(lang, s);

    if (opts.queueTimeMs !== undefined) {
      this.queueTimes.push(opts.queueTimeMs);
      if (this.queueTimes.length > MAX_RESPONSE_TIMES) this.queueTimes.shift();
    }
  }

  getSnapshot() {
    const avg =
      this.responseTimes.length > 0
        ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
        : 0;

    const avgQueueMs =
      this.queueTimes.length > 0
        ? Math.round(this.queueTimes.reduce((a, b) => a + b, 0) / this.queueTimes.length)
        : 0;

    const endpoints: Record<string, { requests: number; failures: number; avgLatencyMs: number }> = {};
    for (const [key, stat] of this.endpointStats.entries()) {
      endpoints[key] = {
        requests: stat.requests,
        failures: stat.failures,
        avgLatencyMs: stat.requests > 0 ? Math.round(stat.totalLatency / stat.requests) : 0,
      };
    }

    const byLanguage: Record<string, {
      total: number; accepted: number; acceptanceRate: string;
      compileErrors: number; tle: number; re: number; avgExecMs: number;
    }> = {};
    for (const [lang, ls] of this.langStats.entries()) {
      byLanguage[lang] = {
        total: ls.total,
        accepted: ls.accepted,
        acceptanceRate: ls.total > 0 ? `${((ls.accepted / ls.total) * 100).toFixed(1)}%` : "0.0%",
        compileErrors: ls.compileErrors,
        tle: ls.tle,
        re: ls.re,
        avgExecMs: ls.total > 0 ? Math.round(ls.totalExecMs / ls.total) : 0,
      };
    }

    return {
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
      totalRequests: this.totalRequests,
      failedRequests: this.failedRequests,
      successRate:
        this.totalRequests > 0
          ? `${(((this.totalRequests - this.failedRequests) / this.totalRequests) * 100).toFixed(2)}%`
          : "100.00%",
      averageResponseTimeMs: Math.round(avg),
      submissionsCount: this.submissionsCount,
      avgQueueMs,
      byLanguage,
      endpoints,
    };
  }
}

export const metricsStore = new MetricsStore();
