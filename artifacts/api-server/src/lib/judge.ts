/**
 * judge.ts — Problem test suite and verdict engine
 *
 * Supported languages: python | javascript | cpp | java
 *
 * For each submission:
 *  1. Look up the problem's test suite
 *  2. Generate a language-specific harness wrapping the user code
 *  3. Run each test case sequentially (fail-fast by default)
 *  4. Return per-test-case verdicts + overall result
 *
 * Verdicts per test case:
 *   AC  — Accepted (output matches expected)
 *   WA  — Wrong Answer
 *   TLE — Time Limit Exceeded (wall-clock or CPU)
 *   RE  — Runtime Error (non-zero exit)
 *   CE  — Compile Error (compilation failed)
 *   MLE — Memory Limit Exceeded (OOM signal)
 *   OLE — Output Limit Exceeded
 */

import { executeCode } from "./executor.js";
import type { ExecutionResult } from "./executor.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export type JudgeVerdict = "AC" | "WA" | "TLE" | "RE" | "CE" | "MLE" | "OLE";

export interface JudgeTestResult {
  description: string;
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  verdict: JudgeVerdict;
  executionTimeMs: number;
  stderr?: string;
}

interface TestCase {
  description: string;
  input: string;
  expected: string;
}

interface ProblemTestSuite {
  pythonHarness:     (code: string, tc: TestCase) => string;
  jsHarness:         (code: string, tc: TestCase) => string;
  cppHarness:        (code: string, tc: TestCase) => string;
  javaHarness:       (code: string, tc: TestCase) => string;
  testCases: TestCase[];
}

// ── Code strippers ────────────────────────────────────────────────────────────

function stripPythonBoilerplate(code: string): string {
  const lines = code.split("\n");
  const keep: string[] = [];
  let inBlock = false;
  let blockIndent = 0;

  for (const line of lines) {
    const stripped = line.trimStart();
    const indent = line.length - stripped.length;

    if (stripped.startsWith("def ") || stripped.startsWith("class ") ||
        stripped.startsWith("import ") || stripped.startsWith("from ")) {
      // If we're already inside a block and this is an import/from at a deeper
      // indent, keep it as a body line — do NOT reset inBlock.
      if (inBlock && indent > blockIndent &&
          (stripped.startsWith("import ") || stripped.startsWith("from "))) {
        keep.push(line);
        continue;
      }
      inBlock = stripped.startsWith("def ") || stripped.startsWith("class ");
      blockIndent = indent;
      keep.push(line);
      continue;
    }
    if (inBlock) {
      if (line.trim() === "" || indent > blockIndent) {
        keep.push(line);
      } else {
        inBlock = false;
      }
    }
  }
  return keep.join("\n");
}

function stripJsBoilerplate(code: string): string {
  const lines = code.split("\n");
  const keep: string[] = [];
  let depth = 0;
  let inFn = false;

  for (const line of lines) {
    const s = line.trim();
    if (s.startsWith("function ") || s.startsWith("const ") || s.startsWith("class ")) {
      inFn = true;
    }
    if (inFn) {
      keep.push(line);
      for (const ch of line) {
        if (ch === "{") depth++;
        if (ch === "}") depth--;
      }
      if (depth === 0 && keep.length > 0) inFn = false;
    }
  }
  return keep.join("\n");
}

function stripCppBoilerplate(code: string): string {
  const lines = code.split("\n");
  const result: string[] = [];
  let inMain = false;
  let depth = 0;

  for (const line of lines) {
    if (line.includes("int main(")) { inMain = true; }
    if (!inMain) {
      result.push(line);
    } else {
      for (const ch of line) {
        if (ch === "{") depth++;
        if (ch === "}") depth--;
      }
      if (depth === 0) inMain = false;
    }
  }
  return result.join("\n");
}

/**
 * Remove class wrapper and main() from Java code, keeping only method bodies.
 * Users are expected to write static methods without the class shell.
 */
function stripJavaBoilerplate(code: string): string {
  let s = code
    .replace(/public\s+class\s+\w+\s*\{/, "")  // opening class brace
    .replace(/public\s+static\s+void\s+main\s*\([^)]*\)\s*(?:throws[^{]*)?\{[\s\S]*?\}\s*(?=\n|$)/gm, "")
    .trim();
  // Remove trailing lone closing brace (class end)
  if (s.endsWith("}")) {
    const lastBrace = s.lastIndexOf("}");
    // Only strip if it's on its own line
    const beforeBrace = s.slice(0, lastBrace).trimEnd();
    if (beforeBrace.split("\n").at(-1)?.trim() === "") {
      s = beforeBrace;
    }
  }
  return s;
}

// ── Shared input-parsing helpers ──────────────────────────────────────────────

/** Walk bracket depth to split "[arr], scalar" robustly. */
function parseArrayAndScalar(input: string): { arrStr: string; scalar: string } {
  let depth = 0;
  let end = -1;
  for (let i = 0; i < input.length; i++) {
    if (input[i] === "[") depth++;
    else if (input[i] === "]") { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) return { arrStr: input.trim(), scalar: "" };
  return {
    arrStr: input.slice(0, end + 1).trim(),
    scalar: input.slice(end + 1).replace(/^[,\s]+/, "").trim(),
  };
}

/** `[1,2,3]` → `{1,2,3}` for C++ / Java array initialiser */
function jsArrToInitializer(s: string): string {
  return s.replace(/\[/g, "{").replace(/\]/g, "}");
}

/** Java int-array literal: `[2,7,11,15]` → `new int[]{2, 7, 11, 15}` */
function jsIntArrToJava(s: string): string {
  return `new int[]${jsArrToInitializer(s)}`;
}

/** Java char-array literal from JSON char array string */
function jsCharArrToJava(s: string): string {
  const chars = JSON.parse(s) as string[];
  return `new char[]{${chars.map((c) => `'${c}'`).join(", ")}}`;
}

// ── Java output helpers (shared across harnesses) ────────────────────────────

const JAVA_INT_ARR_PRINT = `
        StringBuilder __sb = new StringBuilder("[");
        for (int __i = 0; __i < __result.length; __i++) {
            if (__i > 0) __sb.append(", ");
            __sb.append(__result[__i]);
        }
        __sb.append("]");
        System.out.println(__sb);`;

const JAVA_INT_LIST_PRINT = `
        StringBuilder __sb = new StringBuilder("[");
        for (int __i = 0; __i < __result.size(); __i++) {
            if (__i > 0) __sb.append(", ");
            __sb.append(__result.get(__i));
        }
        __sb.append("]");
        System.out.println(__sb);`;

// ── Problem test suites ───────────────────────────────────────────────────────

const problemSuites: Record<number, ProblemTestSuite> = {

  // ── 1. Two Sum ────────────────────────────────────────────────────────────
  1: {
    testCases: [
      { description: "Example 1",  input: "[2,7,11,15], 9", expected: "[0, 1]" },
      { description: "Example 2",  input: "[3,2,4], 6",     expected: "[1, 2]" },
      { description: "Pair at end",input: "[3,3], 6",       expected: "[0, 1]" },
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
      const { arrStr, scalar: target } = parseArrayAndScalar(tc.input);
      return `
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

${stripCppBoilerplate(code)}

int main() {
  vector<int> nums = ${jsArrToInitializer(arrStr)};
  int target = ${target};
  auto result = twoSum(nums, target);
  sort(result.begin(), result.end());
  cout << "[";
  for (size_t i = 0; i < result.size(); i++) { if (i) cout << ", "; cout << result[i]; }
  cout << "]" << endl;
  return 0;
}
`;
    },
    javaHarness: (code, tc) => {
      const { arrStr, scalar: target } = parseArrayAndScalar(tc.input);
      return `
import java.util.*;
public class Solution {
    ${stripJavaBoilerplate(code)}
    public static void main(String[] args) throws Exception {
        int[] nums = ${jsIntArrToJava(arrStr)};
        int target = ${target};
        int[] __result = twoSum(nums, target);
        Arrays.sort(__result);
        ${JAVA_INT_ARR_PRINT}
    }
}
`;
    },
  },

  // ── 2. Reverse String ─────────────────────────────────────────────────────
  2: {
    testCases: [
      { description: "Hello",       input: '["h","e","l","l","o"]',     expected: '["o","l","l","e","h"]' },
      { description: "Hannah",      input: '["H","a","n","n","a","h"]',  expected: '["h","a","n","n","a","H"]' },
      { description: "Single char", input: '["a"]',                      expected: '["a"]' },
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
      const chars = JSON.parse(tc.input) as string[];
      return `
#include <iostream>
#include <vector>
using namespace std;

${stripCppBoilerplate(code)}

int main() {
  vector<char> s = {${chars.map((c) => `'${c}'`).join(", ")}};
  reverseString(s);
  cout << "[";
  for (size_t i = 0; i < s.size(); i++) { if (i) cout << ","; cout << "\\"" << s[i] << "\\""; }
  cout << "]" << endl;
  return 0;
}
`;
    },
    javaHarness: (code, tc) => {
      const chars = JSON.parse(tc.input) as string[];
      return `
import java.util.*;
public class Solution {
    ${stripJavaBoilerplate(code)}
    public static void main(String[] args) throws Exception {
        char[] s = ${jsCharArrToJava(tc.input)};
        reverseString(s);
        StringBuilder __sb = new StringBuilder("[");
        for (int __i = 0; __i < s.length; __i++) {
            if (__i > 0) __sb.append(",");
            __sb.append("\\"").append(s[__i]).append("\\"");
        }
        __sb.append("]");
        System.out.println(__sb);
    }
}
`;
    },
  },

  // ── 3. Binary Search ─────────────────────────────────────────────────────
  3: {
    testCases: [
      { description: "Target found at 4",   input: "[-1,0,3,5,9,12], 9", expected: "4"  },
      { description: "Target not found",    input: "[-1,0,3,5,9,12], 2", expected: "-1" },
      { description: "Single element found",input: "[5], 5",             expected: "0"  },
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
      const { arrStr, scalar: target } = parseArrayAndScalar(tc.input);
      return `
#include <iostream>
#include <vector>
using namespace std;

${stripCppBoilerplate(code)}

int main() {
  vector<int> nums = ${jsArrToInitializer(arrStr)};
  cout << search(nums, ${target}) << endl;
  return 0;
}
`;
    },
    javaHarness: (code, tc) => {
      const { arrStr, scalar: target } = parseArrayAndScalar(tc.input);
      return `
import java.util.*;
public class Solution {
    ${stripJavaBoilerplate(code)}
    public static void main(String[] args) throws Exception {
        int[] nums = ${jsIntArrToJava(arrStr)};
        System.out.println(search(nums, ${target}));
    }
}
`;
    },
  },

  // ── 4. Valid Parentheses ─────────────────────────────────────────────────
  4: {
    testCases: [
      { description: 'Valid ()',     input: '"()"',    expected: "true"  },
      { description: 'Valid ()[]{}'.replace(/'/g,""), input: '"()[]{}"', expected: "true"  },
      { description: 'Invalid (]',  input: '"(]"',    expected: "false" },
      { description: 'Invalid ([)]',input: '"([)]"',  expected: "false" },
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
    javaHarness: (code, tc) => `
import java.util.*;
public class Solution {
    ${stripJavaBoilerplate(code)}
    public static void main(String[] args) throws Exception {
        System.out.println(isValid(${tc.input}) ? "true" : "false");
    }
}
`,
  },

  // ── 5. Maximum Subarray ──────────────────────────────────────────────────
  5: {
    testCases: [
      { description: "Standard case",  input: "[-2,1,-3,4,-1,2,1,-5,4]", expected: "6"  },
      { description: "All positive",   input: "[1,2,3,4,5]",             expected: "15" },
      { description: "Single element", input: "[-1]",                    expected: "-1" },
      { description: "All negative",   input: "[-2,-1,-3]",              expected: "-1" },
    ],
    pythonHarness: (code, tc) => `
${stripPythonBoilerplate(code)}

print(max_subarray(${tc.input}))
`,
    jsHarness: (code, tc) => `
${stripJsBoilerplate(code)}

console.log(maxSubArray(${tc.input}));
`,
    cppHarness: (code, tc) => `
#include <iostream>
#include <vector>
#include <climits>
using namespace std;

${stripCppBoilerplate(code)}

int main() {
  vector<int> nums = ${jsArrToInitializer(tc.input)};
  cout << maxSubArray(nums) << endl;
  return 0;
}
`,
    javaHarness: (code, tc) => `
import java.util.*;
public class Solution {
    ${stripJavaBoilerplate(code)}
    public static void main(String[] args) throws Exception {
        int[] nums = ${jsIntArrToJava(tc.input)};
        System.out.println(maxSubArray(nums));
    }
}
`,
  },

  // ── 6. BFS ───────────────────────────────────────────────────────────────
  6: {
    testCases: [
      { description: "All reachable",    input: "[[1,2],[3],[3],[]], 0", expected: "[0, 1, 2, 3]" },
      { description: "Partial reachable",input: "[[1],[],[3]], 0",       expected: "[0, 1]"       },
      { description: "Source only",      input: "[[],[1]], 1",           expected: "[1]"           },
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
      const { arrStr, scalar: source } = parseArrayAndScalar(tc.input);
      return `
#include <iostream>
#include <vector>
#include <queue>
using namespace std;

${stripCppBoilerplate(code)}

int main() {
  vector<vector<int>> graph = ${jsArrToInitializer(arrStr)};
  int source = ${source};
  auto result = bfs(graph, source);
  cout << "[";
  for (size_t i = 0; i < result.size(); i++) { if (i) cout << ", "; cout << result[i]; }
  cout << "]" << endl;
  return 0;
}
`;
    },
    javaHarness: (code, tc) => {
      const { arrStr, scalar: source } = parseArrayAndScalar(tc.input);
      const graph = JSON.parse(arrStr) as number[][];
      const graphInit = `new int[][]{${graph.map((row) => `{${row.join(", ")}}`).join(", ")}}`;
      return `
import java.util.*;
public class Solution {
    ${stripJavaBoilerplate(code)}
    public static void main(String[] args) throws Exception {
        int[][] __g = ${graphInit};
        List<List<Integer>> graph = new ArrayList<>();
        for (int[] __row : __g) {
            List<Integer> __list = new ArrayList<>();
            for (int __v : __row) __list.add(__v);
            graph.add(__list);
        }
        List<Integer> __result = bfs(graph, ${source});
        ${JAVA_INT_LIST_PRINT}
    }
}
`;
    },
  },
};

// ── Output normalisation & verdict determination ───────────────────────────────

function normalise(s: string): string {
  const t = s.trim();
  if (t === "True" || t === "true" || t === "1") return "true";
  if (t === "False" || t === "false" || t === "0") return "false";
  try { return JSON.stringify(JSON.parse(t)); } catch { return t; }
}

function determineVerdict(exec: ExecutionResult, expected: string, actual: string): JudgeVerdict {
  if (exec.compileError)                         return "CE";
  if (exec.outputLimitHit)                       return "OLE";
  if (exec.timedOut || exec.cpuLimitHit)         return "TLE";
  // OOM signals: SIGSEGV (11) can indicate MLE on Linux
  if (exec.exitCode === 137 /* SIGKILL */ && !exec.timedOut) return "MLE";
  if (exec.exitCode !== 0)                       return "RE";
  const pass = actual === expected || normalise(actual) === normalise(expected);
  return pass ? "AC" : "WA";
}

// ── Main judge entry point ────────────────────────────────────────────────────

export interface JudgeOptions {
  /** Stop on first non-AC result (default: true) */
  failFast?: boolean;
}

export async function judgeSubmission(
  problemId: number,
  language: string,
  code: string,
  opts: JudgeOptions = {},
): Promise<{
  results: JudgeTestResult[];
  passedTests: number;
  totalTests: number;
  success: boolean;
  overallVerdict: string;
  totalExecutionTimeMs: number;
}> {
  const { failFast = true } = opts;
  const suite = problemSuites[problemId];

  if (!suite) {
    return {
      results: [], passedTests: 0, totalTests: 0, success: false,
      overallVerdict: "RE", totalExecutionTimeMs: 0,
    };
  }

  const getHarness = (tc: TestCase): string => {
    const lang = language.toLowerCase();
    if (lang === "python")     return suite.pythonHarness(code, tc);
    if (lang === "javascript") return suite.jsHarness(code, tc);
    if (lang === "cpp")        return suite.cppHarness(code, tc);
    if (lang === "java")       return suite.javaHarness(code, tc);
    return code;
  };

  const results: JudgeTestResult[] = [];
  let totalExecutionTimeMs = 0;

  for (const tc of suite.testCases) {
    let result: JudgeTestResult;

    try {
      const harness = getHarness(tc);
      const exec    = await executeCode(language, harness);
      const actual  = exec.stdout.trim();
      const expected = tc.expected.trim();
      const verdict  = determineVerdict(exec, expected, actual);

      result = {
        description: tc.description,
        input:       tc.input,
        expected,
        actual: verdict === "TLE" ? "Time Limit Exceeded"
              : verdict === "CE"  ? exec.stderr || "Compile Error"
              : verdict === "MLE" ? "Memory Limit Exceeded"
              : verdict === "OLE" ? "Output Limit Exceeded"
              : actual || exec.stderr || "(no output)",
        passed:          verdict === "AC",
        verdict,
        executionTimeMs: exec.executionTimeMs,
        stderr:          exec.stderr || undefined,
      };
    } catch (err) {
      result = {
        description: tc.description, input: tc.input, expected: tc.expected,
        actual: "Internal error", passed: false, verdict: "RE",
        executionTimeMs: 0, stderr: String(err),
      };
    }

    results.push(result);
    totalExecutionTimeMs += result.executionTimeMs;

    if (failFast && !result.passed) break;
  }

  // Pad skipped test cases with a "skipped" placeholder
  if (failFast && results.length < suite.testCases.length) {
    for (let i = results.length; i < suite.testCases.length; i++) {
      const tc = suite.testCases[i]!;
      results.push({
        description: tc.description, input: tc.input, expected: tc.expected,
        actual: "Skipped", passed: false, verdict: "RE",
        executionTimeMs: 0,
      });
    }
  }

  const passedTests = results.filter((r) => r.verdict === "AC").length;
  const firstFail   = results.find((r) => r.verdict !== "AC" && r.actual !== "Skipped");
  const overallVerdict = passedTests === suite.testCases.length
    ? "accepted"
    : firstFail
      ? verdictToStatus(firstFail.verdict)
      : "wrong_answer";

  return {
    results,
    passedTests,
    totalTests: suite.testCases.length,
    success: passedTests === suite.testCases.length,
    overallVerdict,
    totalExecutionTimeMs,
  };
}

function verdictToStatus(v: JudgeVerdict): string {
  switch (v) {
    case "TLE": return "time_limit_exceeded";
    case "RE":  return "runtime_error";
    case "CE":  return "compile_error";
    case "MLE": return "memory_limit_exceeded";
    case "OLE": return "output_limit_exceeded";
    default:    return "wrong_answer";
  }
}
