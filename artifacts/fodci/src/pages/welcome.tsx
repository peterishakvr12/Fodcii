import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { useLocation } from "wouter"

function ParticlesBackground() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    let dpr = Math.max(1, window.devicePixelRatio || 1)
    canvas.width = Math.floor(window.innerWidth * dpr)
    canvas.height = Math.floor(window.innerHeight * dpr)
    canvas.style.width = window.innerWidth + "px"
    canvas.style.height = window.innerHeight + "px"
    ctx.scale(dpr, dpr)

    const PARTICLE_COUNT = Math.max(20, Math.floor((window.innerWidth * window.innerHeight) / 90000))
    const MAX_DIST = 140
    let rafId: number

    const particles: { x: number; y: number; r: number; vx: number; vy: number; alpha: number }[] = []
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: 0.8 + Math.random() * 1.8,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        alpha: 0.3 + Math.random() * 0.7,
      })
    }

    function onResize() {
      dpr = Math.max(1, window.devicePixelRatio || 1)
      canvas!.width = Math.floor(window.innerWidth * dpr)
      canvas!.height = Math.floor(window.innerHeight * dpr)
      canvas!.style.width = window.innerWidth + "px"
      canvas!.style.height = window.innerHeight + "px"
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function draw() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i]
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < MAX_DIST) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(120, 100, 255, ${0.08 * (1 - dist / MAX_DIST)})`
            ctx.lineWidth = 1
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        }
      }

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < -10) p.x = window.innerWidth + 10
        if (p.x > window.innerWidth + 10) p.x = -10
        if (p.y < -10) p.y = window.innerHeight + 10
        if (p.y > window.innerHeight + 10) p.y = -10

        ctx.beginPath()
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6)
        g.addColorStop(0, `rgba(255,255,255,${0.9 * p.alpha})`)
        g.addColorStop(0.4, `rgba(180,160,255,${0.2 * p.alpha})`)
        g.addColorStop(1, `rgba(120,100,255,0)`)
        ctx.fillStyle = g
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2)
        ctx.fill()
      }

      rafId = requestAnimationFrame(draw)
    }

    draw()
    window.addEventListener("resize", onResize)
    return () => {
      window.removeEventListener("resize", onResize)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return <canvas ref={ref} className="fixed inset-0 -z-10" />
}

function AnimatedCounter({ end = 0, label = "", duration = 1200 }: { end: number; label: string; duration?: number }) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true
            let start: number | null = null
            function step(ts: number) {
              if (!start) start = ts
              const progress = Math.min((ts - start) / duration, 1)
              setValue(Math.floor(progress * end))
              if (progress < 1) requestAnimationFrame(step)
            }
            requestAnimationFrame(step)
            io.disconnect()
          }
        })
      },
      { threshold: 0.6 }
    )
    io.observe(node)
    return () => io.disconnect()
  }, [end, duration])

  function format(n: number) {
    if (n >= 1000) return `${Math.round(n / 1000)}K`
    return `${n}`
  }

  return (
    <div ref={ref} className="flex flex-col items-center">
      <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
        +{format(value)}
      </div>
      <div className="text-sm text-gray-300 mt-2">{label}</div>
    </div>
  )
}

const roadmap = [
  { key: "beginner", title: "Beginner", subtitle: "Foundations & easy problems" },
  { key: "intermediate", title: "Intermediate", subtitle: "Data structures & algorithms" },
  { key: "advanced", title: "Advanced", subtitle: "Optimization & system design" },
  { key: "mastery", title: "Mastery", subtitle: "Projects & competitions" },
]

const journey = [
  { title: "Sign up", desc: "Create your account in seconds" },
  { title: "Solve", desc: "Attack curated problems with the in-browser editor" },
  { title: "Track", desc: "Monitor progress, streaks and weak topics" },
  { title: "Win Badges", desc: "Earn recognition and climb the leaderboard" },
]

export default function WelcomePage() {
  const [, navigate] = useLocation()

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans relative overflow-hidden">
      <ParticlesBackground />

      <motion.header
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
        className="pt-20 pb-8"
      >
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-6xl font-extrabold leading-tight tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent drop-shadow-lg">
            Fodci
          </h1>
          <p className="mt-4 text-xl text-gray-300 max-w-3xl mx-auto">
            Master problem solving with structured tracks, instant code feedback, and a competitive community.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={() => navigate("/signup")}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 font-bold shadow-xl hover:opacity-95 transition"
            >
              Get Started
            </button>
            <button
              onClick={() => navigate("/problems")}
              className="px-6 py-3 rounded-xl border border-gray-700 text-gray-200 hover:bg-gray-800 transition"
            >
              Browse Problems
            </button>
          </div>
        </div>
      </motion.header>

      <section className="mt-16 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.h3
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="text-3xl font-bold mb-4"
            >
              Learning Roadmap
            </motion.h3>
            <p className="text-gray-300 mb-6">Follow a clear path from basics to mastery — every step is curated and hands-on.</p>
            <div className="relative">
              <div className="hidden lg:block absolute left-8 top-3 bottom-3 w-0.5 bg-gradient-to-b from-indigo-500/60 to-pink-400/30" />
              <div className="flex flex-col gap-8">
                {roadmap.map((r, i) => (
                  <motion.div
                    key={r.key}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.12, duration: 0.6 }}
                    className="flex items-start gap-6"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500/20 to-pink-500/10 border border-gray-700 flex items-center justify-center text-white text-xl font-bold">
                        {i + 1}
                      </div>
                    </div>
                    <div>
                      <div className="text-xl font-semibold">{r.title}</div>
                      <div className="text-sm text-gray-400 mt-1 max-w-md">{r.subtitle}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-gray-800 p-8 rounded-2xl shadow-xl"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                <AnimatedCounter end={500} label="Problems" />
                <AnimatedCounter end={10000} label="Submissions" />
                <AnimatedCounter end={120} label="Top Coders" />
              </div>
              <div className="mt-6 text-xs text-gray-400">
                Live platform stats — updated in real-time for active users.
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="mt-20 px-6 pb-20">
        <div className="max-w-6xl mx-auto text-center">
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-3xl font-bold mb-4"
          >
            How it works
          </motion.h3>
          <p className="text-gray-300 mb-8">A quick visual story of a user's journey on Fodci.</p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            {journey.map((j, idx) => (
              <motion.div
                key={j.title}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.12, duration: 0.6 }}
                className="bg-gray-800 p-6 rounded-2xl shadow-lg flex flex-col items-center gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                  {idx + 1}
                </div>
                <div className="font-semibold">{j.title}</div>
                <div className="text-sm text-gray-400">{j.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="pb-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.button
            initial={{ scale: 0.98 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate("/problems")}
            className="px-10 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl font-bold"
          >
            Start Solving on Fodci
          </motion.button>
        </div>
      </footer>
    </div>
  )
}
