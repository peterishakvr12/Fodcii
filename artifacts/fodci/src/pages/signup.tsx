import type React from "react"
import { useState } from "react"
import { Link, useLocation } from "wouter"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

export default function SignupPage() {
  const [, navigate] = useLocation()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match")
        return
      }

      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters long")
        return
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to create account. Please try again.")
        return
      }
      localStorage.setItem("fodci-token", data.token)
      login({
        id: String(data.user.id),
        email: data.user.email,
        name: data.user.username,
        avatar: "/placeholder.svg",
      })
      navigate("/problems")
    } catch {
      setError("Failed to create account. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col">
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="text-2xl font-bold tracking-tighter text-primary">Fodci</div>
          <div className="flex items-center gap-6">
            <Link className="text-muted-foreground font-medium hover:text-foreground transition-all duration-300" href="/login">
              Sign In
            </Link>
            <button className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground px-6 py-2.5 rounded-xl font-semibold text-sm active:scale-[0.98] transition-transform shadow-md shadow-primary/10">
              Create Account
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-grow flex items-center justify-center pt-24 pb-12 px-6">
        <div className="max-w-[1100px] w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side: Marketing Content */}
          <div className="hidden lg:flex flex-col space-y-8 pr-12">
            <div className="space-y-4">
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary/80 text-[10px] font-bold tracking-[0.08em] uppercase rounded-sm">
                Engineering Excellence
              </span>
              <h1 className="text-5xl font-extrabold text-primary tracking-tight leading-[1.1]">
                The architect's toolkit for modern systems.
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                Join 2,000+ engineers today and start optimizing your infrastructure with precision-engineered tools.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-xl bg-muted/50 border border-border/10">
                <span className="text-2xl mb-3 block">⚡</span>
                <div className="font-bold text-foreground">Ultra Fast</div>
                <div className="text-xs text-muted-foreground mt-1">99.9% uptime guaranteed by architecture.</div>
              </div>
              <div className="p-6 rounded-xl bg-muted/50 border border-border/10">
                <span className="text-2xl mb-3 block">🔒</span>
                <div className="font-bold text-foreground">Secure</div>
                <div className="text-xs text-muted-foreground mt-1">Enterprise-grade encryption by default.</div>
              </div>
            </div>

            <div className="relative h-64 w-full rounded-xl overflow-hidden shadow-2xl">
              <img alt="Complex server architecture" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAqU8_epJmHq23zOQ_eQHOurL1P4nKw1rKRbsKQPFFo_hyr-CEMNDA9w7UbBiyZrovnKGSAEzzNxDDB6m5p9bLi_-IHkMECOpt88v5t2a6XYBJPEy6kKXYyYTCLHN3cMP9coo7SFCQ60ac-iwxuCjKRCPot31ZhB4dCIjwtGYP2SVVZrJ0dnsk_8T27f_ahAYVPQgNBa6jDuInJjJwsIAdpZuGAN2c4LTelTDbqBr0ctP7VNex4w5b0GH6-k0F0FILxOif87m2JLQ" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent flex flex-col justify-end p-8">
                <div className="text-primary-foreground font-medium italic">
                  "Fodci has completely transformed how our DevOps team visualizes our scaling strategy."
                </div>
                <div className="text-primary-foreground/70 text-sm mt-2 font-semibold">— CTO, NeuraLink Systems</div>
              </div>
            </div>
          </div>

          {/* Right Side: Signup Form */}
          <div className="w-full max-w-md mx-auto lg:ml-auto">
            <div className="bg-card p-8 md:p-12 rounded-[2rem] shadow-lg border border-border/10">
              <div className="mb-10">
                <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Create Account</h2>
                <p className="text-muted-foreground mt-2 text-sm">Start your 14-day precision trial today.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <label className="text-[11px] font-bold tracking-[0.05em] uppercase text-muted-foreground ml-1" htmlFor="name">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">👤</span>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="John Architect"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-muted border-none rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold tracking-[0.05em] uppercase text-muted-foreground ml-1" htmlFor="email">
                    Work Email
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">✉️</span>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@company.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-muted border-none rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold tracking-[0.05em] uppercase text-muted-foreground ml-1" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">🔒</span>
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-12 pr-12 py-4 bg-muted border-none rounded-xl"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-auto px-2 py-1 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold tracking-[0.05em] uppercase text-muted-foreground ml-1" htmlFor="confirmPassword">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">🔒</span>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-12 pr-12 py-4 bg-muted border-none rounded-xl"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-auto px-2 py-1 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20 active:scale-[0.98] transition-all duration-300 tracking-wide"
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>

              <p className="mt-10 text-center text-sm text-muted-foreground">
                Already have an account?
                <Link className="text-primary font-bold hover:underline underline-offset-4 ml-1" href="/login">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
