import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import problemsRouter from "./problems";
import leaderboardRouter from "./leaderboard";
import codeRouter from "./code";
import userRouter from "./user";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(problemsRouter);
router.use(leaderboardRouter);
router.use(codeRouter);
router.use(userRouter);

export default router;
