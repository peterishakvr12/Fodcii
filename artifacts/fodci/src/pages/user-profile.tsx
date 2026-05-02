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
import { Trophy, CheckCircle, XCircle, Clock, Award, ArrowLeft, Loader2 } from "lucide-react"

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
  id: number
  name: string
  avatar: string
  joinedDate: string
  rank: number
  level: string
  stats: UserStats
  achievements: { id: number; title: string; description: string; earned: boolean; earnedDate?: string | null }[]
  recentActivity: { id: number; problem: string; difficulty: string; status: string; date: string; time: string }[]
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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/user/${params.id}`)
        if (!res.ok) {
          if (res.status === 404) {
            setError("User not found")
          } else {
            throw new Error("Failed to load user profile")
          }
          return
        }
        const data = await res.json()
        setUser(data.user)
      } catch (e: unknown) {
        const err = e as { message?: string }
        setError(err.message ?? "Failed to load user profile")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) fetchUser()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <PageContainer className="py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </PageContainer>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <PageContainer className="py-8">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">{error ?? "User not found"}</h1>
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
                <Progress value={user.stats.totalProblems > 0 ? (user.stats.solvedProblems / user.stats.totalProblems) * 100 : 0} className="mt-3" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-primary">#{user.rank}</div>
                <div className="text-sm text-muted-foreground">Global Rank</div>
                <div className="text-xs text-muted-foreground mt-3">of {(user.stats.totalUsers || 0).toLocaleString()} users</div>
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
                  {user.recentActivity.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No activity yet.</p>
                  ) : (
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
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>
    </div>
  )
}
