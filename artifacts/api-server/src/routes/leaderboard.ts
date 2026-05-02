import { Router } from "express";
import { readRateLimit } from "../middleware/rate-limit.js";
import { cache, TTL, TAGS } from "../lib/cache.js";

const router = Router();

const mockLeaderboard = [
  { rank: 1, name: "Alex Chen", avatar: "/abstract-geometric-shapes.png", email: "alex.chen@example.com", solvedProblems: 98, totalProblems: 110, points: 2450, streak: 15, level: "Expert" },
  { rank: 2, name: "Sarah Johnson", avatar: "/abstract-geometric-shapes.png", email: "sarah.j@example.com", solvedProblems: 89, totalProblems: 110, points: 2180, streak: 8, level: "Advanced" },
  { rank: 3, name: "Michael Rodriguez", avatar: "/diverse-group-collaborating.png", email: "m.rodriguez@example.com", solvedProblems: 82, totalProblems: 110, points: 1950, streak: 12, level: "Advanced" },
  { rank: 4, name: "Emily Davis", avatar: "/diverse-user-avatars.png", email: "emily.davis@example.com", solvedProblems: 76, totalProblems: 110, points: 1820, streak: 5, level: "Intermediate" },
  { rank: 5, name: "David Kim", avatar: "/diverse-user-avatars.png", email: "david.kim@example.com", solvedProblems: 71, totalProblems: 110, points: 1690, streak: 9, level: "Intermediate" },
  { rank: 6, name: "Lisa Wang", avatar: "/diverse-user-avatars.png", email: "lisa.wang@example.com", solvedProblems: 68, totalProblems: 110, points: 1580, streak: 3, level: "Intermediate" },
  { rank: 7, name: "James Wilson", avatar: "/diverse-user-avatars.png", email: "james.w@example.com", solvedProblems: 63, totalProblems: 110, points: 1450, streak: 7, level: "Intermediate" },
  { rank: 8, name: "Maria Garcia", avatar: "/diverse-user-avatars.png", email: "maria.g@example.com", solvedProblems: 58, totalProblems: 110, points: 1320, streak: 4, level: "Beginner" },
];

const CACHE_KEY = "leaderboard:main";

router.get("/leaderboard", readRateLimit, (_req, res) => {
  const cached = cache.get<typeof mockLeaderboard>(CACHE_KEY);
  if (cached) {
    res.set("X-Cache", "HIT");
    res.json({ leaderboard: cached, stats: getStats() });
    return;
  }

  cache.set(CACHE_KEY, mockLeaderboard, TTL.LEADERBOARD, [TAGS.LEADERBOARD]);
  res.set("X-Cache", "MISS");
  res.json({ leaderboard: mockLeaderboard, stats: getStats() });
});

router.get("/leaderboard/user/:rank", readRateLimit, (req, res) => {
  const rank = parseInt(req.params.rank);
  const user = mockLeaderboard.find((u) => u.rank === rank);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ user });
});

function getStats() {
  return {
    totalUsers: 2847,
    activeToday: 342,
    problemsSolvedToday: 1256,
    averageProblems: 34,
  };
}

export default router;
