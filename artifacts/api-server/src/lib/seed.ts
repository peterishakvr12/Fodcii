import { db, problemsTable, testCasesTable, usersTable } from "@workspace/db";
import { count } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { logger } from "./logger.js";

const seedProblems = [
  {
    title: "Two Sum",
    category: "Arrays",
    difficulty: "Easy",
    level: 1,
    description:
      "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]", explanation: "Because nums[1] + nums[2] == 6, we return [1, 2]." },
    ],
    constraints: ["2 ≤ nums.length ≤ 10⁴", "-10⁹ ≤ nums[i] ≤ 10⁹", "-10⁹ ≤ target ≤ 10⁹", "Only one valid answer exists."],
    starterCode: {
      python: "def two_sum(nums, target):\n    # Write your solution here\n    pass\n\nnums = [2, 7, 11, 15]\ntarget = 9\nresult = two_sum(nums, target)\nprint(result)",
      cpp: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nvector<int> twoSum(vector<int>& nums, int target) {\n    // Write your solution here\n    return {};\n}\n\nint main() {\n    vector<int> nums = {2, 7, 11, 15};\n    int target = 9;\n    vector<int> result = twoSum(nums, target);\n    for (int i : result) cout << i << \" \";\n    return 0;\n}",
      javascript: "function twoSum(nums, target) {\n    // Write your solution here\n}\n\nconst nums = [2, 7, 11, 15];\nconst target = 9;\nconsole.log(twoSum(nums, target));",
    },
    acceptanceRate: "85.20",
    submissionsCount: 1234,
    testCases: [
      { input: "nums=[2,7,11,15] target=9", expectedOutput: "[0,1]", isSample: true },
      { input: "nums=[3,2,4] target=6", expectedOutput: "[1,2]", isSample: true },
      { input: "nums=[3,3] target=6", expectedOutput: "[0,1]", isSample: false },
      { input: "nums=[1,2,3,4] target=7", expectedOutput: "[2,3]", isSample: false },
    ],
  },
  {
    title: "Reverse String",
    category: "Strings",
    difficulty: "Easy",
    level: 1,
    description:
      "Write a function that reverses a string. The input string is given as an array of characters s.\n\nYou must do this by modifying the input array in-place with O(1) extra memory.",
    examples: [
      { input: 's = ["h","e","l","l","o"]', output: '["o","l","l","e","h"]', explanation: "The string is reversed in-place." },
    ],
    constraints: ["1 ≤ s.length ≤ 10⁵", "s[i] is a printable ascii character."],
    starterCode: {
      python: "def reverse_string(s):\n    # Write your solution here\n    pass",
      cpp: "void reverseString(vector<char>& s) {\n    // Write your solution here\n}",
      javascript: "function reverseString(s) {\n    // Write your solution here\n}",
    },
    acceptanceRate: "92.10",
    submissionsCount: 892,
    testCases: [
      { input: '["h","e","l","l","o"]', expectedOutput: '["o","l","l","e","h"]', isSample: true },
      { input: '["H","a","n","n","a","h"]', expectedOutput: '["h","a","n","n","a","H"]', isSample: true },
      { input: '["a"]', expectedOutput: '["a"]', isSample: false },
    ],
  },
  {
    title: "Binary Search",
    category: "Algorithms",
    difficulty: "Medium",
    level: 2,
    description:
      "Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.\n\nYou must write an algorithm with O(log n) runtime complexity.",
    examples: [
      { input: "nums = [-1,0,3,5,9,12], target = 9", output: "4", explanation: "9 exists in nums and its index is 4" },
    ],
    constraints: ["1 ≤ nums.length ≤ 10⁴", "-10⁴ < nums[i], target < 10⁴", "All integers in nums are unique.", "nums is sorted in ascending order."],
    starterCode: {
      python: "def binary_search(nums, target):\n    # Write your solution here\n    pass\n\nprint(binary_search([-1, 0, 3, 5, 9, 12], 9))",
      cpp: "int search(vector<int>& nums, int target) {\n    // Write your solution here\n    return -1;\n}",
      javascript: "function search(nums, target) {\n    // Write your solution here\n}",
    },
    acceptanceRate: "78.30",
    submissionsCount: 567,
    testCases: [
      { input: "nums=[-1,0,3,5,9,12] target=9", expectedOutput: "4", isSample: true },
      { input: "nums=[-1,0,3,5,9,12] target=2", expectedOutput: "-1", isSample: true },
      { input: "nums=[5] target=5", expectedOutput: "0", isSample: false },
      { input: "nums=[1,3,5,7,9] target=7", expectedOutput: "3", isSample: false },
    ],
  },
  {
    title: "Valid Parentheses",
    category: "Stacks",
    difficulty: "Easy",
    level: 1,
    description:
      "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n- Open brackets must be closed by the same type of brackets.\n- Open brackets must be closed in the correct order.",
    examples: [
      { input: 's = "()"', output: "true", explanation: "The string contains a valid pair of parentheses." },
      { input: 's = "()[]{}"', output: "true", explanation: "All bracket types are valid." },
      { input: 's = "(]"', output: "false", explanation: "Brackets are not closed in the correct order." },
    ],
    constraints: ["1 ≤ s.length ≤ 10⁴", "s consists of parentheses only '()[]{}'."],
    starterCode: {
      python: "def is_valid(s):\n    # Write your solution here\n    pass",
      cpp: "bool isValid(string s) {\n    // Write your solution here\n    return false;\n}",
      javascript: "function isValid(s) {\n    // Write your solution here\n}",
    },
    acceptanceRate: "88.40",
    submissionsCount: 745,
    testCases: [
      { input: "()", expectedOutput: "true", isSample: true },
      { input: "()[]{}", expectedOutput: "true", isSample: true },
      { input: "(]", expectedOutput: "false", isSample: false },
      { input: "([)]", expectedOutput: "false", isSample: false },
      { input: "{[]}", expectedOutput: "true", isSample: false },
    ],
  },
  {
    title: "Maximum Subarray",
    category: "Dynamic Programming",
    difficulty: "Medium",
    level: 2,
    description:
      "Given an integer array nums, find the subarray with the largest sum, and return its sum.",
    examples: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", explanation: "The subarray [4,-1,2,1] has the largest sum 6." },
    ],
    constraints: ["1 ≤ nums.length ≤ 10⁵", "-10⁴ ≤ nums[i] ≤ 10⁴"],
    starterCode: {
      python: "def max_subarray(nums):\n    # Write your solution here\n    pass",
      cpp: "int maxSubArray(vector<int>& nums) {\n    // Write your solution here\n    return 0;\n}",
      javascript: "function maxSubArray(nums) {\n    // Write your solution here\n}",
    },
    acceptanceRate: "72.10",
    submissionsCount: 432,
    testCases: [
      { input: "[-2,1,-3,4,-1,2,1,-5,4]", expectedOutput: "6", isSample: true },
      { input: "[1]", expectedOutput: "1", isSample: true },
      { input: "[5,4,-1,7,8]", expectedOutput: "23", isSample: false },
    ],
  },
  {
    title: "Graph Traversal (BFS/DFS)",
    category: "Graphs",
    difficulty: "Hard",
    level: 3,
    description:
      "Given a directed graph with n nodes labeled from 0 to n-1, find all reachable nodes from the given source node.\n\nReturn the nodes in BFS order.",
    examples: [
      { input: "graph = [[1,2],[3],[3],[]], source = 0", output: "[0,1,2,3]", explanation: "All nodes are reachable from 0." },
    ],
    constraints: ["1 ≤ n ≤ 10⁴", "0 ≤ graph[i].length ≤ n"],
    starterCode: {
      python: "from collections import deque\n\ndef bfs(graph, source):\n    # Write your solution here\n    pass",
      cpp: "vector<int> bfs(vector<vector<int>>& graph, int source) {\n    // Write your solution here\n    return {};\n}",
      javascript: "function bfs(graph, source) {\n    // Write your solution here\n}",
    },
    acceptanceRate: "61.30",
    submissionsCount: 201,
    testCases: [
      { input: "graph=[[1,2],[3],[3],[]] source=0", expectedOutput: "[0,1,2,3]", isSample: true },
      { input: "graph=[[1],[2],[]] source=0", expectedOutput: "[0,1,2]", isSample: false },
    ],
  },
];

export async function seed() {
  try {
    const [{ value: problemCount }] = await db.select({ value: count() }).from(problemsTable);

    if (Number(problemCount) === 0) {
      logger.info("Seeding problems...");

      for (const p of seedProblems) {
        const { testCases, ...problemData } = p;
        const [inserted] = await db
          .insert(problemsTable)
          .values({
            title: problemData.title,
            category: problemData.category,
            difficulty: problemData.difficulty,
            level: problemData.level,
            description: problemData.description,
            examples: problemData.examples,
            constraints: problemData.constraints,
            starterCode: problemData.starterCode,
            acceptanceRate: problemData.acceptanceRate,
            submissionsCount: problemData.submissionsCount,
          })
          .returning({ id: problemsTable.id });

        await db.insert(testCasesTable).values(
          testCases.map((tc) => ({
            problemId: inserted.id,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            isSample: tc.isSample,
          }))
        );
      }

      logger.info(`Seeded ${seedProblems.length} problems with test cases`);
    }

    const [{ value: adminCount }] = await db
      .select({ value: count() })
      .from(usersTable);

    if (Number(adminCount) === 0) {
      const passwordHash = await bcrypt.hash("admin123", 12);
      await db.insert(usersTable).values({
        username: "admin",
        email: "admin@fodci.dev",
        passwordHash,
        role: "admin",
      });
      logger.info("Seeded admin user (admin@fodci.dev / admin123)");
    }
  } catch (err) {
    logger.error({ err }, "Seed failed");
  }
}
