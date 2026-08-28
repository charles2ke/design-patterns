import { Header } from '../components/Header';

interface ExampleProps {
  label: string;
  code: string;
}

function Example({ label, code }: ExampleProps) {
  return (
    <figure className="algorithms-page__example">
      <figcaption className="algorithms-page__example-label">{label}</figcaption>
      <pre>
        <code>{code}</code>
      </pre>
    </figure>
  );
}

export function AlgorithmsDataStructuresPage() {
  return (
    <main className="algorithms-page">
      <Header
        title="Algorithms and Data Structures"
        subtitle="Foundational concepts every engineer should know when reasoning about correctness and performance."
      />
      <section className="algorithms-page__section">
        <h2>Overview</h2>
        <p>
          Algorithms and data structures are the building blocks used to organize data and
          describe step-by-step solutions to problems. Choosing the right data structure and
          algorithm for a task directly affects how well a program scales, how easy it is to
          maintain, and how efficiently it uses memory and CPU time.
        </p>
        <p>
          Every concept below includes a short JavaScript example so you can see the idea in
          working code, not just in prose.
        </p>
      </section>
      <section className="algorithms-page__section">
        <h2>Core algorithm concepts</h2>
        <ul>
          <li>An algorithm is a finite, well-defined sequence of steps that solves a problem.</li>
          <li>Correctness means an algorithm produces the right output for every valid input.</li>
          <li>Efficiency is measured in terms of time (how long it runs) and space (how much memory it uses).</li>
          <li>Many algorithms are built from a small set of strategies: divide and conquer, greedy choices, dynamic programming, and backtracking.</li>
        </ul>
        <Example
          label="Example: greedy coin change"
          code={`function coinChange(amount, coins = [25, 10, 5, 1]) {
  const used = [];
  for (const coin of coins) {
    while (amount >= coin) {
      amount -= coin;
      used.push(coin);
    }
  }
  return used;
}

coinChange(41); // [25, 10, 5, 1]`}
        />
        <Example
          label="Example: dynamic programming (fibonacci)"
          code={`function fib(n) {
  const table = [0, 1];
  for (let i = 2; i <= n; i += 1) {
    table[i] = table[i - 1] + table[i - 2];
  }
  return table[n];
}

fib(10); // 55`}
        />
      </section>
      <section className="algorithms-page__section">
        <h2>Common data structures</h2>
        <ul>
          <li>
            <strong>Arrays / Lists</strong> — contiguous, indexable storage with fast random access.
          </li>
        </ul>
        <Example
          label="Example: array"
          code={`const scores = [10, 20, 30];
scores[1];          // 20 - O(1) random access
scores.push(40);    // amortized O(1) append
scores.unshift(5);  // O(n) - every element shifts`}
        />
        <ul>
          <li>
            <strong>Linked lists</strong> — nodes linked by pointers, with fast insertion/removal at known positions.
          </li>
        </ul>
        <Example
          label="Example: singly linked list"
          code={`class ListNode {
  constructor(value, next = null) {
    this.value = value;
    this.next = next;
  }
}

// 1 -> 2 -> 3
const head = new ListNode(1, new ListNode(2, new ListNode(3)));

// Insert 99 after the head in O(1).
head.next = new ListNode(99, head.next);`}
        />
        <ul>
          <li>
            <strong>Stacks and queues</strong> — restricted-access structures for LIFO and FIFO processing.
          </li>
        </ul>
        <Example
          label="Example: stack (LIFO) and queue (FIFO)"
          code={`const stack = [];
stack.push('a');
stack.push('b');
stack.pop();   // 'b' - last in, first out

const queue = [];
queue.push('a');
queue.push('b');
queue.shift(); // 'a' - first in, first out`}
        />
        <ul>
          <li>
            <strong>Hash maps / sets</strong> — key-based lookup with average O(1) access.
          </li>
        </ul>
        <Example
          label="Example: map and set"
          code={`const ages = new Map();
ages.set('ada', 36);
ages.get('ada'); // 36 - average O(1)

const seen = new Set([1, 2, 2, 3]);
seen.has(2);  // true
seen.size;    // 3 - duplicates collapse`}
        />
        <ul>
          <li>
            <strong>Trees</strong> — hierarchical structures such as binary search trees and heaps.
          </li>
        </ul>
        <Example
          label="Example: binary search tree insert"
          code={`function insert(node, value) {
  if (node === null) return { value, left: null, right: null };
  if (value < node.value) node.left = insert(node.left, value);
  else if (value > node.value) node.right = insert(node.right, value);
  return node;
}

let root = null;
for (const value of [8, 3, 10]) root = insert(root, value);`}
        />
        <ul>
          <li>
            <strong>Graphs</strong> — nodes connected by edges, used to model networks and relationships.
          </li>
        </ul>
        <Example
          label="Example: graph as an adjacency list"
          code={`const graph = {
  a: ['b', 'c'],
  b: ['d'],
  c: ['d'],
  d: [],
};

graph.a; // ['b', 'c'] - neighbours of "a"`}
        />
      </section>
      <section className="algorithms-page__section">
        <h2>Algorithmic complexity (Big O)</h2>
        <p>
          Big O notation describes how the running time or memory usage of an algorithm grows
          as the input size increases. It focuses on the dominant term and ignores constant
          factors, making it useful for comparing algorithms at scale.
        </p>
        <ul>
          <li><code>O(1)</code> — constant time, independent of input size (e.g. hash map lookup).</li>
          <li><code>O(log n)</code> — logarithmic time (e.g. binary search).</li>
          <li><code>O(n)</code> — linear time (e.g. scanning a list once).</li>
          <li><code>O(n log n)</code> — typical of efficient sorting algorithms.</li>
          <li><code>O(n²)</code> — quadratic time, common in naive nested-loop algorithms.</li>
        </ul>
        <Example
          label="Example: comparing growth rates"
          code={`const first = (items) => items[0];                  // O(1)
const sum = (items) => items.reduce((a, b) => a + b); // O(n)
const sorted = (items) => [...items].sort();          // O(n log n)

function hasDuplicatePair(items) {                    // O(n^2)
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      if (items[i] === items[j]) return true;
    }
  }
  return false;
}`}
        />
      </section>
      <section className="algorithms-page__section">
        <h2>Searching</h2>
        <ul>
          <li>
            <strong>Linear search</strong> — checks each element in order, O(n), works on unsorted data.
          </li>
        </ul>
        <Example
          label="Example: linear search"
          code={`function linearSearch(items, target) {
  for (let i = 0; i < items.length; i += 1) {
    if (items[i] === target) return i;
  }
  return -1;
}

linearSearch([4, 9, 1], 9); // 1`}
        />
        <ul>
          <li>
            <strong>Binary search</strong> — repeatedly halves the search space, O(log n), requires sorted data.
          </li>
        </ul>
        <Example
          label="Example: binary search"
          code={`function binarySearch(sorted, target) {
  let low = 0;
  let high = sorted.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (sorted[mid] === target) return mid;
    if (sorted[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}

binarySearch([1, 3, 5, 7, 9], 7); // 3`}
        />
        <ul>
          <li>
            <strong>Hash-based lookup</strong> — average O(1) using a hash map or set.
          </li>
        </ul>
        <Example
          label="Example: hash-based lookup"
          code={`const usersById = new Map([
  [1, { name: 'ada' }],
  [2, { name: 'grace' }],
]);

usersById.get(2); // { name: 'grace' } - average O(1)`}
        />
      </section>
      <section className="algorithms-page__section">
        <h2>Sorting</h2>
        <ul>
          <li>
            <strong>Bubble/insertion/selection sort</strong> — simple, O(n²), fine for small or nearly sorted inputs.
          </li>
        </ul>
        <Example
          label="Example: insertion sort"
          code={`function insertionSort(items) {
  const result = [...items];
  for (let i = 1; i < result.length; i += 1) {
    const current = result[i];
    let j = i - 1;
    while (j >= 0 && result[j] > current) {
      result[j + 1] = result[j];
      j -= 1;
    }
    result[j + 1] = current;
  }
  return result;
}

insertionSort([3, 1, 2]); // [1, 2, 3]`}
        />
        <ul>
          <li>
            <strong>Merge sort</strong> — stable, O(n log n), divide-and-conquer with predictable performance.
          </li>
        </ul>
        <Example
          label="Example: merge sort"
          code={`function mergeSort(items) {
  if (items.length <= 1) return items;
  const mid = Math.floor(items.length / 2);
  return merge(mergeSort(items.slice(0, mid)), mergeSort(items.slice(mid)));
}

function merge(left, right) {
  const merged = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    merged.push(left[i] <= right[j] ? left[i++] : right[j++]);
  }
  return [...merged, ...left.slice(i), ...right.slice(j)];
}

mergeSort([5, 2, 4, 1]); // [1, 2, 4, 5]`}
        />
        <ul>
          <li>
            <strong>Quicksort</strong> — average O(n log n), in-place, fast in practice but O(n²) worst case.
          </li>
        </ul>
        <Example
          label="Example: quicksort"
          code={`function quickSort(items) {
  if (items.length <= 1) return items;
  const [pivot, ...rest] = items;
  const smaller = rest.filter((item) => item < pivot);
  const larger = rest.filter((item) => item >= pivot);
  return [...quickSort(smaller), pivot, ...quickSort(larger)];
}

quickSort([5, 3, 8, 1]); // [1, 3, 5, 8]`}
        />
        <ul>
          <li>Prefer a language or library&apos;s built-in sort unless a specific constraint (stability, memory, worst-case guarantees) requires a custom implementation.</li>
        </ul>
        <Example
          label="Example: built-in sort with a comparator"
          code={`const numbers = [10, 9, 100];
[...numbers].sort();                  // [10, 100, 9] - string comparison!
[...numbers].sort((a, b) => a - b);   // [9, 10, 100]`}
        />
      </section>
      <section className="algorithms-page__section">
        <h2>Recursion</h2>
        <ul>
          <li>A recursive function solves a problem by calling itself on smaller subproblems.</li>
          <li>Every recursive solution needs at least one base case to stop the recursion.</li>
        </ul>
        <Example
          label="Example: recursion with a base case"
          code={`function factorial(n) {
  if (n <= 1) return 1; // base case
  return n * factorial(n - 1);
}

factorial(5); // 120`}
        />
        <ul>
          <li>Recursion can be reformulated iteratively (often with an explicit stack) to avoid stack-depth limits.</li>
        </ul>
        <Example
          label="Example: iterative version with an explicit stack"
          code={`function sumTree(root) {
  const stack = [root];
  let total = 0;
  while (stack.length) {
    const node = stack.pop();
    if (!node) continue;
    total += node.value;
    stack.push(node.left, node.right);
  }
  return total;
}`}
        />
        <ul>
          <li>Memoization can turn an exponential recursive solution into a polynomial one by caching repeated subproblem results.</li>
        </ul>
        <Example
          label="Example: memoized recursion"
          code={`function fib(n, memo = new Map()) {
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n);
  const result = fib(n - 1, memo) + fib(n - 2, memo);
  memo.set(n, result);
  return result;
}

fib(50); // 12586269025 - instant with memoization`}
        />
      </section>
      <section className="algorithms-page__section">
        <h2>Graphs and trees</h2>
        <ul>
          <li>Trees are connected, acyclic graphs with a single root; binary search trees and heaps are common specializations.</li>
          <li>
            <strong>Depth-first search (DFS)</strong> — explores as far as possible along each branch before backtracking; useful for traversal and cycle detection.
          </li>
        </ul>
        <Example
          label="Example: depth-first search"
          code={`function dfs(graph, start, visited = new Set()) {
  if (visited.has(start)) return visited;
  visited.add(start);
  for (const neighbour of graph[start] ?? []) {
    dfs(graph, neighbour, visited);
  }
  return visited;
}

dfs({ a: ['b'], b: ['c'], c: [] }, 'a'); // Set { 'a', 'b', 'c' }`}
        />
        <ul>
          <li>
            <strong>Breadth-first search (BFS)</strong> — explores neighbors level by level; useful for shortest paths in unweighted graphs.
          </li>
        </ul>
        <Example
          label="Example: breadth-first search"
          code={`function bfs(graph, start) {
  const visited = new Set([start]);
  const queue = [start];
  let head = 0;
  const order = [];
  while (head < queue.length) {
    const node = queue[head++];
    order.push(node);
    for (const neighbour of graph[node] ?? []) {
      if (visited.has(neighbour)) continue;
      visited.add(neighbour);
      queue.push(neighbour);
    }
  }
  return order;
}

bfs({ a: ['b', 'c'], b: ['d'], c: ['d'], d: [] }, 'a'); // ['a', 'b', 'c', 'd']`}
        />
        <ul>
          <li>Weighted shortest-path problems commonly use algorithms such as Dijkstra&apos;s or A*.</li>
        </ul>
        <Example
          label="Example: Dijkstra's shortest distances"
          code={`function dijkstra(graph, start) {
  const distances = new Map([[start, 0]]);
  const queue = [[start, 0]];
  while (queue.length) {
    queue.sort((a, b) => a[1] - b[1]);
    const [node, distance] = queue.shift();
    if (distance > (distances.get(node) ?? Infinity)) continue;
    for (const [neighbour, weight] of graph[node] ?? []) {
      const next = distance + weight;
      if (next < (distances.get(neighbour) ?? Infinity)) {
        distances.set(neighbour, next);
        queue.push([neighbour, next]);
      }
    }
  }
  return distances;
}`}
        />
      </section>
      <section className="algorithms-page__section">
        <h2>Practical guidance</h2>
        <ul>
          <li>Start with the simplest correct solution, then optimize only where profiling shows it matters.</li>
          <li>Match the data structure to the operations you perform most: frequent lookups favor hash maps, ordered iteration favors trees, and LIFO/FIFO processing favors stacks and queues.</li>
          <li>Reason about Big O for both time and space before committing to an approach, especially for inputs that can grow large.</li>
          <li>Use existing standard library implementations of common algorithms and data structures rather than reimplementing them, unless there is a concrete need.</li>
          <li>Write tests around edge cases: empty input, single element, duplicates, and already-sorted or reverse-sorted data.</li>
        </ul>
        <Example
          label="Example: choosing a structure and testing edge cases"
          code={`// O(n^2) with nested scans; O(n) with a Set.
const hasDuplicates = (items) => new Set(items).size !== items.length;

hasDuplicates([]);        // false - empty input
hasDuplicates([1]);       // false - single element
hasDuplicates([1, 1, 2]); // true  - duplicates`}
        />
      </section>
    </main>
  );
}
