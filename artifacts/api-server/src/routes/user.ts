import { Router } from "express"

const router = Router()

const mockUsers: Record<string, object> = {
  "1": {
    id: "1",
    name: "Alex Chen",
    email: "alex.chen@example.com",
    avatar: "/abstract-geometric-shapes.png",
    joinedDate: "2023-08-15",
    rank: 1,
    level: "Expert",
    stats: {
      totalProblems: 110,
      solvedProblems: 98,
      easyProblems: 45,
      mediumProblems: 38,
      hardProblems: 15,
      currentStreak: 15,
      longestStreak: 23,
      points: 2450,
      totalUsers: 2847,
    },
    achievements: [
      { id: 1, title: "First Steps", description: "Solve your first problem", earned: true, earnedDate: "2023-08-16" },
      { id: 2, title: "Problem Solver", description: "Solve 10 problems", earned: true, earnedDate: "2023-08-22" },
      { id: 3, title: "Streak Master", description: "Maintain a 7-day solving streak", earned: true, earnedDate: "2023-09-01" },
      { id: 4, title: "Algorithm Expert", description: "Solve 50 problems", earned: true, earnedDate: "2023-10-05" },
      { id: 5, title: "Speed Demon", description: "Solve a problem in under 5 minutes", earned: true, earnedDate: "2023-11-12" },
    ],
    recentActivity: [
      { id: 1, problem: "Two Sum", difficulty: "Easy", status: "solved", date: "2024-01-28", time: "4m 32s" },
      { id: 2, problem: "Binary Search", difficulty: "Medium", status: "solved", date: "2024-01-27", time: "8m 15s" },
      { id: 3, problem: "Graph Traversal", difficulty: "Hard", status: "solved", date: "2024-01-25", time: "18m 40s" },
    ],
  },
  "2": {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    avatar: "/abstract-geometric-shapes.png",
    joinedDate: "2023-09-02",
    rank: 2,
    level: "Advanced",
    stats: {
      totalProblems: 110,
      solvedProblems: 89,
      easyProblems: 42,
      mediumProblems: 32,
      hardProblems: 15,
      currentStreak: 8,
      longestStreak: 18,
      points: 2180,
      totalUsers: 2847,
    },
    achievements: [
      { id: 1, title: "First Steps", description: "Solve your first problem", earned: true, earnedDate: "2023-09-03" },
      { id: 2, title: "Problem Solver", description: "Solve 10 problems", earned: true, earnedDate: "2023-09-12" },
    ],
    recentActivity: [
      { id: 1, problem: "Two Sum", difficulty: "Easy", status: "solved", date: "2024-01-28", time: "6m 10s" },
      { id: 2, problem: "Maximum Subarray", difficulty: "Medium", status: "attempted", date: "2024-01-26", time: "15m 00s" },
    ],
  },
}

router.get("/user/profile", (req, res) => {
  const mockProfile = {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    avatar: "/diverse-user-avatars.png",
    stats: {
      totalProblems: 110,
      solvedProblems: 47,
      easyProblems: 28,
      mediumProblems: 15,
      hardProblems: 4,
      currentStreak: 7,
      longestStreak: 12,
      rank: 156,
      totalUsers: 2847,
    },
    achievements: [
      { id: 1, title: "First Steps", description: "Solve your first problem", earned: true, earnedDate: "2024-01-15" },
      { id: 2, title: "Problem Solver", description: "Solve 10 problems", earned: true, earnedDate: "2024-01-20" },
    ],
    recentAttempts: [
      { id: 1, problemTitle: "Two Sum", difficulty: "Easy", status: "solved", language: "Python", submittedAt: "2024-01-28T10:30:00Z", timeSpent: "12 minutes" },
    ],
  }

  return res.json(mockProfile)
})

router.put("/user/profile", async (req, res) => {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return res.json({ message: "Profile updated successfully" })
})

router.get("/user/:id", (req, res) => {
  const user = mockUsers[req.params.id]

  if (!user) {
    return res.status(404).json({ error: "User not found" })
  }

  return res.json({ user })
})

export default router
