import { Router } from "express";
import {
  getProblems,
  getProblem,
  createProblemHandler,
} from "../controllers/problems.controller.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/problems", getProblems);
router.get("/problems/:id", getProblem);
router.post("/problems", requireAuth, requireAdmin, createProblemHandler);

export default router;
