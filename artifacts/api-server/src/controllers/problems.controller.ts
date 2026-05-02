import type { Request, Response } from "express";
import { z } from "zod";
import { listProblems, getProblemById, createProblem } from "../services/problems.service.js";

const createProblemSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  category: z.string().optional(),
  level: z.number().int().min(1).max(3).optional(),
  examples: z.array(z.unknown()).optional(),
  constraints: z.array(z.string()).optional(),
  starterCode: z.record(z.string()).optional(),
  testCases: z
    .array(
      z.object({
        input: z.string(),
        expectedOutput: z.string(),
        isSample: z.boolean().optional(),
      })
    )
    .min(1),
});

export async function getProblems(req: Request, res: Response) {
  try {
    const { level, category, difficulty, search } = req.query as Record<string, string | undefined>;
    const problems = await listProblems({ level, category, difficulty, search });
    res.json({ problems });
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ error: e.message ?? "Failed to fetch problems" });
  }
}

export async function getProblem(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid problem ID" });
    return;
  }

  try {
    const problem = await getProblemById(id);
    if (!problem) {
      res.status(404).json({ error: "Problem not found" });
      return;
    }
    res.json({ problem });
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ error: e.message ?? "Failed to fetch problem" });
  }
}

export async function createProblemHandler(req: Request, res: Response) {
  const parsed = createProblemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }

  try {
    const problem = await createProblem(parsed.data);
    res.status(201).json({ problem });
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ error: e.message ?? "Failed to create problem" });
  }
}
