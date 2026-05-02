import { Router } from "express";
import { register, login, me } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { authRateLimit } from "../middleware/rate-limit.js";

const router = Router();

router.post("/auth/register", authRateLimit, register);
router.post("/auth/login", authRateLimit, login);
router.get("/auth/me", requireAuth, me);

export default router;
