import { Navigation } from "@/components/navigation"
import { PageContainer } from "@/components/page-container"
import { Card, CardContent } from "@/components/ui/card"
import { AnimatedButton } from "@/components/animated-button"
import { Code2, Target, Users, Zap, ArrowRight, CheckCircle } from "lucide-react"
import { useLocation } from "wouter"

const features = [
  {
    icon: <Code2 className="h-6 w-6" />,
    title: "Interactive Code Editor",
    description: "Practice with our built-in code editor supporting Python, C++, and JavaScript with syntax highlighting.",
  },
  {
    icon: <Target className="h-6 w-6" />,
    title: "Structured Learning Path",
    description: "Progress through carefully designed levels from beginner to advanced with curated problem sets.",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Community & Competition",
    description: "Join a community of learners, compete on leaderboards, and track your progress with others.",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Instant Feedback",
    description: "Get immediate feedback on your solutions with detailed explanations and optimization tips.",
  },
]

const stats = [
  { label: "Problems Available", value: "110+" },
  { label: "Programming Languages", value: "3" },
  { label: "Difficulty Levels", value: "3" },
  { label: "Active Users", value: "2,800+" },
]

const team = [
  { name: "Alex Chen", role: "Founder & Lead Engineer", bio: "10+ years building developer tools" },
  { name: "Sarah Johnson", role: "Product Designer", bio: "Passionate about intuitive learning experiences" },
  { name: "Michael Rodriguez", role: "Backend Engineer", bio: "Expert in distributed systems and algorithms" },
]

export default function AboutPage() {
  const [, navigate] = useLocation()

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
        <div className="relative">
          <PageContainer className="py-20 text-center">
            <div className="mx-auto max-w-4xl space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
                  Empowering the next generation of{" "}
                  <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                    problem solvers
                  </span>
                </h1>
                <p className="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed">
                  Fodci is a modern coding platform designed to make learning programming concepts engaging,
                  interactive, and accessible to everyone. Whether you're just starting out or looking to sharpen your
                  skills, we provide the tools and community to help you succeed.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <AnimatedButton
                  size="lg"
                  onClick={() => navigate("/problems")}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg font-semibold"
                >
                  Start Solving
                  <ArrowRight className="ml-2 h-5 w-5 inline" />
                </AnimatedButton>
                <AnimatedButton
                  variant="outline"
                  size="lg"
                  onClick={() => navigate("/signup")}
                  className="px-8 py-3 text-lg"
                >
                  Join Community
                </AnimatedButton>
              </div>
            </div>
          </PageContainer>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-background to-muted/20">
        <PageContainer>
          <div className="space-y-16">
            <div className="grid gap-8 md:grid-cols-4">
              {stats.map((stat, index) => (
                <Card key={index} className="text-center border-border/50">
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-4">Why Choose Fodci?</h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  We've built everything you need to become a better programmer in one place.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {features.map((feature, index) => (
                  <Card key={index} className="border-border/50 hover:border-primary/30 transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          {feature.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-4">Meet the Team</h2>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {team.map((member, index) => (
                  <Card key={index} className="text-center border-border/50">
                    <CardContent className="pt-6">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl font-bold text-primary">{member.name[0]}</span>
                      </div>
                      <h3 className="font-semibold text-foreground">{member.name}</h3>
                      <p className="text-sm text-primary font-medium mt-1">{member.role}</p>
                      <p className="text-sm text-muted-foreground mt-2">{member.bio}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="text-center space-y-6 py-12 border-t border-border/50">
              <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                {[
                  "No hidden fees",
                  "Cancel anytime",
                  "Regular updates",
                  "Community support",
                  "Mobile friendly",
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PageContainer>
      </section>
    </div>
  )
}
