import { executeCode } from "./executor.js"

interface TestCase {
  description: string
  input: string
  expected: string
}

interface ProblemTestSuite {
  pythonHarness: (userCode: string, tc: TestCase) => string
  jsHarness: (userCode: string, tc: TestCase) => string
  cppHarness: (userCode: string, tc: TestCase) => string
  testCases: TestCase[]
}

function stripPythonBoilerplate(code: string): string {
  const lines = code.split("\n")
  const keepLines: string[] = []
  let inFunction = false
  let functionIndentLevel = 0

  for (const line of lines) {
    const stripped = line.trimStart()
    const indentLevel = line.length - stripped.length

    if (
      stripped.startsWith("def ") ||
      stripped.startsWith("class ") ||
      stripped.startsWith("import ") ||
      stripped.startsWith("from ")
    ) {
      inFunction = stripped.startsWith("def ") || stripped.startsWith("class ")
      functionIndentLevel = indentLevel
      keepLines.push(line)
      continue
    }

    if (inFunction) {
      if (line.trim() === "" || indentLevel > functionIndentLevel) {
        keepLines.push(line)
      } else {
        inFunction = false
      }
    }
  }

  return keepLines.join("\n")
}

function stripJsBoilerplate(code: string): string {
  const lines = code.split("\n")
  const keepLines: string[] = []
  let braceDepth = 0
  let inFunction = false

  for (const line of lines) {
    const stripped = line.trim()
    if (
      stripped.startsWith("function ") ||
      stripped.startsWith("const ") ||
      stripped.startsWith("class ")
    ) {
      inFunction = true
    }
    if (inFunction) {
      keepLines.push(line)
      for (const ch of line) {
        if (ch === "{") braceDepth++
        if (ch === "}") braceDepth--
      }
      if (braceDepth === 0 && keepLines.length > 0) {
        inFunction = false
      }
    }
  }
  return keepLines.join("\n")
}

function stripCppBoilerplate(code: string): string {
  const lines = code.split("\n")
  const result: string[] = []
  let inMain = false
  let braceDepth = 0

  for (const line of lines) {
    if (line.includes("int main(")) {
      inMain = true
    }
    if (!inMain) {
      result.push(line)
    } else {
      for (const ch of line) {
        if (ch === "{") braceDepth++
        if (ch === "}") braceDepth--
      }
      if (braceDepth === 0) {
        inMain = false
      }
    }
  }
  return result.join("\n")
}

/**
 * Parse input of the form "[arr_elements], scalar" where the array may
 * itself contain commas. Walks bracket depth to find the closing ] of the
 * outer array and treats everything after the following comma as the scalar.
 */
function parseArrayAndScalar(input: string): { arrStr: string; scalar: string } {
  let depth = 0
  let endIdx = -1
  for (let i = 0; i < input.length; i++) {
    if (input[i] === "[") depth++
    else if (input[i] === "]") {
      depth--
      if (depth === 0) {
        endIdx = i
        break
      }
    }
  }
  if (endIdx === -1) {
    return { arrStr: input.trim(), scalar: "" }
  }
  const arrStr = input.slice(0, endIdx + 1).trim()
  const scalar = input.slice(endIdx + 1).replace(/^[,\s]+/, "").trim()
  return { arrStr, scalar }
}

/** Convert a JS array literal string like "[[1,2],[3]]" into C++ "{{1,2},{3}}" */
function jsArrayToCpp(arr: string): string {
  return arr.replace(/\[/g, "{").replace(/\]/g, "}")
}

const problemSuites: Record<number, ProblemTestSuite> = {
  1: {
    testCases: [
      { description: "Example 1", input: "[2,7,11,15], 9", expected: "[0, 1]" },
      { description: "Example 2", input: "[3,2,4], 6", expected: "[1, 2]" },
      { description: "Pair at end", input: "[3,3], 6", expected: "[0, 1]" },
    ],
    pythonHarness: (code, tc) => `
${stripPythonBoilerplate(code)}

import json
_result = sorted(two_sum(${tc.input}))
print(json.dumps(_result))
`,
    jsHarness: (code, tc) => `
${stripJsBoilerplate(code)}

const _r = twoSum(${tc.input});
console.log(JSON.stringify(_r.slice().sort((a, b) => a - b)));
`,
    cppHarness: (code, tc) => {
      const { arrStr, scalar: target } = parseArrayAndScalar(tc.input)
      const cppNums = jsArrayToCpp(arrStr)
      return `
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

${stripCppBoilerplate(code)}

int main() {
  vector<int> nums = ${cppNums};
  int target = ${target};
  auto result = twoSum(nums, target);
  sort(result.begin(), result.end());
  cout << "[";
  for (size_t i = 0; i < result.size(); i++) {
    if (i) cout << ", ";
    cout << result[i];
  }
  cout << "]" << endl;
  return 0;
}
`
    },
  },

  2: {
    testCases: [
      { description: "Hello", input: '["h","e","l","l","o"]', expected: '["o","l","l","e","h"]' },
      { description: "Hannah", input: '["H","a","n","n","a","h"]', expected: '["h","a","n","n","a","H"]' },
      { description: "Single char", input: '["a"]', expected: '["a"]' },
    ],
    pythonHarness: (code, tc) => `
${stripPythonBoilerplate(code)}

import json
_s = ${tc.input}
reverse_string(_s)
print(json.dumps(_s))
`,
    jsHarness: (code, tc) => `
${stripJsBoilerplate(code)}

const _s = ${tc.input};
reverseString(_s);
console.log(JSON.stringify(_s));
`,
    cppHarness: (code, tc) => {
      const chars = JSON.parse(tc.input) as string[]
      const cppInit = chars.map((c) => `'${c}'`).join(", ")
      return `
#include <iostream>
#include <vector>
using namespace std;

${stripCppBoilerplate(code)}

int main() {
  vector<char> s = {${cppInit}};
  reverseString(s);
  cout << "[";
  for (size_t i = 0; i < s.size(); i++) {
    if (i) cout << ",";
    cout << "\\"" << s[i] << "\\"";
  }
  cout << "]" << endl;
  return 0;
}
`
    },
  },

  3: {
    testCases: [
      { description: "Target found at index 4", input: "[-1,0,3,5,9,12], 9", expected: "4" },
      { description: "Target not found", input: "[-1,0,3,5,9,12], 2", expected: "-1" },
      { description: "Single element found", input: "[5], 5", expected: "0" },
    ],
    pythonHarness: (code, tc) => `
${stripPythonBoilerplate(code)}

print(binary_search(${tc.input}))
`,
    jsHarness: (code, tc) => `
${stripJsBoilerplate(code)}

console.log(search(${tc.input}));
`,
    cppHarness: (code, tc) => {
      const { arrStr, scalar: target } = parseArrayAndScalar(tc.input)
      const cppNums = jsArrayToCpp(arrStr)
      return `
#include <iostream>
#include <vector>
using namespace std;

${stripCppBoilerplate(code)}

int main() {
  vector<int> nums = ${cppNums};
  cout << search(nums, ${target}) << endl;
  return 0;
}
`
    },
  },

  4: {
    // All expected values use lowercase "true"/"false" so they match Python
    // (via .lower()), JavaScript (native bool.toString()), and C++ outputs.
    testCases: [
      { description: "Valid ()", input: '"()"', expected: "true" },
      { description: "Valid ()[]{}", input: '"()[]{}"', expected: "true" },
      { description: "Invalid (]", input: '"(]"', expected: "false" },
      { description: "Invalid ([)]", input: '"([)]"', expected: "false" },
    ],
    pythonHarness: (code, tc) => `
${stripPythonBoilerplate(code)}

print(str(is_valid(${tc.input})).lower())
`,
    jsHarness: (code, tc) => `
${stripJsBoilerplate(code)}

console.log(String(isValid(${tc.input})));
`,
    cppHarness: (code, tc) => `
#include <iostream>
#include <string>
#include <stack>
using namespace std;

${stripCppBoilerplate(code)}

int main() {
  cout << (isValid(${tc.input}) ? "true" : "false") << endl;
  return 0;
}
`,
  },

  5: {
    testCases: [
      { description: "Standard case", input: "[-2,1,-3,4,-1,2,1,-5,4]", expected: "6" },
      { description: "All positive", input: "[1,2,3,4,5]", expected: "15" },
      { description: "Single element", input: "[-1]", expected: "-1" },
      { description: "All negative", input: "[-2,-1,-3]", expected: "-1" },
    ],
    pythonHarness: (code, tc) => `
${stripPythonBoilerplate(code)}

print(max_subarray(${tc.input}))
`,
    jsHarness: (code, tc) => `
${stripJsBoilerplate(code)}

console.log(maxSubArray(${tc.input}));
`,
    cppHarness: (code, tc) => {
      const cppNums = jsArrayToCpp(tc.input)
      return `
#include <iostream>
#include <vector>
#include <climits>
using namespace std;

${stripCppBoilerplate(code)}

int main() {
  vector<int> nums = ${cppNums};
  cout << maxSubArray(nums) << endl;
  return 0;
}
`
    },
  },

  6: {
    testCases: [
      { description: "All nodes reachable", input: "[[1,2],[3],[3],[]], 0", expected: "[0, 1, 2, 3]" },
      { description: "Partial reachable", input: "[[1],[],[3]], 0", expected: "[0, 1]" },
      { description: "Source only", input: "[[],[1]], 1", expected: "[1]" },
    ],
    pythonHarness: (code, tc) => `
from collections import deque

${stripPythonBoilerplate(code)}

import json
print(json.dumps(bfs(${tc.input})))
`,
    jsHarness: (code, tc) => `
${stripJsBoilerplate(code)}

console.log(JSON.stringify(bfs(${tc.input})));
`,
    cppHarness: (code, tc) => {
      const { arrStr: graphStr, scalar: source } = parseArrayAndScalar(tc.input)
      const graphCpp = jsArrayToCpp(graphStr)
      return `
#include <iostream>
#include <vector>
#include <queue>
using namespace std;

${stripCppBoilerplate(code)}

int main() {
  vector<vector<int>> graph = ${graphCpp};
  int source = ${source};
  auto result = bfs(graph, source);
  cout << "[";
  for (size_t i = 0; i < result.size(); i++) {
    if (i) cout << ", ";
    cout << result[i];
  }
  cout << "]" << endl;
  return 0;
}
`
    },
  },
}

export interface JudgeTestResult {
  description: string
  input: string
  expected: string
  actual: string
  passed: boolean
  stderr?: string
}

/** Normalise an output string for lenient comparison. */
function normalise(s: string): string {
  const t = s.trim()
  // Lowercase boolean variants
  if (t === "True" || t === "true" || t === "1") return "true"
  if (t === "False" || t === "false" || t === "0") return "false"
  // Try JSON round-trip for array/object outputs
  try {
    return JSON.stringify(JSON.parse(t))
  } catch {
    return t
  }
}

export async function judgeSubmission(
  problemId: number,
  language: string,
  code: string,
): Promise<{
  results: JudgeTestResult[]
  passedTests: number
  totalTests: number
  success: boolean
}> {
  const suite = problemSuites[problemId]
  if (!suite) {
    return { results: [], passedTests: 0, totalTests: 0, success: false }
  }

  const getHarness = (tc: TestCase): string => {
    if (language === "python") return suite.pythonHarness(code, tc)
    if (language === "javascript") return suite.jsHarness(code, tc)
    if (language === "cpp") return suite.cppHarness(code, tc)
    return code
  }

  const results: JudgeTestResult[] = await Promise.all(
    suite.testCases.map(async (tc) => {
      try {
        const harness = getHarness(tc)
        const exec = await executeCode(language, harness)
        const actual = exec.stdout.trim()
        const expected = tc.expected.trim()

        const passed = !exec.timedOut && exec.exitCode === 0
          && (actual === expected || normalise(actual) === normalise(expected))

        return {
          description: tc.description,
          input: tc.input,
          expected,
          actual: exec.timedOut
            ? "Time Limit Exceeded"
            : actual || exec.stderr || "(no output)",
          passed,
          stderr: exec.stderr || undefined,
        }
      } catch (err) {
        return {
          description: tc.description,
          input: tc.input,
          expected: tc.expected,
          actual: "Execution error",
          passed: false,
          stderr: String(err),
        }
      }
    }),
  )

  const passedTests = results.filter((r) => r.passed).length
  return {
    results,
    passedTests,
    totalTests: results.length,
    success: passedTests === results.length,
  }
}
