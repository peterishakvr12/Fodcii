import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { PageContainer } from "@/components/page-container"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Medal, Award, Crown, Loader2 } from "lucide-react"
import { Link } from "wouter"

interface LeaderboardUser {
  id: number
  rank: number
  name: string
  avatar: string
  solvedProblems: number
  totalProblems: number
  points: number
  streak: number
  level: string
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/leaderboard")
        if (!res.ok) throw new Error("Failed to load leaderboard")
        const data = await res.json()
        setLeaderboard(data.leaderboard ?? [])
      } catch (e: unknown) {
        const err = e as { message?: string }
        setError(err.message ?? "Failed to load leaderboard")
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-5 w-5 text-yellow-500" />
      case 2: return <Medal className="h-5 w-5 text-gray-400" />
      case 3: return <Award className="h-5 w-5 text-amber-600" />
      default: return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Expert": return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      case "Advanced": return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "Intermediate": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "Beginner": return "bg-green-500/10 text-green-500 border-green-500/20"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const renderLeaderboardList = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-8 text-destructive">{error}</div>
      )
    }

    if (leaderboard.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          No users on the leaderboard yet. Start solving problems to appear here!
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {leaderboard.map((user) => (
          <div
            key={user.rank}
            className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-300 hover:shadow-lg ${
              user.rank <= 3
                ? "border-primary/30 bg-primary/5 hover:shadow-primary/10"
                : "border-border/50 hover:bg-muted/20"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-8">{getRankIcon(user.rank)}</div>

              <Link href={`/users/${user.id}`} className="hover:opacity-80 transition-opacity">
                <Avatar className="h-12 w-12 cursor-pointer">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </Link>

              <div>
                <h4 className="font-semibold text-foreground">{user.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getLevelColor(user.level)} variant="outline">
                    {user.level}
                  </Badge>
                  {user.streak > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {user.streak} day streak
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right space-y-1">
              <div className="text-lg font-bold text-primary">{user.points} pts</div>
              <div className="text-sm text-muted-foreground">
                {user.solvedProblems}/{user.totalProblems} solved
              </div>
              {user.totalProblems > 0 && (
                <div className="text-xs text-muted-foreground">
                  {Math.round((user.solvedProblems / user.totalProblems) * 100)}% success rate
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <PageContainer className="py-8">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                <Trophy className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">Leaderboard</h1>
              <p className="text-muted-foreground mt-2">See how you rank against other problem solvers</p>
            </div>
          </div>

          <Tabs defaultValue="all-time" className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="all-time">All Time</TabsTrigger>
                <TabsTrigger value="monthly">This Month</TabsTrigger>
                <TabsTrigger value="weekly">This Week</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all-time">
              <Card>
                <CardHeader>
                  <CardTitle>Top Problem Solvers</CardTitle>
                  <CardDescription>Rankings based on total problems solved and points earned</CardDescription>
                </CardHeader>
                <CardContent>
                  {renderLeaderboardList()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="monthly">
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
                        <Trophy className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Monthly Rankings Coming Soon</h3>
                      <p className="text-muted-foreground">We're working on monthly leaderboards to track your progress over time.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="weekly">
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
                        <Trophy className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Weekly Rankings Coming Soon</h3>
                      <p className="text-muted-foreground">Weekly competitions and rankings will be available soon to keep you motivated.</p>
                    </div>
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
