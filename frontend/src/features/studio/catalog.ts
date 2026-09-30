import type { Drill, Lesson, Pattern, Quiz, Track } from './types';

const prefixCode = `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, q;
    cin >> n >> q;
    vector<long long> pref(n + 1);
    for (int i = 1; i <= n; i++) {
        long long x; cin >> x;
        pref[i] = pref[i - 1] + x;
    }
    while (q--) {
        int l, r; cin >> l >> r;
        cout << pref[r] - pref[l - 1] << "\\n";
    }
}`;

const twoPtrCode = `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; long long s;
    cin >> n >> s;
    vector<long long> a(n);
    for (auto &x : a) cin >> x;
    int L = 0;
    long long sum = 0, best = n + 1;
    for (int R = 0; R < n; R++) {
        sum += a[R];
        while (L <= R && sum - a[L] >= s) sum -= a[L++];
        if (sum >= s) best = min(best, (long long)R - L + 1);
    }
    cout << (best > n ? -1 : best) << "\\n";
}`;

const bfsCode = `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<vector<int>> g(n);
    while (m--) {
        int u, v; cin >> u >> v;
        u--; v--;
        g[u].push_back(v);
        g[v].push_back(u);
    }
    vector<int> dist(n, -1);
    queue<int> q;
    dist[0] = 0;
    q.push(0);
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : g[u]) if (dist[v] < 0) {
            dist[v] = dist[u] + 1;
            q.push(v);
        }
    }
    for (int x : dist) cout << x << "\\n";
}`;

export const TRACKS: Track[] = [
  { id: 'fundamentals', title: 'Fundamentals', blurb: 'Scans and windows. Most rounds start here.', order: 1 },
  { id: 'search-sort', title: 'Search and sort', blurb: 'Binary search and the orders you actually compare.', order: 2 },
  { id: 'graphs', title: 'Graphs', blurb: 'Traversal and weighted distances.', order: 3 },
  { id: 'dp', title: 'Dynamic programming', blurb: 'A few shapes that show up every season.', order: 4 },
];

export const PATTERNS: Pattern[] = [
  {
    id: 'pattern-prefix-sums', title: 'Prefix sums', trackId: 'fundamentals',
    idea: 'Range sum is a subtraction of two prefixes.',
    when: 'Many range sums, no updates.',
    complexity: 'O(n) build, O(1) query',
    signals: ['sum of [l, r]', 'subarray sum equals k'],
  },
  {
    id: 'pattern-two-pointers', title: 'Two pointers', trackId: 'fundamentals',
    idea: 'Both ends only move forward.',
    when: 'The array is sorted, or the window condition is monotone.',
    complexity: 'O(n)',
    signals: ['pair with a target sum', 'shortest window'],
  },
  {
    id: 'pattern-binary-search', title: 'Binary search', trackId: 'search-sort',
    idea: 'Throw away the half that cannot hold the answer.',
    when: 'A predicate flips from false to true.',
    complexity: 'O(log n) after sorting',
    signals: ['first position where', 'minimum feasible'],
  },
  {
    id: 'pattern-bfs', title: 'BFS', trackId: 'graphs',
    idea: 'A queue gives fewest edges, not DFS.',
    when: 'Every edge weighs the same.',
    complexity: 'O(n + m)',
    signals: ['minimum steps', 'unweighted'],
  },
];

export const LESSONS: Lesson[] = [
  {
    id: 'prefix-sums-intuition',
    trackId: 'fundamentals',
    moduleId: 'fundamentals-core',
    title: 'Prefix sums',
    difficulty: 'intro',
    minutes: 20,
    summary: 'Build a running total once. A range sum is then one subtraction.',
    objectives: [
      'Write pref[i] as the sum of the first i elements.',
      'Answer [l, r] as pref[r] - pref[l-1].',
      'Know why this dies if the array also receives updates.',
    ],
    tags: ['prefix-sums', 'arrays'],
    prereqs: [],
    sections: [
      {
        heading: 'The move',
        body: 'If you only ever add up a slice of an array, do not walk that slice again for every query.\n\npref[0] = 0\npref[i] = pref[i-1] + a[i]   (1-based a)\n\nsum from l to r, inclusive, is pref[r] - pref[l-1].\nThe left term includes a[l]. Subtracting pref[l] would drop a[l]. That is the usual off-by-one.',
        code: prefixCode,
        language: 'C++',
      },
      {
        heading: 'When not to use it',
        body: 'A point update invalidates every prefix to the right. Rebuilding is fine once. It is not fine for 1e5 updates — that is a Fenwick tree or a segment tree.\n\nNegative numbers are fine. Use a 64-bit accumulator unless the statement promises otherwise.',
      },
    ],
    pitfalls: [
      '1-based queries against a prefix that forgot pref[0].',
      'pref[r] - pref[l] drops a[l].',
      'int overflow. The sample is small; the hidden tests are not.',
    ],
    checks: [
      { id: 'query-cost', prompt: 'Cost of one query after the build?', choices: ['O(1)', 'O(n)', 'O(log n)'], accept: ['O(1)'], explain: 'Two array reads.' },
      { id: 'formula', prompt: 'Sum of the inclusive range [l, r]?', choices: ['pref[r] - pref[l-1]', 'pref[r] - pref[l]', 'pref[l] - pref[r]'], accept: ['pref[r] - pref[l-1]'], explain: 'pref[l-1] stops just before l.' },
    ],
  },
  {
    id: 'prefix-sums-implementation',
    trackId: 'fundamentals',
    moduleId: 'fundamentals-core',
    title: 'Prefix sums, typed out',
    difficulty: 'core',
    minutes: 25,
    summary: 'Read the array into the prefix, then answer queries. Do not mix the two loops.',
    objectives: ['Finish the prefix before the first query.', 'Keep input indexes and storage indexes consistent.'],
    tags: ['prefix-sums'],
    prereqs: ['prefix-sums-intuition'],
    sections: [
      {
        heading: 'Order of work',
        body: 'Build, check the prefix on the sample, then answer queries.\n\nFor 1 2 3 4 5 the prefix is 0 1 3 6 10 15. Query 2 4 is 10 - 1 = 9.',
        code: prefixCode,
        language: 'C++',
      },
    ],
    pitfalls: ['Query loop that also appends to the array.', 'Forgetting to read q.'],
    checks: [
      { id: 'build-cost', prompt: 'Build cost?', choices: ['O(n)', 'O(1)', 'O(nq)'], accept: ['O(n)'], explain: 'One addition per element.' },
    ],
  },
  {
    id: 'two-pointers-intuition',
    trackId: 'fundamentals',
    moduleId: 'fundamentals-core',
    title: 'Two pointers',
    difficulty: 'intro',
    minutes: 25,
    summary: 'If the condition only gets harder as the window grows, the left edge never moves backward.',
    objectives: ['Say why the left pointer is monotone.', 'Tell this apart from a deque window.'],
    tags: ['two-pointers'],
    prereqs: [],
    sections: [
      {
        heading: 'Sorted pair, or a growing window',
        body: 'On a sorted array, a pair that should sum to s: too small means L++, too big means R--. Each step throws an index away for good.\n\nOn a window of positive numbers, advance R and pull L forward while the predicate still holds. If values can be negative, dropping the left element might be wrong.',
        code: twoPtrCode,
        language: 'C++',
      },
    ],
    pitfalls: ['Moving L backward.', 'A non-monotone condition.', 'Length off by one (R - L vs R - L + 1).'],
    checks: [
      { id: 'when', prompt: 'Two pointers need which property?', choices: ['the decision only moves one way', 'the array is a tree', 'weights can be negative'], accept: ['the decision only moves one way'], explain: 'If the left edge has to come back, the argument is gone.' },
    ],
  },
  {
    id: 'sliding-window-intuition',
    trackId: 'fundamentals',
    moduleId: 'fundamentals-core',
    title: 'Sliding window minimum',
    difficulty: 'core',
    minutes: 30,
    summary: 'A deque of candidate indexes, kept in order, so each window min sits at the front.',
    objectives: ['Pop indexes that fell out of the window.', 'Pop worse indexes from the back before pushing.'],
    tags: ['sliding-window', 'deque'],
    prereqs: ['two-pointers-intuition'],
    sections: [
      {
        heading: 'Why a deque',
        body: 'Two pointers shrink a window when the condition is monotone. The min of a fixed-length window is not that.\n\nStore indexes. Drop the front when it is more than k behind i. Drop the back while it is worse than a[i]. Push i. When the window is full, a[dq.front()] is the answer.\n\nEach index is pushed once and popped once.',
      },
    ],
    pitfalls: ['Storing values, then not knowing if they are still in the window.', 'Strict vs non-strict pop on duplicates.'],
    checks: [
      { id: 'store', prompt: 'What do you store in the deque?', choices: ['indexes', 'only the current minimum', 'prefix sums'], accept: ['indexes'], explain: 'You need the position to know when it leaves the window.' },
    ],
  },
  {
    id: 'binary-search-intuition',
    trackId: 'search-sort',
    moduleId: 'search-core',
    title: 'Binary search',
    difficulty: 'intro',
    minutes: 25,
    summary: 'Half-open range. Keep the first index where the predicate becomes true.',
    objectives: ['Write the loop so it terminates.', 'Search the answer when a check is easier than a construction.'],
    tags: ['binary-search'],
    prereqs: [],
    sections: [
      {
        heading: 'Half-open',
        body: 'L = 0, R = n.\n\nwhile L < R:\n    mid = (L + R) / 2\n    if a[mid] < x: L = mid + 1\n    else: R = mid\n\nL is the first index with a[L] >= x, or n. An infinite loop usually means L = mid on an integer range.\n\nSearching the answer is the same loop with ok(mid). ok has to be monotone.',
      },
    ],
    pitfalls: ['L = mid instead of L = mid + 1.', 'Searching an unsorted array.', 'A check that is not monotone.'],
    checks: [
      { id: 'loop', prompt: 'Which update avoids the infinite loop on integers?', choices: ['L = mid + 1', 'L = mid', 'R = mid + 1 always'], accept: ['L = mid + 1'], explain: 'mid can equal L. L = mid then repeats.' },
    ],
  },
  {
    id: 'bfs-intuition',
    trackId: 'graphs',
    moduleId: 'graphs-core',
    title: 'Breadth-first search',
    difficulty: 'intro',
    minutes: 25,
    summary: 'On weight-1 edges the first time you reach a node is the shortest time.',
    objectives: ['Enqueue a node once, when dist is set.', 'Do not use this for arbitrary weights.'],
    tags: ['bfs', 'graphs'],
    prereqs: [],
    sections: [
      {
        heading: 'Queue, not a stack',
        body: 'dist[source] = 0. Push the source. When you pop u, every unseen neighbor gets dist[u] + 1 and is pushed.\n\nDFS is not fewest-edges. A heap is Dijkstra. 0-1 BFS is a deque: front for weight 0, back for weight 1.',
        code: bfsCode,
        language: 'C++',
      },
    ],
    pitfalls: ['Pushing a node every time you see it.', 'Leaving 1-based input unadjusted.', 'Calling a DFS distance shortest.'],
    checks: [
      { id: 'when', prompt: 'BFS distances are shortest when?', choices: ['every edge has weight 1', 'weights can be negative', 'the graph is directed only'], accept: ['every edge has weight 1'], explain: 'The plain queue assumes each edge costs one step.' },
    ],
  },
  {
    id: 'knapsack-intuition',
    trackId: 'dp',
    moduleId: 'dp-core',
    title: '0/1 knapsack',
    difficulty: 'core',
    minutes: 30,
    summary: 'One array, capacity loop running downward, so each item is used at most once.',
    objectives: ['Explain why the capacity loop goes downward.', 'Know that upward is the unbounded problem.'],
    tags: ['knapsack', 'dp'],
    prereqs: [],
    sections: [
      {
        heading: 'One row',
        body: 'dp[c] is the best value with capacity c so far.\n\nFor weight w and value v, walk c from W down to w:\n    dp[c] = max(dp[c], dp[c - w] + v)\n\nDownward keeps dp[c - w] on the previous item. Upward lets the same item fill the bag again.\n\nn * W around 1e7 is the usual cutoff. Past that the state is wrong, not the language.',
      },
    ],
    pitfalls: ['Looping capacity upward on a 0/1 item.', 'Starting from c = w - 1.', 'Values that overflow 32-bit int.'],
    checks: [
      { id: 'dir', prompt: '0/1 knapsack walks capacity in which direction?', choices: ['downward', 'upward', 'either'], accept: ['downward'], explain: 'Upward reuses the item you just placed.' },
    ],
  },
];

export const DRILLS: Drill[] = [
  {
    id: 'prefix-sums-drill-implement',
    trackId: 'fundamentals',
    topicId: 'prefix-sums',
    title: 'Range sum',
    difficulty: 'core',
    minutes: 25,
    statement: 'Given n and q, then n integers, then q pairs (l, r) with 1-based inclusive bounds, print each range sum.\n\nn and q are up to 1e5. Do not rescan the array per query.',
    inputFmt: 'n q\na1..an\nl r  (q times)',
    outputFmt: 'q lines, one sum each',
    sampleIn: '5 2\n1 2 3 4 5\n1 5\n2 4',
    sampleOut: '15\n9',
    hint: 'pref[i] = a[1] + ... + a[i], pref[0] = 0. Answer is pref[r] - pref[l-1].',
    solution: prefixCode,
    language: 'C++',
    tags: ['prefix-sums', 'arrays'],
    answer: '15',
  },
  {
    id: 'prefix-sums-drill-edge',
    trackId: 'fundamentals',
    topicId: 'prefix-sums',
    title: 'Empty and single ranges',
    difficulty: 'intro',
    minutes: 15,
    statement: 'Same range-sum problem. Check a single element, including a negative one, before you submit.',
    inputFmt: 'n q\na1..an\nl r',
    outputFmt: 'one sum per query',
    sampleIn: '1 1\n-4\n1 1',
    sampleOut: '-4',
    hint: 'pref[1] - pref[0] is just a[1]. Use long long.',
    solution: prefixCode,
    language: 'C++',
    tags: ['prefix-sums'],
    answer: '-4',
  },
  {
    id: 'two-pointers-drill',
    trackId: 'fundamentals',
    topicId: 'two-pointers',
    title: 'Shortest window with sum at least s',
    difficulty: 'core',
    minutes: 30,
    statement: 'n positive integers and a target s. Print the length of the shortest subarray whose sum is at least s, or -1.',
    inputFmt: 'n s\na1..an',
    outputFmt: 'one integer',
    sampleIn: '6 7\n2 3 1 2 4 3',
    sampleOut: '2',
    hint: 'Move R. While the window still meets s after dropping a[L], drop it.',
    solution: twoPtrCode,
    language: 'C++',
    tags: ['two-pointers'],
    answer: '2',
  },
  {
    id: 'bfs-drill',
    trackId: 'graphs',
    topicId: 'bfs',
    title: 'Unweighted distance',
    difficulty: 'core',
    minutes: 25,
    statement: 'Undirected graph. Print the distance from node 1 to every node, or -1. Each edge weighs 1.',
    inputFmt: 'n m\nthen m edges',
    outputFmt: 'n lines',
    sampleIn: '3 2\n1 2\n2 3',
    sampleOut: '0\n1\n2',
    hint: 'Set dist when you first discover a node.',
    solution: bfsCode,
    language: 'C++',
    tags: ['bfs', 'graphs'],
    answer: '0',
  },
];

export const QUIZZES: Quiz[] = [
  {
    id: 'prefix-sums-quiz',
    trackId: 'fundamentals',
    topicId: 'prefix-sums',
    title: 'Prefix sums',
    minutes: 8,
    questions: [
      { id: 'query-cost', prompt: 'After the prefix array exists, what is one range-sum query?', choices: ['O(1)', 'O(n)', 'O(n log n)', 'O(n^2)'], accept: ['O(1)'], explain: 'pref[r] - pref[l-1] is two lookups.' },
      { id: 'build-cost', prompt: 'What do you pay to build the prefix array?', choices: ['O(n)', 'O(1)', 'O(n log n)', 'O(q)'], accept: ['O(n)'], explain: 'One pass. Queries come after.' },
      { id: 'index', prompt: '1-based inclusive l and r. Which subtraction is the sum?', choices: ['pref[r] - pref[l-1]', 'pref[r] - pref[l]', 'pref[l] - pref[r]', 'pref[r] + pref[l]'], accept: ['pref[r] - pref[l-1]'], explain: 'pref[l-1] is everything strictly before the range.' },
    ],
  },
  {
    id: 'bfs-quiz',
    trackId: 'graphs',
    topicId: 'bfs',
    title: 'BFS',
    minutes: 6,
    questions: [
      { id: 'when', prompt: 'When is BFS the shortest path?', choices: ['every edge has weight 1', 'edge weights can be negative', 'the graph is a DAG only', 'you need a heap'], accept: ['every edge has weight 1'], explain: 'Other weights need Dijkstra. Negative weights need Bellman-Ford.' },
      { id: 'enqueue', prompt: 'When do you set dist[v]?', choices: ['the first time you see v', 'every time you see v', 'only at the source', 'after the queue is empty'], accept: ['the first time you see v'], explain: 'Later visits cannot be shorter on an unweighted graph.' },
    ],
  },
];
