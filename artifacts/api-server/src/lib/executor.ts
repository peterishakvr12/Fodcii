/**
 * executor.ts — Language-specific code execution
 *
 * Handles file management, compilation, and execution for each supported
 * language. All execution goes through the sandboxed runner (sandbox.ts)
 * which applies CPU, memory, and file-size resource limits.
 *
 * Supported languages: python | javascript | cpp | java
 */

import { writeFile, unlink, mkdir, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import { runSandboxed } from "./sandbox.js";
import type { SandboxResult } from "./sandbox.js";

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
  cpuLimitHit: boolean;
  executionTimeMs: number;
  compileError: boolean;
  outputLimitHit: boolean;
}

const JUDGE_TMP = join(tmpdir(), "fodci-judge");
const WALL_MS   = 10_000;   // 10 s wall-clock
const CPU_SEC   =  5;       // 5 s CPU time
const MEM_KB    = 524_288;  // 512 MB virtual memory
const MAX_OUT   =  65_536;  // 64 KB output cap

async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

function sanitize(text: string, ...ids: string[]): string {
  let s = text;
  for (const id of ids) {
    if (!id) continue;
    s = s.replace(new RegExp(id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), "<solution>");
  }
  return s;
}

function fromSandbox(r: SandboxResult, id: string): ExecutionResult {
  const MAX_OUT_BYTES = MAX_OUT;
  return {
    stdout:         sanitize(r.stdout, id),
    stderr:         sanitize(r.stderr, id),
    exitCode:       r.exitCode,
    timedOut:       r.timedOut,
    cpuLimitHit:    r.cpuLimitHit,
    executionTimeMs: r.executionTimeMs,
    compileError:   false,
    outputLimitHit: r.stdout.length >= MAX_OUT_BYTES || r.stderr.length >= MAX_OUT_BYTES,
  };
}

// ── Python ────────────────────────────────────────────────────────────────────

async function executePython(code: string): Promise<ExecutionResult> {
  const dir = JUDGE_TMP;
  await ensureDir(dir);
  const id  = randomUUID();
  const file = join(dir, `${id}.py`);
  await writeFile(file, code, "utf8");

  try {
    const r = await runSandboxed("python3", [file], {
      wallTimeMs: WALL_MS, cpuTimeSec: CPU_SEC, memoryLimitKb: MEM_KB, maxOutputBytes: MAX_OUT,
    });
    return fromSandbox(r, id);
  } finally {
    await unlink(file).catch(() => {});
  }
}

// ── JavaScript ────────────────────────────────────────────────────────────────

async function executeJavaScript(code: string): Promise<ExecutionResult> {
  const dir = JUDGE_TMP;
  await ensureDir(dir);
  const id   = randomUUID();
  const file = join(dir, `${id}.js`);
  await writeFile(file, code, "utf8");

  try {
    const r = await runSandboxed("node", [
      "--max-old-space-size=256",
      "--disallow-code-generation-from-strings",
      file,
    ], {
      wallTimeMs: WALL_MS, cpuTimeSec: CPU_SEC, memoryLimitKb: MEM_KB, maxOutputBytes: MAX_OUT,
    });
    return fromSandbox(r, id);
  } finally {
    await unlink(file).catch(() => {});
  }
}

// ── C++ ───────────────────────────────────────────────────────────────────────

async function executeCpp(code: string): Promise<ExecutionResult> {
  const dir = JUDGE_TMP;
  await ensureDir(dir);
  const id      = randomUUID();
  const srcPath = join(dir, `${id}.cpp`);
  const binPath = join(dir, `${id}.out`);
  await writeFile(srcPath, code, "utf8");

  try {
    // Compile (generous wall/CPU — optimisation passes take time)
    const compile = await runSandboxed("g++", [
      "-O2", "-std=c++17", "-Wall",
      "-o", binPath, srcPath,
    ], { wallTimeMs: 20_000, cpuTimeSec: 15, memoryLimitKb: MEM_KB });

    if (compile.exitCode !== 0 || compile.timedOut) {
      return {
        stdout: "",
        stderr: sanitize(
          compile.timedOut ? "Compilation timed out" : compile.stderr,
          srcPath, id,
        ),
        exitCode: compile.exitCode,
        timedOut: compile.timedOut,
        cpuLimitHit: compile.cpuLimitHit,
        executionTimeMs: compile.executionTimeMs,
        compileError: true,
        outputLimitHit: false,
      };
    }

    // Run compiled binary
    const run = await runSandboxed(binPath, [], {
      wallTimeMs: WALL_MS, cpuTimeSec: CPU_SEC, memoryLimitKb: MEM_KB, maxOutputBytes: MAX_OUT,
    });
    return fromSandbox(run, id);
  } finally {
    await Promise.all([unlink(srcPath).catch(() => {}), unlink(binPath).catch(() => {})]);
  }
}

// ── Java ──────────────────────────────────────────────────────────────────────
// Java mandates filename == public class name.  We use a per-submission
// temp directory so concurrent jobs don't clobber each other.

async function executeJava(code: string): Promise<ExecutionResult> {
  const id      = randomUUID();
  const dir     = join(JUDGE_TMP, `java-${id}`);
  const srcPath = join(dir, "Solution.java");
  await ensureDir(dir);
  await writeFile(srcPath, code, "utf8");

  try {
    // Compile
    const compile = await runSandboxed("javac", ["-encoding", "UTF-8", srcPath], {
      wallTimeMs: 20_000, cpuTimeSec: 15, memoryLimitKb: MEM_KB,
    });

    if (compile.stderr.includes("command not found") ||
        compile.stderr.includes("No such file") ||
        compile.exitCode === 127) {
      return {
        stdout: "", stderr: "Java runtime is not installed on this judge server",
        exitCode: 127, timedOut: false, cpuLimitHit: false,
        executionTimeMs: 0, compileError: true, outputLimitHit: false,
      };
    }

    if (compile.exitCode !== 0 || compile.timedOut) {
      return {
        stdout: "",
        stderr: sanitize(compile.timedOut ? "Compilation timed out" : compile.stderr, srcPath, id),
        exitCode: compile.exitCode, timedOut: compile.timedOut, cpuLimitHit: compile.cpuLimitHit,
        executionTimeMs: compile.executionTimeMs, compileError: true, outputLimitHit: false,
      };
    }

    // Run  — pass memory flags directly to JVM (sandbox also enforces limits)
    const run = await runSandboxed("java", [
      `-Xmx256m`, `-Xss8m`, `-Xms16m`,
      `-Djava.security.manager`, `-Djava.awt.headless=true`,
      "-cp", dir, "Solution",
    ], {
      wallTimeMs: WALL_MS, cpuTimeSec: CPU_SEC, memoryLimitKb: MEM_KB, maxOutputBytes: MAX_OUT,
    });

    return fromSandbox(run, id);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function executeCode(
  language: string,
  code: string,
): Promise<ExecutionResult> {
  switch (language.toLowerCase()) {
    case "python":     return executePython(code);
    case "javascript": return executeJavaScript(code);
    case "cpp":        return executeCpp(code);
    case "java":       return executeJava(code);
    default:
      return {
        stdout: "", stderr: `Unsupported language: ${language}`,
        exitCode: 1, timedOut: false, cpuLimitHit: false,
        executionTimeMs: 0, compileError: false, outputLimitHit: false,
      };
  }
}

export const SUPPORTED_LANGUAGES = ["python", "javascript", "cpp", "java"] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];
