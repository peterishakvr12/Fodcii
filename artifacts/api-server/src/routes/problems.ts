import { Router } from "express"

const router = Router()

const problems = [
  {
    id: 1,
    title: "Two Sum",
    category: "Arrays",
    difficulty: "Easy",
    level: 1,
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.`,
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]", explanation: "Because nums[1] + nums[2] == 6, we return [1, 2]." },
    ],
    constraints: ["2 ≤ nums.length ≤ 10⁴", "-10⁹ ≤ nums[i] ≤ 10⁹", "-10⁹ ≤ target ≤ 10⁹", "Only one valid answer exists."],
    solved: false,
    submissions: 1234,
    acceptanceRate: 85.2,
    starterCode: {
      python: `def two_sum(nums, target):\n    # Write your solution here\n    pass\n\nnums = [2, 7, 11, 15]\ntarget = 9\nresult = two_sum(nums, target)\nprint(result)`,
      cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nvector<int> twoSum(vector<int>& nums, int target) {\n    // Write your solution here\n    return {};\n}\n\nint main() {\n    vector<int> nums = {2, 7, 11, 15};\n    int target = 9;\n    vector<int> result = twoSum(nums, target);\n    for (int i : result) cout << i << " ";\n    return 0;\n}`,
      javascript: `function twoSum(nums, target) {\n    // Write your solution here\n}\n\nconst nums = [2, 7, 11, 15];\nconst target = 9;\nconsole.log(twoSum(nums, target));`,
    },
  },
  {
    id: 2,
    title: "Reverse String",
    category: "Strings",
    difficulty: "Easy",
    level: 1,
    description: `Write a function that reverses a string. The input string is given as an array of characters s.\n\nYou must do this by modifying the input array in-place with O(1) extra memory.`,
    examples: [
      { input: 's = ["h","e","l","l","o"]', output: '["o","l","l","e","h"]', explanation: "The string is reversed in-place." },
    ],
    constraints: ["1 ≤ s.length ≤ 10⁵", "s[i] is a printable ascii character."],
    solved: true,
    submissions: 892,
    acceptanceRate: 92.1,
    starterCode: {
      python: `def reverse_string(s):\n    # Write your solution here\n    pass`,
      cpp: `void reverseString(vector<char>& s) {\n    // Write your solution here\n}`,
      javascript: `function reverseString(s) {\n    // Write your solution here\n}`,
    },
  },
  {
    id: 3,
    title: "Binary Search",
    category: "Algorithms",
    difficulty: "Medium",
    level: 2,
    description: `Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.\n\nYou must write an algorithm with O(log n) runtime complexity.`,
    examples: [
      { input: "nums = [-1,0,3,5,9,12], target = 9", output: "4", explanation: "9 exists in nums and its index is 4" },
    ],
    constraints: ["1 ≤ nums.length ≤ 10⁴", "-10⁴ < nums[i], target < 10⁴", "All the integers in nums are unique.", "nums is sorted in ascending order."],
    solved: false,
    submissions: 567,
    acceptanceRate: 78.3,
    starterCode: {
      python: `def binary_search(nums, target):\n    # Write your solution here\n    pass`,
      cpp: `int search(vector<int>& nums, int target) {\n    // Write your solution here\n    return -1;\n}`,
      javascript: `function search(nums, target) {\n    // Write your solution here\n}`,
    },
  },
  {
    id: 4,
    title: "Valid Parentheses",
    category: "Stacks",
    difficulty: "Easy",
    level: 1,
    description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n- Open brackets must be closed by the same type of brackets.\n- Open brackets must be closed in the correct order.`,
    examples: [
      { input: 's = "()"', output: "true", explanation: "The string contains a valid pair of parentheses." },
      { input: 's = "()[]{}"', output: "true", explanation: "All bracket types are valid." },
      { input: 's = "(]"', output: "false", explanation: "The brackets are not closed in the correct order." },
    ],
    constraints: ["1 ≤ s.length ≤ 10⁴", "s consists of parentheses only '()[]{}'."],
    solved: false,
    submissions: 745,
    acceptanceRate: 88.4,
    starterCode: {
      python: `def is_valid(s):\n    # Write your solution here\n    pass`,
      cpp: `bool isValid(string s) {\n    // Write your solution here\n    return false;\n}`,
      javascript: `function isValid(s) {\n    // Write your solution here\n}`,
    },
  },
  {
    id: 5,
    title: "Maximum Subarray",
    category: "Dynamic Programming",
    difficulty: "Medium",
    level: 2,
    description: `Given an integer array nums, find the subarray with the largest sum, and return its sum.`,
    examples: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", explanation: "The subarray [4,-1,2,1] has the largest sum 6." },
    ],
    constraints: ["1 ≤ nums.length ≤ 10⁵", "-10⁴ ≤ nums[i] ≤ 10⁴"],
    solved: false,
    submissions: 432,
    acceptanceRate: 72.1,
    starterCode: {
      python: `def max_subarray(nums):\n    # Write your solution here\n    pass`,
      cpp: `int maxSubArray(vector<int>& nums) {\n    // Write your solution here\n    return 0;\n}`,
      javascript: `function maxSubArray(nums) {\n    // Write your solution here\n}`,
    },
  },
  {
    id: 6,
    title: "Graph Traversal (BFS/DFS)",
    category: "Graphs",
    difficulty: "Hard",
    level: 3,
    description: `Given a directed graph with n nodes labeled from 0 to n-1, find all reachable nodes from the given source node.\n\nReturn the nodes in BFS order.`,
    examples: [
      { input: "graph = [[1,2],[3],[3],[]], source = 0", output: "[0,1,2,3]", explanation: "All nodes are reachable from 0." },
    ],
    constraints: ["1 ≤ n ≤ 10⁴", "0 ≤ graph[i].length ≤ n"],
    solved: false,
    submissions: 201,
    acceptanceRate: 61.3,
    starterCode: {
      python: `from collections import deque\n\ndef bfs(graph, source):\n    # Write your solution here\n    pass`,
      cpp: `vector<int> bfs(vector<vector<int>>& graph, int source) {\n    // Write your solution here\n    return {};\n}`,
      javascript: `function bfs(graph, source) {\n    // Write your solution here\n}`,
    },
  },
]

router.get("/problems", (req, res) => {
  const { level, category, difficulty, search } = req.query

  let filtered = [...problems]

  if (level && level !== "All") {
    filtered = filtered.filter((p) => p.level.toString() === level)
  }
  if (category && category !== "All") {
    filtered = filtered.filter((p) => p.category === category)
  }
  if (difficulty && difficulty !== "All") {
    filtered = filtered.filter((p) => p.difficulty === difficulty)
  }
  if (search && typeof search === "string") {
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
    )
  }

  return res.json({ problems: filtered })
})

router.get("/problems/:id", (req, res) => {
  const id = parseInt(req.params.id)
  const problem = problems.find((p) => p.id === id)

  if (!problem) {
    return res.status(404).json({ error: "Problem not found" })
  }

  return res.json({ problem })
})

export default router
