import { spawn } from "child_process"
import { writeFile, unlink, mkdir } from "fs/promises"
import { join } from "path"
import { tmpdir } from "os"
import { randomUUID } from "crypto"

export interface ExecutionResult {
  stdout: string
  stderr: string
  exitCode: number
  timedOut: boolean
  executionTimeMs: number
}

const TIMEOUT_MS = 10_000
const MAX_OUTPUT_BYTES = 65_536

async function ensureTmpDir(): Promise<string> {
  const dir = join(tmpdir(), "fodci-judge")
  await mkdir(dir, { recursive: true })
  return dir
}

function sanitizeOutput(text: string, filePath: string, id: string): string {
  return text
    .replace(new RegExp(filePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), "<solution>")
    .replace(new RegExp(id, "g"), "<solution>")
}

export async function executeCode(
  language: string,
  code: string,
): Promise<ExecutionResult> {
  const dir = await ensureTmpDir()
  const id = randomUUID()
  const start = Date.now()

  if (language === "python") {
    const filePath = join(dir, `${id}.py`)
    await writeFile(filePath, code, "utf8")
    const result = await runProcess("python3", [filePath], TIMEOUT_MS)
    await unlink(filePath).catch(() => {})
    result.executionTimeMs = Date.now() - start
    result.stdout = sanitizeOutput(result.stdout, filePath, id)
    result.stderr = sanitizeOutput(result.stderr, filePath, id)
    return result
  }

  if (language === "javascript") {
    const filePath = join(dir, `${id}.js`)
    await writeFile(filePath, code, "utf8")
    const result = await runProcess("node", [filePath], TIMEOUT_MS)
    await unlink(filePath).catch(() => {})
    result.executionTimeMs = Date.now() - start
    result.stdout = sanitizeOutput(result.stdout, filePath, id)
    result.stderr = sanitizeOutput(result.stderr, filePath, id)
    return result
  }

  if (language === "cpp") {
    const srcPath = join(dir, `${id}.cpp`)
    const binPath = join(dir, `${id}.out`)
    await writeFile(srcPath, code, "utf8")

    const compileResult = await runProcess(
      "g++",
      ["-O2", "-std=c++17", "-o", binPath, srcPath],
      15_000,
    )

    if (compileResult.exitCode !== 0 || compileResult.timedOut) {
      await Promise.all([unlink(srcPath).catch(() => {})])
      return {
        stdout: "",
        stderr: sanitizeOutput(compileResult.stderr || "Compilation timed out", srcPath, id),
        exitCode: compileResult.exitCode,
        timedOut: compileResult.timedOut,
        executionTimeMs: Date.now() - start,
      }
    }

    const runResult = await runProcess(binPath, [], TIMEOUT_MS)
    await Promise.all([
      unlink(srcPath).catch(() => {}),
      unlink(binPath).catch(() => {}),
    ])
    runResult.executionTimeMs = Date.now() - start
    runResult.stdout = sanitizeOutput(runResult.stdout, srcPath, id)
    runResult.stderr = sanitizeOutput(runResult.stderr, srcPath, id)
    return runResult
  }

  return {
    stdout: "",
    stderr: `Unsupported language: ${language}`,
    exitCode: 1,
    timedOut: false,
    executionTimeMs: 0,
  }
}

function runProcess(
  command: string,
  args: string[],
  timeoutMs: number,
): Promise<ExecutionResult> {
  return new Promise((resolve) => {
    // detached=true puts child in its own process group so we can kill the
    // entire group (child + any sub-processes it spawns) on timeout.
    const child = spawn(command, args, {
      detached: true,
      env: {
        PATH: process.env["PATH"],
        HOME: tmpdir(),
      },
    })

    let stdout = ""
    let stderr = ""
    let timedOut = false

    child.stdout.on("data", (chunk: Buffer) => {
      const combined = stdout + chunk.toString()
      stdout = combined.slice(-MAX_OUTPUT_BYTES)
    })

    child.stderr.on("data", (chunk: Buffer) => {
      const combined = stderr + chunk.toString()
      stderr = combined.slice(-MAX_OUTPUT_BYTES)
    })

    const killGroup = () => {
      try {
        // Negative PID kills the entire process group
        process.kill(-(child.pid!), "SIGKILL")
      } catch {
        child.kill("SIGKILL")
      }
    }

    const timer = setTimeout(() => {
      timedOut = true
      killGroup()
    }, timeoutMs)

    child.on("close", (code) => {
      clearTimeout(timer)
      resolve({
        stdout: stdout.trimEnd(),
        stderr: stderr.trimEnd(),
        exitCode: code ?? 1,
        timedOut,
        executionTimeMs: 0,
      })
    })

    child.on("error", (err) => {
      clearTimeout(timer)
      resolve({
        stdout: "",
        stderr: err.message,
        exitCode: 1,
        timedOut: false,
        executionTimeMs: 0,
      })
    })

    // Prevent child's stdio handles from keeping the Node event loop alive
    child.unref()
  })
}
