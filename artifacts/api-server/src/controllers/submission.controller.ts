import type { Request, Response } from "express";
import { getSubmissionById } from "../services/submission.service.js";
import { submissionQueue } from "../lib/submission-worker.js";

export async function getSubmissionStatus(req: Request, res: Response) {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid submission ID" });
    return;
  }

  const row = await getSubmissionById(id);
  if (!row) {
    res.status(404).json({ error: "Submission not found" });
    return;
  }

  const queueJob = submissionQueue.getJob(String(id));
  const effectiveStatus = row.status !== "pending" && row.status !== "processing"
    ? row.status
    : (queueJob?.status ?? row.status);

  const isDone = effectiveStatus !== "pending" && effectiveStatus !== "processing";
  const success = effectiveStatus === "accepted";

  res.json({
    submissionId: row.id,
    status: effectiveStatus,
    isDone,
    success,
    passedTests: row.passedTests,
    totalTests: row.totalTests,
    executionTime: row.executionTime,
    testCases: (row.testCasesJson as unknown[] | null) ?? null,
    errorMessage: row.errorMessage ?? null,
    message: isDone
      ? success
        ? `Congratulations! All ${row.totalTests} test cases passed.`
        : `${row.passedTests}/${row.totalTests} test cases passed. Keep trying!`
      : effectiveStatus === "processing"
      ? "Your submission is being evaluated…"
      : "Your submission is queued for evaluation…",
    queuedAt: row.createdAt,
    processedAt: row.processedAt ?? null,
  });
}
