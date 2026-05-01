import { Navigation } from "@/components/navigation"
import { PageContainer } from "@/components/page-container"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/hooks/use-auth"
import { Trophy, Target, Code, Calendar, CheckCircle, XCircle, Clock, Award, Star, Zap } from "lucide-react"

const mockUserStats = {
  totalProblems: 110,
  solvedProblems: 47,
  easyProblems: 28,
  mediumProblems: 15,
  hardProblems: 4,
  currentStreak: 7,
  longestStreak: 12,
  rank: 156,
  totalUsers: 2847,
}

const mockAchievements = [
  { id: 1, title: "First Steps", description: "Solve your first problem", icon: <Target className="h-6 w-6" />, earned: true, earnedDate: "2024-01-15", color: "text-green-500" },
  { id: 2, title: "Problem Solver", description: "Solve 10 problems", icon: <Code className="h-6 w-6" />, earned: true, earnedDate: "2024-01-20", color: "text-blue-500" },
  { id: 3, title: "Streak Master", description: "Maintain a 7-day solving streak", icon: <Zap className="h-6 w-6" />, earned: true, earnedDate: "2024-01-25", color: "text-yellow-500" },
  { id: 4, title: "Algorithm Expert", description: "Solve 50 problems", icon: <Trophy className="h-6 w-6" />, earned: false, earnedDate: null, color: "text-purple-500" },
  { id: 5, title: "Speed Demon", description: "Solve a problem in under 5 minutes", icon: <Clock className="h-6 w-6" />, earned: false, earnedDate: null, color: "text-red-500" },
  { id: 6, title: "Master Coder", description: "Solve 100 problems", icon: <Star className="h-6 w-6" />, earned: false, earnedDate: null, color: "text-orange-500" },
]

const mockRecentActivity = [
  { id: 1, problem: "Two Sum", difficulty: "Easy", status: "solved", date: "2024-01-28", time: "4m 32s" },
  { id: 2, problem: "Binary Search", difficulty: "Medium", status: "attempted", date: "2024-01-27", time: "12m 15s" },
  { id: 3, problem: "Reverse String", difficulty: "Easy", status: "solved", date: "2024-01-26", time: "2m 10s" },
  { id: 4, problem: "Graph Traversal", difficulty: "Hard", status: "attempted", date: "2024-01-25", time: "25m 00s" },
]

export default function ProfilePage() {
  const { user } = useAuth()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />

        <PageContainer className="py-8">
          <div className="space-y-8">
            {/* Profile Header */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                    <AvatarFallback className="text-2xl">{user?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="text-center md:text-left flex-1">
                    <h1 className="text-3xl font-bold text-foreground">{user?.name}</h1>
                    <p className="text-muted-foreground">{user?.email}</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        <Trophy className="h-3 w-3 mr-1" />
                        Rank #{mockUserStats.rank}
                      </Badge>
                      <Badge variant="secondary">
                        <Calendar className="h-3 w-3 mr-1" />
                        {mockUserStats.currentStreak} day streak
                      </Badge>
                      <Badge variant="outline">
                        {mockUserStats.solvedProblems} solved
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-foreground mb-1">{mockUserStats.solvedProblems}</div>
                  <div className="text-sm text-muted-foreground">Problems Solved</div>
                  <Progress value={(mockUserStats.solvedProblems / mockUserStats.totalProblems) * 100} className="mt-3" />
                  <div className="text-xs text-muted-foreground mt-1">{mockUserStats.solvedProblems}/{mockUserStats.totalProblems}</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-1">#{mockUserStats.rank}</div>
                  <div className="text-sm text-muted-foreground">Global Rank</div>
                  <div className="text-xs text-muted-foreground mt-3">of {mockUserStats.totalUsers.toLocaleString()} users</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-yellow-500 mb-1">{mockUserStats.currentStreak}</div>
                  <div className="text-sm text-muted-foreground">Current Streak</div>
                  <div className="text-xs text-muted-foreground mt-3">Best: {mockUserStats.longestStreak} days</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-foreground mb-1">{mockAchievements.filter(a => a.earned).length}</div>
                  <div className="text-sm text-muted-foreground">Achievements</div>
                  <div className="text-xs text-muted-foreground mt-3">of {mockAchievements.length} total</div>
                </CardContent>
              </Card>
            </div>

            {/* Difficulty Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Problem Breakdown</CardTitle>
                <CardDescription>Problems solved by difficulty</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-500 font-medium">Easy</span>
                      <span>{mockUserStats.easyProblems}</span>
                    </div>
                    <Progress value={(mockUserStats.easyProblems / 50) * 100} className="[&>div]:bg-green-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-yellow-500 font-medium">Medium</span>
                      <span>{mockUserStats.mediumProblems}</span>
                    </div>
                    <Progress value={(mockUserStats.mediumProblems / 40) * 100} className="[&>div]:bg-yellow-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-red-500 font-medium">Hard</span>
                      <span>{mockUserStats.hardProblems}</span>
                    </div>
                    <Progress value={(mockUserStats.hardProblems / 20) * 100} className="[&>div]:bg-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="achievements" className="space-y-6">
              <TabsList>
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
                <TabsTrigger value="activity">Recent Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="achievements">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {mockAchievements.map((achievement) => (
                    <Card key={achievement.id} className={`transition-all duration-300 ${achievement.earned ? "border-primary/20 bg-primary/5" : "opacity-60"}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${achievement.earned ? "bg-primary/10" : "bg-muted"} ${achievement.color}`}>
                            {achievement.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-foreground">{achievement.title}</h4>
                              {achievement.earned && <CheckCircle className="h-4 w-4 text-primary" />}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                            {achievement.earnedDate && (
                              <p className="text-xs text-muted-foreground mt-2">Earned {achievement.earnedDate}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="activity">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockRecentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${activity.status === "solved" ? "bg-green-500/10" : "bg-red-500/10"}`}>
                              {activity.status === "solved" ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground">{activity.problem}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {activity.difficulty}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{activity.date}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
    </ProtectedRoute>
  )
}
