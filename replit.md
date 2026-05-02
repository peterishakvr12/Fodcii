# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (ESM bundle via `build.mjs`)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/fodci run dev` — run frontend locally

## Artifacts

| Artifact | Dir | Port | Path |
|---|---|---|---|
| Fodci frontend | `artifacts/fodci` | 19469 | `/` |
| API server | `artifacts/api-server` | 8080 | `/api` |
| Mockup sandbox | `artifacts/mockup-sandbox` | 8082 | `/__mockup` |

## API Server Architecture (`artifacts/api-server`)

### Distributed Backend Infrastructure

All production-grade infrastructure is in `src/lib/` and `src/middleware/`:

| File | Purpose |
|---|---|
| `src/lib/job-queue.ts` | Generic `JobQueue<T>` — async FIFO, retry (exp backoff), dead-letter, configurable concurrency |
| `src/lib/submission-worker.ts` | Submission-specific queue singleton (concurrency=4). Enqueues with `enqueuedAt` timestamp; processor: judge → update DB → record per-language metrics → invalidate cache |
| `src/lib/cache.ts` | In-process TTL cache with tag-based invalidation. TTLs: problems 120s, detail 300s, leaderboard 30s |
| `src/lib/circuit-breaker.ts` | DB circuit breaker — opens after 5 failures, half-open after 10s |
| `src/middleware/rate-limit.ts` | `authRateLimit` (20/15min), `submitRateLimit` (15/min, keyed by userId), `readRateLimit` (300/min) |

### Judge Engine (`src/lib/`)

| File | Purpose |
|---|---|
| `src/lib/sandbox.ts` | Bash ulimit sandbox: CPU time (`-t 5`), file size (`-f 16384` = 16 MB), open files (`-n 64`); wall-clock SIGKILL at 10s; process-group kill; 64 KB output cap. **No `-v` flag** — Go/nix binaries pre-reserve 64 GB VA space and crash with 512 MB cap |
| `src/lib/executor.ts` | Language executors: Python (python3), JS (node --max-old-space-size=256 --disallow-code-generation-from-strings), C++ (g++ -O2 + binary), Java (javac + java in temp dir, graceful `exitCode: 127` fallback when JVM absent). All routed through sandbox |
| `src/lib/judge.ts` | All 6 problem test suites × 4 languages. Java harnesses for each problem. Fail-fast sequential execution. Per-test-case verdicts (AC / WA / TLE / RE / CE / MLE / OLE) with executionTimeMs. Returns `overallVerdict` + `testCases[]` |
| `src/lib/bullmq-worker.ts` | Standalone BullMQ worker binary (`dist/lib/bullmq-worker.mjs`) for horizontal scaling. Falls back to in-memory `JobQueue` when Redis unavailable |
| `src/lib/metrics-store.ts` | In-memory metrics: per-language breakdown (total, accepted, acceptanceRate, compileErrors, tle, re, avgExecMs), avgQueueMs tracking |

### Verdict System

| Verdict | Trigger |
|---|---|
| `AC` | Output matches expected |
| `WA` | Output mismatch |
| `TLE` | CPU time > 5s (SIGXCPU) or wall-clock > 10s (SIGKILL) |
| `RE` | Non-zero exit, no compile stage |
| `CE` | Compile failure (g++ / javac stderr) |
| `MLE` | Memory limit — Node.js heap enforced via `--max-old-space-size`; virtual memory limit intentionally removed for nix compatibility |
| `OLE` | Output > 64 KB truncated |

### Supported Languages

| Language | Submit | `POST /code/run` |
|---|---|---|
| Python | ✅ | ✅ |
| JavaScript | ✅ | ✅ |
| C++ | ✅ | ✅ |
| Java | ✅ | ✅ (graceful CE if JVM absent) |

### Async Submission Flow

1. `POST /api/code/submit` → creates PENDING row in DB → enqueues job (with `enqueuedAt: Date.now()`) → returns `{ submissionId, status: "pending", pollUrl }` in < 20ms (202 Accepted)
2. Worker processes job: records queue latency → runs judge engine (fail-fast) → updates DB with results + testCasesJson → calls `metricsStore.recordJudgment()`
3. `GET /api/submissions/:id/status` → returns current status + full per-test-case results when done
4. Frontend polls every 600ms until `isDone: true`

### Observability Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/health` | DB ping + queue depth + cache stats + circuit breaker state + judge engine mode |
| `GET /api/metrics` | Request throughput, success rate, avg response time |
| `GET /api/metrics/live` | Real-time: queue stats, cache hit rate, circuit breaker, uptime, per-language acceptance rates, avgQueueMs |
| `GET /api/security/report` | 7-test self-testing security suite |

### Submissions Schema (`lib/db/src/schema/submissions.ts`)

Added columns: `test_cases_json` (jsonb), `processed_at` (timestamp), `error_message` (text)
Status values: `pending` → `processing` → `accepted` | `wrong_answer` | `time_limit_exceeded` | `runtime_error` | `compile_error` | `memory_limit_exceeded` | `output_limit_exceeded`

### Services

| File | Purpose |
|---|---|
| `src/services/submission.service.ts` | `createPendingSubmission`, `updateSubmissionResult`, `getSubmissionById` |
| `src/services/problems.service.ts` | `listProblems`, `getProblemById`, `createProblem`, `recordSubmission` |

### Caching Strategy

- Problems list: 120s TTL, tag `problems`
- Problem detail: 300s TTL, tag `problems`
- Leaderboard: 60s TTL, tag `leaderboard`
- Cache invalidated by tag when an accepted submission is recorded
- `X-Cache: HIT/MISS` response header on all cached routes

## Docker (Production)

- `Dockerfile.api` — multi-stage build for API server
- `docker-compose.yml` — full stack: PostgreSQL + Redis + API + Frontend
- `docker-compose.judge.yml` — judge-specific stack: Redis + API + scalable BullMQ workers (N replicas) + Bull-Board dashboard on port 3000
- Language-specific runner images: `Dockerfile.base-runner`, `Dockerfile.python`, `Dockerfile.cpp`, `Dockerfile.node`, `Dockerfile.java`, `Dockerfile.judge-worker`

## Auth

- Clerk Auth (primary). JWT middleware for API routes.
- `optionalAuth` / `requireAuth` / `requireAdmin` middleware

## Sandbox Constraints (Critical)

- **`ulimit -v` is intentionally omitted**: nix-wrapped binaries (Python, g++) pre-reserve ~64 GB virtual address space. Setting RLIMIT_AS to 512 MB causes "failed to reserve page summary memory" crash on process start.
- **Active limits**: CPU time (`-t 5s`), file size (`-f 16 MB`), open files (`-n 64`)
- **Node.js memory**: enforced via `--max-old-space-size=256` flag (heap limit, not VA space)
- **Java**: requires JVM installed. Without JVM, executor returns `exitCode: 127` which judge maps to CE.
- **Redis**: nix redis-server segfaults. Redis requires Docker deployment for production BullMQ workers.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
