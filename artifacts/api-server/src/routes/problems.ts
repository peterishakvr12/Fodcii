import { Router } from "express";
import {
  getProblems,
  getProblem,
  createProblemHandler,
} from "../controllers/problems.controller.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { readRateLimit } from "../middleware/rate-limit.js";

const router = Router();

router.get("/problems", readRateLimit, getProblems);
router.get("/problems/:id", readRateLimit, getProblem);
router.post("/problems", requireAuth, requireAdmin, createProblemHandler);

export default router;
