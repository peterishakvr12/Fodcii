import { useEffect, useState } from "react"
import { useParams, useLocation } from "wouter"
import { Navigation } from "@/components/navigation"
import { PageContainer } from "@/components/page-container"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Trophy, CheckCircle, XCircle, Clock, Award, Zap, ArrowLeft } from "lucide-react"

interface UserStats {
  totalProblems: number
  solvedProblems: number
  easyProblems: number
  mediumProblems: number
  hardProblems: number
  currentStreak: number
  longestStreak: number
  points: number
  totalUsers: number
}

interface UserData {
  id: string
  name: string
  email: string
  avatar: string
  joinedDate: string
  rank: number
  level: string
  stats: UserStats
  achievements: { id: number; title: string; description: string; earned: boolean; earnedDate?: string }[]
  recentActivity: { id: number; problem: string; difficulty: string; status: string; date: string; time: string }[]
}

const mockUsers: Record<string, UserData> = {
  "1": {
    id: "1", name: "Alex Chen", email: "alex.chen@example.com", avatar: "/abstract-geometric-shapes.png",
    joinedDate: "2023-08-15", rank: 1, level: "Expert",
    stats: { totalProblems: 110, solvedProblems: 98, easyProblems: 45, mediumProblems: 38, hardProblems: 15, currentStreak: 15, longestStreak: 23, points: 2450, totalUsers: 2847 },
    achievements: [
      { id: 1, title: "First Steps", description: "Solve your first problem", earned: true, earnedDate: "2023-08-16" },
      { id: 2, title: "Problem Solver", description: "Solve 10 problems", earned: true, earnedDate: "2023-08-22" },
      { id: 3, title: "Streak Master", description: "Maintain a 7-day streak", earned: true, earnedDate: "2023-09-01" },
      { id: 4, title: "Algorithm Expert", description: "Solve 50 problems", earned: true, earnedDate: "2023-10-05" },
    ],
    recentActivity: [
      { id: 1, problem: "Two Sum", difficulty: "Easy", status: "solved", date: "2024-01-28", time: "4m 32s" },
      { id: 2, problem: "Binary Search", difficulty: "Medium", status: "solved", date: "2024-01-27", time: "8m 15s" },
      { id: 3, problem: "Graph Traversal", difficulty: "Hard", status: "solved", date: "2024-01-25", time: "18m 40s" },
    ],
  },
  "2": {
    id: "2", name: "Sarah Johnson", email: "sarah.j@example.com", avatar: "/abstract-geometric-shapes.png",
    joinedDate: "2023-09-02", rank: 2, level: "Advanced",
    stats: { totalProblems: 110, solvedProblems: 89, easyProblems: 42, mediumProblems: 32, hardProblems: 15, currentStreak: 8, longestStreak: 18, points: 2180, totalUsers: 2847 },
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

function getLevelColor(level: string) {
  switch (level) {
    case "Expert": return "bg-purple-500/10 text-purple-500 border-purple-500/20"
    case "Advanced": return "bg-blue-500/10 text-blue-500 border-blue-500/20"
    case "Intermediate": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    default: return "bg-green-500/10 text-green-500 border-green-500/20"
  }
}

export default function UserProfilePage() {
  const params = useParams<{ id: string }>()
  const [, navigate] = useLocation()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      const found = mockUsers[params.id] || null
      setUser(found)
      setLoading(false)
    }, 300)
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <PageContainer className="py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </PageContainer>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <PageContainer className="py-8">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">User not found</h1>
            <Button onClick={() => navigate("/leaderboard")}>Back to Leaderboard</Button>
          </div>
        </PageContainer>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageContainer className="py-8">
        <div className="space-y-8">
          <Button variant="ghost" onClick={() => navigate("/leaderboard")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Leaderboard
          </Button>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-center md:text-left flex-1">
                  <h1 className="text-3xl font-bold">{user.name}</h1>
                  <p className="text-muted-foreground">{user.email}</p>
                  <p className="text-sm text-muted-foreground mt-1">Member since {user.joinedDate}</p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      <Trophy className="h-3 w-3 mr-1" />
                      Rank #{user.rank}
                    </Badge>
                    <Badge className={getLevelColor(user.level)} variant="outline">{user.level}</Badge>
                    <Badge variant="secondary">{user.stats.currentStreak} day streak</Badge>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{user.stats.points}</div>
                  <div className="text-sm text-muted-foreground">points</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold">{user.stats.solvedProblems}</div>
                <div className="text-sm text-muted-foreground">Problems Solved</div>
                <Progress value={(user.stats.solvedProblems / user.stats.totalProblems) * 100} className="mt-3" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-primary">#{user.rank}</div>
                <div className="text-sm text-muted-foreground">Global Rank</div>
                <div className="text-xs text-muted-foreground mt-3">of {user.stats.totalUsers.toLocaleString()} users</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-yellow-500">{user.stats.currentStreak}</div>
                <div className="text-sm text-muted-foreground">Current Streak</div>
                <div className="text-xs text-muted-foreground mt-3">Best: {user.stats.longestStreak} days</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold">{user.achievements.filter(a => a.earned).length}</div>
                <div className="text-sm text-muted-foreground">Achievements</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Problem Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-500 font-medium">Easy</span>
                    <span>{user.stats.easyProblems}</span>
                  </div>
                  <Progress value={(user.stats.easyProblems / 50) * 100} className="[&>div]:bg-green-500" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-500 font-medium">Medium</span>
                    <span>{user.stats.mediumProblems}</span>
                  </div>
                  <Progress value={(user.stats.mediumProblems / 40) * 100} className="[&>div]:bg-yellow-500" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-red-500 font-medium">Hard</span>
                    <span>{user.stats.hardProblems}</span>
                  </div>
                  <Progress value={(user.stats.hardProblems / 20) * 100} className="[&>div]:bg-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="achievements">
            <TabsList>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="achievements" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                {user.achievements.map((a) => (
                  <Card key={a.id} className={a.earned ? "border-primary/20 bg-primary/5" : "opacity-60"}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${a.earned ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                          <Award className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{a.title}</span>
                            {a.earned && <CheckCircle className="h-4 w-4 text-primary" />}
                          </div>
                          <p className="text-sm text-muted-foreground">{a.description}</p>
                          {a.earnedDate && <p className="text-xs text-muted-foreground mt-1">Earned {a.earnedDate}</p>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {user.recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${activity.status === "solved" ? "bg-green-500/10" : "bg-red-500/10"}`}>
                            {activity.status === "solved" ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{activity.problem}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-xs">{activity.difficulty}</Badge>
                              <span className="text-xs text-muted-foreground">{activity.date}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{activity.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>
    </div>
  )
}
