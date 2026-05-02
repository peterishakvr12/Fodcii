import { logger } from "./logger.js";

type State = "closed" | "open" | "half-open";

export interface CircuitBreakerOptions {
  failureThreshold: number;
  successThreshold: number;
  timeoutMs: number;
  name: string;
}

const DEFAULTS: CircuitBreakerOptions = {
  failureThreshold: 5,
  successThreshold: 2,
  timeoutMs: 10_000,
  name: "default",
};

export class CircuitBreaker {
  private state: State = "closed";
  private failures = 0;
  private successes = 0;
  private lastFailureTime = 0;
  private opts: CircuitBreakerOptions;

  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.opts = { ...DEFAULTS, ...options };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed > this.opts.timeoutMs) {
        this.state = "half-open";
        this.successes = 0;
        logger.info({ breaker: this.opts.name }, "Circuit breaker: HALF-OPEN");
      } else {
        throw Object.assign(
          new Error(
            `Circuit breaker [${this.opts.name}] is OPEN — retrying in ${Math.ceil((this.opts.timeoutMs - elapsed) / 1000)}s`
          ),
          { status: 503 }
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess() {
    this.failures = 0;
    if (this.state === "half-open") {
      this.successes++;
      if (this.successes >= this.opts.successThreshold) {
        this.state = "closed";
        logger.info({ breaker: this.opts.name }, "Circuit breaker: CLOSED");
      }
    }
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (
      this.state === "closed" &&
      this.failures >= this.opts.failureThreshold
    ) {
      this.state = "open";
      logger.error(
        { breaker: this.opts.name, failures: this.failures },
        "Circuit breaker: OPEN"
      );
    }
    if (this.state === "half-open") {
      this.state = "open";
    }
  }

  getStats() {
    return {
      name: this.opts.name,
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
        ? new Date(this.lastFailureTime).toISOString()
        : null,
    };
  }
}

export const dbCircuitBreaker = new CircuitBreaker({ name: "database", failureThreshold: 5, timeoutMs: 10_000 });
