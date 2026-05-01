import { Router } from "express"

const router = Router()

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" })
  }

  await new Promise((resolve) => setTimeout(resolve, 500))

  const user = {
    id: "1",
    email,
    name: email.split("@")[0],
    avatar: "/diverse-user-avatars.png",
    createdAt: new Date().toISOString(),
  }

  return res.json({ user, token: "mock-jwt-token" })
})

router.post("/auth/register", async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" })
  }

  await new Promise((resolve) => setTimeout(resolve, 800))

  const user = {
    id: Date.now().toString(),
    name,
    email,
    avatar: "/diverse-user-avatars.png",
    createdAt: new Date().toISOString(),
  }

  return res.json({ user, token: "mock-jwt-token" })
})

export default router
