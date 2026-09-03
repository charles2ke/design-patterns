import { QuizGame, type QuizQuestion } from '../components/QuizGame';

const QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    prompt: 'What is the average time complexity of binary search on a sorted array?',
    options: [
      { id: 'a', label: 'O(log n)' },
      { id: 'b', label: 'O(n)' },
      { id: 'c', label: 'O(n log n)' },
      { id: 'd', label: 'O(1)' },
    ],
    hint: 'Every comparison halves the remaining search space.',
    correctOptionId: 'a',
  },
  {
    id: 2,
    prompt: 'Which data structure processes elements in last-in, first-out order?',
    options: [
      { id: 'a', label: 'Queue' },
      { id: 'b', label: 'Stack' },
      { id: 'c', label: 'Heap' },
      { id: 'd', label: 'Trie' },
    ],
    hint: 'Think of a pile of plates where you take the top one first.',
    correctOptionId: 'b',
  },
  {
    id: 3,
    prompt: 'What is the average time complexity of a hash table lookup?',
    options: [
      { id: 'a', label: 'O(n)' },
      { id: 'b', label: 'O(log n)' },
      { id: 'c', label: 'O(1)' },
      { id: 'd', label: 'O(n log n)' },
    ],
    hint: 'The key is hashed directly into a bucket index.',
    correctOptionId: 'c',
  },
  {
    id: 4,
    prompt: 'Which traversal visits a binary search tree nodes in sorted order?',
    options: [
      { id: 'a', label: 'In-order traversal' },
      { id: 'b', label: 'Pre-order traversal' },
      { id: 'c', label: 'Post-order traversal' },
      { id: 'd', label: 'Level-order traversal' },
    ],
    hint: 'Visit the left subtree, then the node, then the right subtree.',
    correctOptionId: 'a',
  },
  {
    id: 5,
    prompt: 'Which algorithm finds the shortest path from a source in a graph with non-negative weights?',
    options: [
      { id: 'a', label: 'Kruskal algorithm' },
      { id: 'b', label: 'Dijkstra algorithm' },
      { id: 'c', label: 'Depth-first search' },
      { id: 'd', label: 'Topological sort' },
    ],
    hint: 'It greedily expands the closest unvisited node using a priority queue.',
    correctOptionId: 'b',
  },
  {
    id: 6,
    prompt: 'What is the worst-case time complexity of quicksort?',
    options: [
      { id: 'a', label: 'O(n log n)' },
      { id: 'b', label: 'O(log n)' },
      { id: 'c', label: 'O(n squared)' },
      { id: 'd', label: 'O(n)' },
    ],
    hint: 'It degrades when every pivot splits the array as unevenly as possible.',
    correctOptionId: 'c',
  },
  {
    id: 7,
    prompt: 'Which traversal strategy does breadth-first search use on a graph?',
    options: [
      { id: 'a', label: 'A stack to dive deep first' },
      { id: 'b', label: 'A queue to explore level by level' },
      { id: 'c', label: 'A min-heap ordered by edge weight' },
      { id: 'd', label: 'Random restarts from unvisited nodes' },
    ],
    hint: 'Nodes are visited in order of increasing distance from the source.',
    correctOptionId: 'b',
  },
  {
    id: 8,
    prompt: 'Which data structure gives O(1) access to the smallest element?',
    options: [
      { id: 'a', label: 'Min-heap' },
      { id: 'b', label: 'Linked list' },
      { id: 'c', label: 'Hash set' },
      { id: 'd', label: 'Circular buffer' },
    ],
    hint: 'The smallest value is always kept at the root of the tree.',
    correctOptionId: 'a',
  },
  {
    id: 9,
    prompt: 'Which technique solves overlapping subproblems by caching their results?',
    options: [
      { id: 'a', label: 'Backtracking' },
      { id: 'b', label: 'Greedy selection' },
      { id: 'c', label: 'Dynamic programming' },
      { id: 'd', label: 'Divide and conquer' },
    ],
    hint: 'Memoization or bottom-up tables avoid recomputing the same state.',
    correctOptionId: 'c',
  },
  {
    id: 10,
    prompt: 'What is the space complexity of merge sort on an array of n elements?',
    options: [
      { id: 'a', label: 'O(1)' },
      { id: 'b', label: 'O(log n)' },
      { id: 'c', label: 'O(n log n)' },
      { id: 'd', label: 'O(n)' },
    ],
    hint: 'It needs an auxiliary buffer the size of the input to merge halves.',
    correctOptionId: 'd',
  },
  {
    id: 11,
    prompt: 'Which data structure is best for prefix search over a dictionary of words?',
    options: [
      { id: 'a', label: 'Trie' },
      { id: 'b', label: 'Bloom filter' },
      { id: 'c', label: 'Union-find' },
      { id: 'd', label: 'Adjacency matrix' },
    ],
    hint: 'Each node stores one character and shares common prefixes.',
    correctOptionId: 'a',
  },
  {
    id: 12,
    prompt: 'Which structure efficiently tracks connected components with union and find operations?',
    options: [
      { id: 'a', label: 'Segment tree' },
      { id: 'b', label: 'Disjoint set union' },
      { id: 'c', label: 'Doubly linked list' },
      { id: 'd', label: 'Skip list' },
    ],
    hint: 'Path compression and union by rank make it nearly constant time.',
    correctOptionId: 'b',
  },
  {
    id: 13,
    prompt: 'Which two-pointer technique detects a cycle in a linked list in O(1) extra space?',
    options: [
      { id: 'a', label: 'Binary lifting' },
      { id: 'b', label: 'Sliding window' },
      { id: 'c', label: 'Floyd tortoise and hare' },
      { id: 'd', label: 'Reservoir sampling' },
    ],
    hint: 'A slow pointer and a fast pointer eventually meet inside the cycle.',
    correctOptionId: 'c',
  },
  {
    id: 14,
    prompt: 'What ordering does a topological sort produce for a directed acyclic graph?',
    options: [
      { id: 'a', label: 'Nodes sorted by out-degree' },
      { id: 'b', label: 'Nodes sorted by label' },
      { id: 'c', label: 'Nodes sorted by shortest distance' },
      { id: 'd', label: 'Every node before all nodes it points to' },
    ],
    hint: 'Dependencies must appear before the tasks that need them.',
    correctOptionId: 'd',
  },
  {
    id: 15,
    prompt: 'What is the amortized cost of appending to a dynamic array that doubles its capacity?',
    options: [
      { id: 'a', label: 'O(1)' },
      { id: 'b', label: 'O(log n)' },
      { id: 'c', label: 'O(n)' },
      { id: 'd', label: 'O(n log n)' },
    ],
    hint: 'Expensive resizes are rare enough to spread across many cheap appends.',
    correctOptionId: 'a',
  },
];

export function AlgorithmsQuizPage() {
  return (
    <QuizGame
      title="Who Wants to Be an Algorithms Ace?"
      subtitle="A millionaire-style challenge about algorithms and data structures."
      ariaLabel="Algorithms and data structures quiz"
      cheer="Congratulations, Algorithms Ace!"
      questions={QUESTIONS}
    />
  );
}
