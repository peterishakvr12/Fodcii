import { Navigation } from "@/components/navigation"
import { AnimatedButton } from "@/components/animated-button"
import { ArrowRight, Map } from "lucide-react"
import { useLocation } from "wouter"

export default function HomePage() {
  const [, navigate] = useLocation()

  const handleStartNow = () => {
    navigate("/problems")
  }

  const handleViewMap = () => {
    navigate("/leaderboard")
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navigation />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/40 to-background"></div>
          <div className="absolute inset-0 opacity-10" style={{backgroundImage: "url('https://www.transparenttextures.com/patterns/carbon-fibre.png')"}}></div>
        </div>

        <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="text-primary text-[10px] font-mono tracking-widest uppercase">System Online: v2.4.0</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tighter">
              Build Your <span className="text-primary">City</span> <br/>
              By Solving <span className="text-accent">Code</span>
            </h1>

            <p className="text-muted-foreground text-lg max-w-lg leading-relaxed">
              The first competitive programming platform where every line of code powers a living digital metropolis. Architect your future, one function at a time.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <AnimatedButton
                size="lg"
                onClick={handleStartNow}
                className="bg-primary text-primary-foreground px-8 py-4 font-bold rounded-sm flex items-center justify-center gap-2"
              >
                Start Building for Free
                <ArrowRight className="h-5 w-5" />
              </AnimatedButton>

              <AnimatedButton
                variant="outline"
                size="lg"
                onClick={handleViewMap}
                className="border border-border/20 text-foreground px-8 py-4 font-bold rounded-sm flex items-center justify-center gap-2"
              >
                View Global Map
                <Map className="h-5 w-5" />
              </AnimatedButton>
            </div>

            <div className="pt-8 flex items-center gap-4">
              <div className="flex -space-x-3">
                <img alt="User" className="w-10 h-10 rounded-full border-2 border-background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-3ifskAwE3i0PHGZEWHNw4HZS2II3LNlD4CLUGwnBa852Foed6Z7gYlQjfzmvY33q8m9JL_Ll5Qi-SoGEDdF5KHJqDWjB1PYkw6KF7sm_f5utUtij-n-oHwYjMSSuO6NH4gZQYVYQwyGVpK9t1mWHAnDRCmuqyrXm5nbC8F-nY4Xrd2U_VYOssnB7q9bmepNwOL7ApjV9fjyK5NtCzFhyVVM4x_h71w92Ic3mcVyZgjBKzXubBguT3C98eW-IphNVmBR6a3uvLA" />
                <img alt="User" className="w-10 h-10 rounded-full border-2 border-background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCm03SmPUkSDBTIKa4EEvE1zNKNfA_ONb0QM18CEsy2e2aWdgVMW-xZ9yJgj3Nt0mVNkh_BJed3SFepKOSFB8BlKhkDYW7_FsPchpMOi-0Z0ThPUzqXiDs4Z8MoOfHTYVfavbGTy3BK1hsx7QaxkH4-1-9FvZHSlUIO30qmC12gNsaixTHtOvalveivQnUhqoQi6d2X4tikF82W1LXA-jHHsYDpZw6t1jBIgdi6h2-TfsqR-5BHkaGe2lASNeCH1rwx9Zqu4_oBOA" />
                <img alt="User" className="w-10 h-10 rounded-full border-2 border-background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBoGkqU99tC8OVsmbYQkPmLJKObZfLUwzDt5C45OUVAwDwszV_OM0cNbJwkx7nDOwV7Yl5r99d0gB48pjJTGvt3bJiGaKyfpACUWI20PMr0flWkM9oT-ZA5eIZ2sVlLr5YhTkrzpWYHmI_POYKCKVadL9oZ2hEvMG2nX7liqTxre5DX6mzCCaAZv__bhwr52ctq1uCVXPqroUttkKMbbjpR4QwVj260bSfpANOokID5Kelu_P3yFKwyxh9rKG64uGy1HA5gy9zqqA" />
              </div>
              <p className="text-sm text-muted-foreground font-medium tracking-tight">
                <span className="text-primary">Trusted by 10,000+</span> citizens worldwide
              </p>
            </div>
          </div>

          {/* Hero Visual: Code Editor Mockup */}
          <div className="relative hidden lg:block">
            <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-full"></div>
            <div className="border border-border/15 p-1 rounded-lg relative overflow-hidden bg-card/50 backdrop-blur">
              <div className="bg-muted/50 p-4 font-mono text-sm space-y-2 min-h-[400px]">
                <div className="flex items-center gap-2 mb-4 text-muted-foreground/50 border-b border-border/10 pb-2">
                  <span className="text-xs">terminal</span>
                  <span className="text-[10px]">city_generator.py</span>
                </div>
                <p className="text-primary/80"><span className="text-accent">import</span> metropolis_engine <span className="text-accent">as</span> me</p>
                <p className="text-foreground/80"><span className="text-accent">def</span> build_infrastructure(solved_count):</p>
                <p className="text-foreground/80 pl-4">city = me.load_instance(<span className="text-primary">"arch_v12"</span>)</p>
                <p className="text-foreground/80 pl-4"><span className="text-accent">if</span> solved_count &gt; 100:</p>
                <p className="text-primary/70 pl-8">city.evolve_to_cyber_tier()</p>
                <p className="text-primary/70 pl-8">city.add_skyscrapers(<span className="text-primary">"neon_blue"</span>)</p>
                <p className="text-foreground/80 pl-4"><span className="text-accent">return</span> city.render()</p>
                <div className="mt-12 flex flex-col gap-2">
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[78%]"></div>
                  </div>
                  <p className="text-[10px] text-right text-primary uppercase tracking-widest">Building Progress: 78%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">The Blueprint for Success</h2>
            <div className="h-1 w-24 bg-primary mx-auto mb-6"></div>
            <p className="text-muted-foreground max-w-xl mx-auto">Transform your coding logic into physical assets. Every mission completed adds another floor to your digital legacy.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="relative group">
              <div className="bg-muted/50 p-8 rounded-xl border border-transparent hover:border-primary/20 transition-all h-full flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                  <span className="text-4xl">💻</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Solve Problems</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">Choose from 2,000+ data structures and algorithms challenges curated by industry experts.</p>
              </div>
            </div>

            <div className="relative group">
              <div className="bg-muted/50 p-8 rounded-xl border border-transparent hover:border-secondary/20 transition-all h-full flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6 text-secondary group-hover:scale-110 transition-transform">
                  <span className="text-4xl">💾</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Earn Resources</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">Collect Bytes, Watts, and Steel. Higher efficiency code yields higher-tier materials.</p>
              </div>
            </div>

            <div className="relative group">
              <div className="bg-muted/50 p-8 rounded-xl border border-transparent hover:border-primary/20 transition-all h-full flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                  <span className="text-4xl">🏢</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Build Your City</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">Redeem resources to construct landmarks, upgrade sectors, and grow your global rank.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-end mb-16">
            <div>
              <p className="text-primary font-mono text-[10px] tracking-widest uppercase mb-2">Capabilities</p>
              <h2 className="text-4xl font-bold">Engineered for the Architect</h2>
            </div>
            <div className="hidden md:block text-right">
              <p className="text-muted-foreground text-sm italic">"The most immersive coding experience yet"</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 bg-card/50 backdrop-blur border border-border/10 rounded-2xl p-8 min-h-[300px] flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-4">Next-Gen Code Editor</h3>
                <p className="text-muted-foreground max-w-md">Our terminal-first interface supports 40+ languages with lightning-fast execution and real-time city render previews.</p>
              </div>
            </div>

            <div className="bg-muted/80 rounded-2xl p-8 flex flex-col">
              <h3 className="text-2xl font-bold mb-4">Global Leaderboard</h3>
              <p className="text-muted-foreground text-sm flex-grow">Compete with architects from across the globe. See your city's skyline rise in the shared metaverse.</p>
              <div className="mt-8 space-y-3">
                <div className="flex items-center justify-between p-3 bg-background/50 rounded-sm">
                  <span className="text-xs font-mono">01. NeoCoder</span>
                  <span className="text-primary text-xs font-bold">12,450 EXP</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-background/50 rounded-sm">
                  <span className="text-xs font-mono">02. FluxArch</span>
                  <span className="text-primary text-xs font-bold">11,200 EXP</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-background/50 rounded-sm opacity-50">
                  <span className="text-xs font-mono">03. LogicNode</span>
                  <span className="text-primary text-xs font-bold">9,800 EXP</span>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 border border-border/10 rounded-2xl p-8 flex gap-8 items-center">
              <div className="flex-grow">
                <h3 className="text-2xl font-bold mb-4">City Leveling</h3>
                <p className="text-muted-foreground text-sm">Unlock new architectural styles—from Solarpunk to Cyberpunk—as you master new programming paradigms.</p>
              </div>
            </div>

            <div className="md:col-span-2 bg-card/50 backdrop-blur border border-secondary/10 rounded-2xl p-8 flex flex-col justify-center text-center">
              <div className="flex justify-center gap-6 mb-4 grayscale opacity-40">
                <span className="font-mono text-xl">JS</span>
                <span className="font-mono text-xl">PY</span>
                <span className="font-mono text-xl">GO</span>
                <span className="font-mono text-xl">CPP</span>
                <span className="font-mono text-xl">TS</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Build in Any Language</h3>
              <p className="text-muted-foreground text-sm">We provide full support for all major competitive languages with specialized SDKs for city automation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="bg-card p-12 md:p-20 rounded-3xl border border-primary/20 text-center space-y-8 max-w-5xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter">Your Skyline is <span className="text-primary">Waiting</span></h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Join thousands of developers who are turning their code into a masterpiece. Free forever for individuals.</p>

            <div className="flex flex-col sm:flex-row justify-center gap-6 pt-4">
              <AnimatedButton
                size="lg"
                onClick={handleStartNow}
                className="bg-primary text-primary-foreground px-12 py-5 font-bold rounded-sm text-lg"
              >
                Initialize Your City
              </AnimatedButton>

              <AnimatedButton
                variant="outline"
                size="lg"
                className="bg-transparent border border-border/30 text-foreground px-12 py-5 font-bold rounded-sm text-lg"
              >
                Read Whitepaper
              </AnimatedButton>
            </div>

            <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-40">
              <p className="text-[10px] font-mono tracking-widest uppercase">Latency: 24ms</p>
              <p className="text-[10px] font-mono tracking-widest uppercase">Uptime: 99.9%</p>
              <p className="text-[10px] font-mono tracking-widest uppercase">Citizens: 12.4k</p>
              <p className="text-[10px] font-mono tracking-widest uppercase">Regions: 52</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-border/10 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary tracking-tighter">Fodci</span>
              <span className="text-xs text-muted-foreground ml-4">© 2024 Digital Architects Inc.</span>
            </div>
            <div className="flex gap-8">
              <a className="text-sm text-muted-foreground hover:text-primary transition-colors" href="#">Privacy Policy</a>
              <a className="text-sm text-muted-foreground hover:text-primary transition-colors" href="#">Terms of Service</a>
              <a className="text-sm text-muted-foreground hover:text-primary transition-colors" href="#">Documentation</a>
              <a className="text-sm text-muted-foreground hover:text-primary transition-colors" href="#">Status</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
