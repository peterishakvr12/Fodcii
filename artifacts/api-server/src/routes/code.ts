import { Router } from "express"
import { optionalAuth } from "../middleware/auth.js"
import { recordSubmission } from "../services/problems.service.js"
import { metricsStore } from "../lib/metrics-store.js"
import { executeCode } from "../lib/executor.js"
import { judgeSubmission } from "../lib/judge.js"

const router = Router()

router.post("/code/run", async (req, res) => {
  const { code, language } = req.body

  if (!code || !language) {
    res.status(400).json({ error: "code and language are required" })
    return
  }

  const supportedLanguages = ["python", "javascript", "cpp"]
  if (!supportedLanguages.includes(language)) {
    res.status(400).json({ error: `Unsupported language: ${language}` })
    return
  }

  const result = await executeCode(language, code)

  let output: string
  if (result.timedOut) {
    output = "⏱ Time Limit Exceeded (10s)\n"
    if (result.stdout) output += result.stdout
  } else if (result.exitCode !== 0) {
    output = ""
    if (result.stdout) output += result.stdout + "\n"
    if (result.stderr) output += result.stderr
    if (!output) output = `Process exited with code ${result.exitCode}`
  } else {
    output = result.stdout
    if (result.stderr) output += (output ? "\n" : "") + result.stderr
    if (!output) output = "(no output)"
  }

  res.json({
    success: result.exitCode === 0 && !result.timedOut,
    output,
    executionTime: result.executionTimeMs,
    memoryUsed: null,
  })
})

router.post("/code/submit", optionalAuth, async (req, res) => {
  const { code, language, problemId } = req.body

  if (!code || !language || !problemId) {
    res.status(400).json({ error: "code, language, and problemId are required" })
    return
  }

  const supportedLanguages = ["python", "javascript", "cpp"]
  if (!supportedLanguages.includes(language)) {
    res.status(400).json({ error: `Unsupported language: ${language}` })
    return
  }

  const id = parseInt(String(problemId), 10)
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid problemId" })
    return
  }

  const judgment = await judgeSubmission(id, language, code)

  if (judgment.totalTests === 0) {
    res.status(404).json({ error: "No test cases found for this problem" })
    return
  }

  const { passedTests, totalTests, success } = judgment
  const status = success ? "accepted" : "wrong_answer"
  const userId = req.user?.sub ?? null

  try {
    await recordSubmission({
      userId,
      problemId: id,
      code,
      language,
      status,
      passedTests,
      totalTests,
      executionTime: null,
    })
    metricsStore.recordSubmission()
  } catch {
    // non-fatal — still return result even if DB write fails
  }

  const testCases = judgment.results.map((r) => ({
    description: r.description,
    input: r.input,
    expected: r.expected,
    actual: r.actual,
    passed: r.passed,
    stderr: r.stderr,
  }))

  res.json({
    success,
    passedTests,
    totalTests,
    testCases,
    executionTime: null,
    memoryUsed: null,
    message: success
      ? "Congratulations! All test cases passed."
      : `${passedTests}/${totalTests} test cases passed. Keep trying!`,
  })
})

export default router
