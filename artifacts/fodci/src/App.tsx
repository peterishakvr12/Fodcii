import { Switch, Route, Router as WouterRouter } from "wouter"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/hooks/use-auth"
import { Suspense } from "react"
import NotFound from "@/pages/not-found"
import HomePage from "@/pages/home"
import LoginPage from "@/pages/login"
import SignupPage from "@/pages/signup"
import ProblemsPage from "@/pages/problems"
import ProblemDetailPage from "@/pages/problem-detail"
import LeaderboardPage from "@/pages/leaderboard"
import AboutPage from "@/pages/about"
import ProfilePage from "@/pages/profile"

const queryClient = new QueryClient()

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/problems" component={ProblemsPage} />
      <Route path="/problems/:id" component={ProblemDetailPage} />
      <Route path="/leaderboard" component={LeaderboardPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route component={NotFound} />
    </Switch>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
              <Router />
            </Suspense>
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
