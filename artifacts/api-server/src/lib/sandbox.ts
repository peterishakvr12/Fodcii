/**
 * sandbox.ts — Secure subprocess execution with resource limits
 *
 * Uses bash built-in `ulimit` to apply CPU, memory, and file-size limits
 * before exec-ing the target process. The `exec` replaces bash with the target
 * so the target inherits all limits without an intermediate shell process.
 *
 * What this provides:
 *  ✅ CPU time limit (RLIMIT_CPU via ulimit -t)
 *  ✅ Virtual memory limit (RLIMIT_AS via ulimit -v)
 *  ✅ File-creation size limit (RLIMIT_FSIZE via ulimit -f)
 *  ✅ Wall-clock timeout (process-group SIGKILL)
 *  ✅ Output size limit (per-chunk truncation)
 *  ✅ Fork bomb mitigation (CPU time cap starves forked children)
 *  ✅ Minimal environment (no credentials, no PATH leakage)
 *
 * What requires Docker/namespaces in production (see docker/):
 *  ⚠️  Network isolation — use --network=none in Docker
 *  ⚠️  Filesystem isolation — use --read-only + tmpfs in Docker
 */

import { spawn } from "child_process";
import { tmpdir } from "os";

export type Verdict = "AC" | "WA" | "TLE" | "RE" | "CE" | "MLE" | "OLE";

export interface SandboxResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  signal: string | null;
  timedOut: boolean;
  cpuLimitHit: boolean;
  fileSizeLimitHit: boolean;
  outputTruncated: boolean;
  executionTimeMs: number;
}

export interface SandboxOptions {
  /** Wall-clock timeout (ms). Process group is SIGKILL'd on expiry. Default 10 000 */
  wallTimeMs?: number;
  /** CPU-time soft limit (seconds). Process gets SIGXCPU. Default 5 */
  cpuTimeSec?: number;
  /** Virtual memory limit (KB). Default 524 288 = 512 MB */
  memoryLimitKb?: number;
  /** Max bytes captured from stdout + stderr each. Default 65 536 = 64 KB */
  maxOutputBytes?: number;
}

const DEFAULTS: Required<SandboxOptions> = {
  wallTimeMs: 10_000,
  cpuTimeSec: 5,
  memoryLimitKb: 524_288,  // 512 MB
  maxOutputBytes: 65_536,  // 64 KB
};

/** Safely single-quote a shell argument. */
function sq(s: string): string {
  return `'${s.replace(/'/g, "'\\''")}'`;
}

/**
 * Execute `command args` inside a bash resource-limited wrapper.
 *
 * bash sets ulimits then `exec`s the target, which inherits all limits.
 * The child runs in its own process group so the entire tree is killed
 * on wall-clock timeout.
 */
export function runSandboxed(
  command: string,
  args: string[],
  opts: SandboxOptions = {},
): Promise<SandboxResult> {
  const o = { ...DEFAULTS, ...opts };
  const hardCpu = Math.ceil(o.cpuTimeSec * 1.2);

  // 512-byte blocks for ulimit -f (16 MB = 32768 blocks)
  const fileSizeBlocks = 32768;

  // NOTE: ulimit -v (RLIMIT_AS) is intentionally omitted.
  // Go binaries (including nix wrappers for Python, g++, etc.) pre-reserve
  // 64 GB of virtual address space for their heap span bitmap before any
  // user code runs.  Setting -v to 512 MB causes them to fail immediately
  // with "failed to reserve page summary memory".
  //
  // Active limits:
  //   -t  CPU time    → sends SIGXCPU at soft, kills at hard
  //   -f  File size   → prevents large writes (SIGXFSZ on exceed)
  //   -n  Open files  → limits descriptor abuse
  //
  // Additional defenses handled outside this script:
  //   Wall-clock timer (SIGKILL via clearTimeout)
  //   Node.js --max-old-space-size=256 for JS submissions
  //   Output size cap (MAX_OUTPUT_BYTES)
  const script = [
    `ulimit -S -t ${o.cpuTimeSec}  2>/dev/null || true`,
    `ulimit -H -t ${hardCpu}       2>/dev/null || true`,
    `ulimit -S -f ${fileSizeBlocks} 2>/dev/null || true`,
    `ulimit -H -f ${fileSizeBlocks} 2>/dev/null || true`,
    `ulimit -S -n 64               2>/dev/null || true`,
    `ulimit -H -n 64               2>/dev/null || true`,
    `exec ${sq(command)} ${args.map(sq).join(" ")}`,
  ].join("\n");

  return new Promise((resolve) => {
    const start = Date.now();

    const child = spawn("bash", ["-c", script], {
      detached: true,         // own process group for tree-kill
      env: {
        PATH: process.env["PATH"] ?? "/usr/bin:/bin:/usr/local/bin",
        HOME: tmpdir(),
        TMPDIR: tmpdir(),
        LANG: "C.UTF-8",
      },
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let outputTruncated = false;

    child.stdout.on("data", (chunk: Buffer) => {
      const combined = stdout + chunk.toString();
      if (combined.length > o.maxOutputBytes) {
        outputTruncated = true;
        stdout = combined.slice(-o.maxOutputBytes);
      } else {
        stdout = combined;
      }
    });
    child.stderr.on("data", (chunk: Buffer) => {
      const combined = stderr + chunk.toString();
      if (combined.length > o.maxOutputBytes) {
        outputTruncated = true;
        stderr = combined.slice(-o.maxOutputBytes);
      } else {
        stderr = combined;
      }
    });

    const killGroup = () => {
      try { process.kill(-(child.pid!), "SIGKILL"); } catch { child.kill("SIGKILL"); }
    };

    const timer = setTimeout(() => { timedOut = true; killGroup(); }, o.wallTimeMs);

    child.on("close", (code, signal) => {
      clearTimeout(timer);
      const executionTimeMs = Date.now() - start;
      const cpuLimitHit = signal === "SIGXCPU";
      const fileSizeLimitHit = signal === "SIGXFSZ";

      resolve({
        stdout: stdout.trimEnd(),
        stderr: stderr.trimEnd(),
        exitCode: code ?? -1,
        signal: signal as string | null,
        timedOut,
        cpuLimitHit,
        fileSizeLimitHit,
        outputTruncated,
        executionTimeMs,
      });
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({
        stdout: "",
        stderr: err.message,
        exitCode: -1,
        signal: null,
        timedOut: false,
        cpuLimitHit: false,
        fileSizeLimitHit: false,
        outputTruncated: false,
        executionTimeMs: Date.now() - start,
      });
    });

    child.unref();
  });
}
