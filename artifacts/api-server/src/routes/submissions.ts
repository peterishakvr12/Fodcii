import { Router } from "express";
import { getSubmissionStatus } from "../controllers/submission.controller.js";

const router = Router();

router.get("/submissions/:id/status", getSubmissionStatus);

export default router;
