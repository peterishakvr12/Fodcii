import { Router } from "express";
import { optionalAuth } from "../middleware/auth.js";
import { resolveDbUser } from "../middleware/clerk-db-user.js";
import { submitRateLimit } from "../middleware/rate-limit.js";
import { executeCode, SUPPORTED_LANGUAGES } from "../lib/executor.js";
import { createPendingSubmission } from "../services/submission.service.js";
import { submissionQueue } from "../lib/submission-worker.js";
import { logger } from "../lib/logger.js";

const router = Router();

// Languages allowed in the free /run endpoint (no Java — JVM cold-start is slow)
const RUN_LANGUAGES = ["python", "javascript", "cpp"] as const;

router.post("/code/run", async (req, res) => {
  const { code, language } = req.body;

  if (!code || !language) {
    res.status(400).json({ error: "code and language are required" });
    return;
  }

  if (!RUN_LANGUAGES.includes(language as typeof RUN_LANGUAGES[number])) {
    res.status(400).json({ error: `Unsupported language for /run: ${language}. Use: ${RUN_LANGUAGES.join(", ")}` });
    return;
  }

  const result = await executeCode(language, code);

  let output: string;
  if (result.compileError) {
    output = `Compile Error:\n${result.stderr}`;
  } else if (result.timedOut || result.cpuLimitHit) {
    output = "⏱ Time Limit Exceeded\n";
    if (result.stdout) output += result.stdout;
  } else if (result.outputLimitHit) {
    output = "⚠ Output Limit Exceeded (64 KB)\n" + result.stdout;
  } else if (result.exitCode !== 0) {
    output = "";
    if (result.stdout) output += result.stdout + "\n";
    if (result.stderr) output += result.stderr;
    if (!output) output = `Process exited with code ${result.exitCode}`;
  } else {
    output = result.stdout;
    if (result.stderr) output += (output ? "\n" : "") + result.stderr;
    if (!output) output = "(no output)";
  }

  res.json({
    success: result.exitCode === 0 && !result.timedOut && !result.cpuLimitHit && !result.compileError,
    output,
    executionTime: result.executionTimeMs,
    memoryUsed: null,
  });
});

router.post("/code/submit", optionalAuth, resolveDbUser, submitRateLimit, async (req, res) => {
  const { code, language, problemId } = req.body;

  if (!code || !language || !problemId) {
    res.status(400).json({ error: "code, language, and problemId are required" });
    return;
  }

  if (!SUPPORTED_LANGUAGES.includes(language as typeof SUPPORTED_LANGUAGES[number])) {
    res.status(400).json({
      error: `Unsupported language: ${language}. Supported: ${SUPPORTED_LANGUAGES.join(", ")}`,
    });
    return;
  }

  const problemIdStr = String(problemId);
  if (!/^\d+$/.test(problemIdStr)) {
    res.status(400).json({ error: "Invalid problemId: must be a positive integer" });
    return;
  }
  const parsedProblemId = parseInt(problemIdStr, 10);
  if (isNaN(parsedProblemId) || parsedProblemId <= 0) {
    res.status(400).json({ error: "Invalid problemId" });
    return;
  }

  const userId = req.dbUserId ?? null;

  const submissionId = await createPendingSubmission({
    userId,
    problemId: parsedProblemId,
    code,
    language,
  });

  submissionQueue.enqueue({
    submissionId,
    problemId: parsedProblemId,
    code,
    language,
    userId,
    enqueuedAt: Date.now(),
  });

  logger.info(
    { submissionId, problemId: parsedProblemId, language, userId, requestId: req.requestId },
    "Submission enqueued",
  );

  res.status(202).json({
    submissionId,
    status: "pending",
    message: "Submission queued for evaluation",
    pollUrl: `/api/submissions/${submissionId}/status`,
    supportedLanguages: SUPPORTED_LANGUAGES,
  });
});

export default router;
