import { Router } from "express";
import { getMetrics, getLiveMetrics } from "../controllers/metrics.controller.js";

const router = Router();

router.get("/metrics", getMetrics);
router.get("/metrics/live", getLiveMetrics);

export default router;
