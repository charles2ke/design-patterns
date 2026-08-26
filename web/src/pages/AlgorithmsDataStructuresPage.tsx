import { Header } from '../components/Header';

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
      </section>
      <section className="algorithms-page__section">
        <h2>Core algorithm concepts</h2>
        <ul>
          <li>An algorithm is a finite, well-defined sequence of steps that solves a problem.</li>
          <li>Correctness means an algorithm produces the right output for every valid input.</li>
          <li>Efficiency is measured in terms of time (how long it runs) and space (how much memory it uses).</li>
          <li>Many algorithms are built from a small set of strategies: divide and conquer, greedy choices, dynamic programming, and backtracking.</li>
        </ul>
      </section>
      <section className="algorithms-page__section">
        <h2>Common data structures</h2>
        <ul>
          <li>
            <strong>Arrays / Lists</strong> — contiguous, indexable storage with fast random access.
          </li>
          <li>
            <strong>Linked lists</strong> — nodes linked by pointers, with fast insertion/removal at known positions.
          </li>
          <li>
            <strong>Stacks and queues</strong> — restricted-access structures for LIFO and FIFO processing.
          </li>
          <li>
            <strong>Hash maps / sets</strong> — key-based lookup with average O(1) access.
          </li>
          <li>
            <strong>Trees</strong> — hierarchical structures such as binary search trees and heaps.
          </li>
          <li>
            <strong>Graphs</strong> — nodes connected by edges, used to model networks and relationships.
          </li>
        </ul>
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
      </section>
      <section className="algorithms-page__section">
        <h2>Searching</h2>
        <ul>
          <li>
            <strong>Linear search</strong> — checks each element in order, O(n), works on unsorted data.
          </li>
          <li>
            <strong>Binary search</strong> — repeatedly halves the search space, O(log n), requires sorted data.
          </li>
          <li>
            <strong>Hash-based lookup</strong> — average O(1) using a hash map or set.
          </li>
        </ul>
      </section>
      <section className="algorithms-page__section">
        <h2>Sorting</h2>
        <ul>
          <li>
            <strong>Bubble/insertion/selection sort</strong> — simple, O(n²), fine for small or nearly sorted inputs.
          </li>
          <li>
            <strong>Merge sort</strong> — stable, O(n log n), divide-and-conquer with predictable performance.
          </li>
          <li>
            <strong>Quicksort</strong> — average O(n log n), in-place, fast in practice but O(n²) worst case.
          </li>
          <li>Prefer a language or library's built-in sort unless a specific constraint (stability, memory, worst-case guarantees) requires a custom implementation.</li>
        </ul>
      </section>
      <section className="algorithms-page__section">
        <h2>Recursion</h2>
        <ul>
          <li>A recursive function solves a problem by calling itself on smaller subproblems.</li>
          <li>Every recursive solution needs at least one base case to stop the recursion.</li>
          <li>Recursion can be reformulated iteratively (often with an explicit stack) to avoid stack-depth limits.</li>
          <li>Memoization can turn an exponential recursive solution into a polynomial one by caching repeated subproblem results.</li>
        </ul>
      </section>
      <section className="algorithms-page__section">
        <h2>Graphs and trees</h2>
        <ul>
          <li>Trees are connected, acyclic graphs with a single root; binary search trees and heaps are common specializations.</li>
          <li>
            <strong>Depth-first search (DFS)</strong> — explores as far as possible along each branch before backtracking; useful for traversal and cycle detection.
          </li>
          <li>
            <strong>Breadth-first search (BFS)</strong> — explores neighbors level by level; useful for shortest paths in unweighted graphs.
          </li>
          <li>Weighted shortest-path problems commonly use algorithms such as Dijkstra&apos;s or A*.</li>
        </ul>
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
      </section>
    </main>
  );
}
