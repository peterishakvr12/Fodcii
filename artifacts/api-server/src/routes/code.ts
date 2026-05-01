import { Router } from "express"

const router = Router()

function generateMockOutput(language: string) {
  const outputs: Record<string, string[]> = {
    python: ["[0, 1]", "Hello, World!", "['o', 'l', 'l', 'e', 'h']", "4", "True", "42"],
    cpp: ["0 1", "Hello, World!", "o l l e h", "4", "1", "42"],
    javascript: ["[0, 1]", "Hello, World!", "['o', 'l', 'l', 'e', 'h']", "4", "true", "42"],
  }

  const languageOutputs = outputs[language] || outputs.python
  const randomOutput = languageOutputs[Math.floor(Math.random() * languageOutputs.length)]
  const ms = Math.floor(Math.random() * 500) + 50

  return `Code executed successfully!\nOutput: ${randomOutput}\nExecution completed in ${ms}ms`
}

router.post("/code/run", async (req, res) => {
  const { code, language } = req.body

  if (!code || !language) {
    return res.status(400).json({ error: "code and language are required" })
  }

  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000))

  const success = Math.random() > 0.3

  return res.json({
    success,
    output: generateMockOutput(language),
    executionTime: Math.floor(Math.random() * 500) + 50,
    memoryUsed: Math.floor(Math.random() * 50) + 10,
  })
})

router.post("/code/submit", async (req, res) => {
  const { code, language, problemId, userId } = req.body

  if (!code || !language || !problemId) {
    return res.status(400).json({ error: "code, language, and problemId are required" })
  }

  await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 1000))

  const testCases = [
    { input: "Test case 1", expected: "Expected output 1", passed: true },
    { input: "Test case 2", expected: "Expected output 2", passed: true },
    { input: "Test case 3", expected: "Expected output 3", passed: Math.random() > 0.2 },
    { input: "Test case 4", expected: "Expected output 4", passed: Math.random() > 0.3 },
  ]

  const passedTests = testCases.filter((t) => t.passed).length
  const totalTests = testCases.length
  const success = passedTests === totalTests

  return res.json({
    success,
    passedTests,
    totalTests,
    testCases,
    executionTime: Math.floor(Math.random() * 1000) + 100,
    memoryUsed: Math.floor(Math.random() * 100) + 20,
    message: success
      ? "Congratulations! All test cases passed."
      : `${passedTests}/${totalTests} test cases passed. Keep trying!`,
  })
})

export default router
