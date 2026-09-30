package studio

// Lessons, drills, and quizzes shipped with the binary.
// Progress is not in here — that lives on the service, per user.

func init() {
	registerTrack(Track{ID: "fundamentals", Title: "Fundamentals", Blurb: "Scans and windows. Most rounds start here.", Order: 1})
	registerTrack(Track{ID: "search-sort", Title: "Search and sort", Blurb: "Binary search and the orders you actually compare.", Order: 2})
	registerTrack(Track{ID: "graphs", Title: "Graphs", Blurb: "Traversal and weighted distances.", Order: 3})
	registerTrack(Track{ID: "dp", Title: "Dynamic programming", Blurb: "A few shapes that show up every season.", Order: 4})

	registerPattern(Pattern{
		ID: "pattern-prefix-sums", Title: "Prefix sums", TrackID: "fundamentals",
		Idea:       "Range sum is a subtraction of two prefixes.",
		When:       "Many range sums, no updates.",
		Complexity: "O(n) build, O(1) query",
		Signals:    []string{"sum of [l, r]", "subarray sum equals k"},
	})
	registerPattern(Pattern{
		ID: "pattern-two-pointers", Title: "Two pointers", TrackID: "fundamentals",
		Idea:       "Both ends only move forward.",
		When:       "The array is sorted, or the window condition is monotone.",
		Complexity: "O(n)",
		Signals:    []string{"pair with a target sum", "shortest window"},
	})
	registerPattern(Pattern{
		ID: "pattern-binary-search", Title: "Binary search", TrackID: "search-sort",
		Idea:       "Throw away the half that cannot hold the answer.",
		When:       "A predicate flips from false to true.",
		Complexity: "O(log n) after sorting",
		Signals:    []string{"first position where", "minimum feasible"},
	})
	registerPattern(Pattern{
		ID: "pattern-bfs", Title: "BFS", TrackID: "graphs",
		Idea:       "A queue gives fewest edges, not DFS.",
		When:       "Every edge weighs the same.",
		Complexity: "O(n + m)",
		Signals:    []string{"minimum steps", "unweighted"},
	})

	registerLesson(prefixIntuition())
	registerLesson(prefixImpl())
	registerLesson(twoPointers())
	registerLesson(windowMin())
	registerLesson(binarySearch())
	registerLesson(bfsLesson())
	registerLesson(knapsack())

	registerDrill(Drill{
		ID: "prefix-sums-drill-implement", TrackID: "fundamentals", TopicID: "prefix-sums",
		Title: "Range sum", Difficulty: DiffCore, Minutes: 25,
		Statement: "Given n and q, then n integers, then q pairs (l, r) using 1-based inclusive bounds, print the sum of each range.\n\nn and q are up to 1e5. Do not rescan the array per query.",
		InputFmt:  "n q\na1..an\nl r  (q times)",
		OutputFmt: "q lines, one sum each",
		SampleIn:  "5 2\n1 2 3 4 5\n1 5\n2 4",
		SampleOut: "15\n9",
		Hint:      "pref[i] = a[1] + ... + a[i], pref[0] = 0. Answer is pref[r] - pref[l-1].",
		Solution:  prefixCode,
		Language:  "C++",
		Tags:      []string{"prefix-sums", "arrays"},
		Answer:    "15",
	})
	registerDrill(Drill{
		ID: "prefix-sums-drill-edge", TrackID: "fundamentals", TopicID: "prefix-sums",
		Title: "Empty and single ranges", Difficulty: DiffIntro, Minutes: 15,
		Statement: "Same problem as range sum. Add tests for a single element and for l == r before you submit.\nValues can be negative. The sum type has to hold that.",
		InputFmt:  "n q\na1..an\nl r",
		OutputFmt: "one sum per query",
		SampleIn:  "1 1\n-4\n1 1",
		SampleOut: "-4",
		Hint:      "pref[1] - pref[0] is just a[1]. Use long long.",
		Solution:  prefixCode,
		Language:  "C++",
		Tags:      []string{"prefix-sums"},
		Answer:    "-4",
	})
	registerDrill(Drill{
		ID: "two-pointers-drill", TrackID: "fundamentals", TopicID: "two-pointers",
		Title: "Shortest window with sum at least s", Difficulty: DiffCore, Minutes: 30,
		Statement: "n positive integers and a target s. Print the length of the shortest contiguous subarray whose sum is at least s, or -1 if none exists.",
		InputFmt:  "n s\na1..an",
		OutputFmt: "one integer",
		SampleIn:  "6 7\n2 3 1 2 4 3",
		SampleOut: "2",
		Hint:      "Move R. While the window still meets s after dropping a[L], drop it. L never goes backwards.",
		Solution:  twoPtrCode,
		Language:  "C++",
		Tags:      []string{"two-pointers"},
		Answer:    "2",
	})
	registerDrill(Drill{
		ID: "bfs-drill", TrackID: "graphs", TopicID: "bfs",
		Title: "Unweighted distance", Difficulty: DiffCore, Minutes: 25,
		Statement: "Undirected graph, n nodes, m edges. Print the distance from node 1 to every node, or -1 if unreachable. Edges weigh 1.",
		InputFmt:  "n m\nthen m edges",
		OutputFmt: "n lines",
		SampleIn:  "3 2\n1 2\n2 3",
		SampleOut: "0\n1\n2",
		Hint:      "Queue. Set dist when you first discover a node, not when you pop it a second time.",
		Solution:  bfsCode,
		Language:  "C++",
		Tags:      []string{"bfs", "graphs"},
		Answer:    "0",
	})

	registerQuiz(Quiz{
		ID: "prefix-sums-quiz", TrackID: "fundamentals", TopicID: "prefix-sums",
		Title: "Prefix sums", Minutes: 8,
		Questions: []Check{
			{
				ID:      "query-cost",
				Prompt:  "After the prefix array exists, what is one range-sum query?",
				Choices: []string{"O(1)", "O(n)", "O(n log n)", "O(n^2)"},
				Accept:  []string{"O(1)"},
				Explain: "pref[r] - pref[l-1] is two lookups.",
			},
			{
				ID:      "build-cost",
				Prompt:  "What do you pay to build the prefix array?",
				Choices: []string{"O(n)", "O(1)", "O(n log n)", "O(q)"},
				Accept:  []string{"O(n)"},
				Explain: "One pass over the array. Queries come after.",
			},
			{
				ID:      "index",
				Prompt:  "The statement uses 1-based inclusive l and r. Which subtraction is the sum?",
				Choices: []string{"pref[r] - pref[l-1]", "pref[r] - pref[l]", "pref[l] - pref[r]", "pref[r] + pref[l]"},
				Accept:  []string{"pref[r] - pref[l-1]"},
				Explain: "pref[l-1] is everything strictly before the range. pref[0] is 0 so l = 1 still works.",
			},
		},
	})
	registerQuiz(Quiz{
		ID: "bfs-quiz", TrackID: "graphs", TopicID: "bfs",
		Title: "BFS", Minutes: 6,
		Questions: []Check{
			{
				ID:      "when",
				Prompt:  "When is BFS the shortest path?",
				Choices: []string{"every edge has weight 1", "edge weights can be negative", "the graph is a DAG only", "you need a heap"},
				Accept:  []string{"every edge has weight 1"},
				Explain: "Different weights need Dijkstra. Negative weights need Bellman-Ford.",
			},
			{
				ID:      "enqueue",
				Prompt:  "When do you set dist[v]?",
				Choices: []string{"the first time you see v", "every time you see v", "only at the source", "after the queue is empty"},
				Accept:  []string{"the first time you see v"},
				Explain: "Later visits cannot be shorter on an unweighted graph.",
			},
		},
	})
}

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
        cout << pref[r] - pref[l - 1] << "\n";
    }
}`

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
    cout << (best > n ? -1 : best) << "\n";
}`

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
    for (int x : dist) cout << x << "\n";
}`

func prefixIntuition() Lesson {
	return Lesson{
		ID: "prefix-sums-intuition", TrackID: "fundamentals", ModuleID: "fundamentals-core",
		Title: "Prefix sums", Difficulty: DiffIntro, Minutes: 20,
		Summary: "Build a running total once. A range sum is then one subtraction.",
		Objectives: []string{
			"Write pref[i] as the sum of the first i elements.",
			"Answer [l, r] as pref[r] - pref[l-1].",
			"Know why this dies if the array also receives updates.",
		},
		Tags:    []string{"prefix-sums", "arrays"},
		Prereqs: nil,
		Sections: []Section{
			{
				Heading:  "The move",
				Body:     "If you only ever add up a slice of an array, do not walk that slice again for every query.\n\npref[0] = 0\npref[i] = pref[i-1] + a[i]   (1-based a)\n\nsum from l to r, inclusive, is pref[r] - pref[l-1].\nThe left term includes a[l]. Subtracting pref[l] would drop a[l]. That is the usual off-by-one.",
				Code:     prefixCode,
				Language: "C++",
			},
			{
				Heading: "When not to use it",
				Body:    "A point update invalidates every prefix to the right. You can rebuild in O(n), which is fine for one update and fatal for 1e5 of them. That problem wants a Fenwick tree or a segment tree, not a prefix array.\n\nNegative numbers are fine. The identity is still addition. Use a 64-bit accumulator unless the statement promises the sum fits in 32 bits.",
			},
		},
		Pitfalls: []string{
			"1-based queries against a prefix that forgot pref[0].",
			"pref[r] - pref[l] drops a[l].",
			"int overflow. The sample is small; the hidden tests are not.",
		},
		Checks: []Check{
			{ID: "query-cost", Prompt: "Cost of one query after the build?", Choices: []string{"O(1)", "O(n)", "O(log n)"}, Accept: []string{"O(1)"}, Explain: "Two array reads."},
			{ID: "formula", Prompt: "Sum of the inclusive range [l, r]?", Choices: []string{"pref[r] - pref[l-1]", "pref[r] - pref[l]", "pref[l] - pref[r]"}, Accept: []string{"pref[r] - pref[l-1]"}, Explain: "pref[l-1] stops just before l."},
		},
	}
}

func prefixImpl() Lesson {
	return Lesson{
		ID: "prefix-sums-implementation", TrackID: "fundamentals", ModuleID: "fundamentals-core",
		Title: "Prefix sums, typed out", Difficulty: DiffCore, Minutes: 25,
		Summary: "Read the array into the prefix, then answer queries. Do not mix the two loops.",
		Objectives: []string{
			"Finish the prefix before the first query.",
			"Keep input indexes and storage indexes consistent.",
		},
		Tags:    []string{"prefix-sums"},
		Prereqs: []string{"prefix-sums-intuition"},
		Sections: []Section{
			{
				Heading:  "Order of work",
				Body:     "Build, print the prefix on the sample if you are unsure, then answer queries. If the printed prefix is wrong, more query logic will not save you.\n\nFor the sample 1 2 3 4 5 the prefix is 0 1 3 6 10 15. Query 2 4 is 10 - 1 = 9.",
				Code:     prefixCode,
				Language: "C++",
			},
		},
		Pitfalls: []string{"Query loop that also appends to the array.", "Forgetting cin on q."},
		Checks: []Check{
			{ID: "build-cost", Prompt: "Build cost?", Choices: []string{"O(n)", "O(1)", "O(nq)"}, Accept: []string{"O(n)"}, Explain: "One addition per element."},
		},
	}
}

func twoPointers() Lesson {
	return Lesson{
		ID: "two-pointers-intuition", TrackID: "fundamentals", ModuleID: "fundamentals-core",
		Title: "Two pointers", Difficulty: DiffIntro, Minutes: 25,
		Summary: "If the condition only gets harder as the window grows, the left edge never moves backward.",
		Objectives: []string{
			"Say why the left pointer is monotone.",
			"Tell this apart from a deque window.",
		},
		Tags:    []string{"two-pointers"},
		Prereqs: nil,
		Sections: []Section{
			{
				Heading:  "Sorted pair, or a growing window",
				Body:     "On a sorted array, a pair that should sum to s: if a[L] + a[R] is too small, L++. Too big, R--. Each step throws away an index forever.\n\nOn a window of positive numbers, advance R and pull L forward while the window still satisfies the predicate. L does not return. That is why the whole scan is linear.\n\nIf values can be negative, dropping the left element might be a mistake. Stop and use another tool.",
				Code:     twoPtrCode,
				Language: "C++",
			},
		},
		Pitfalls: []string{
			"Moving L backward.",
			"Using this on a non-monotone condition.",
			"Window length off by one (R - L vs R - L + 1).",
		},
		Checks: []Check{
			{ID: "when", Prompt: "Two pointers need which property?", Choices: []string{"the decision only moves one way", "the array is a tree", "weights can be negative"}, Accept: []string{"the decision only moves one way"}, Explain: "If the left edge has to come back, the argument is gone."},
		},
	}
}

func windowMin() Lesson {
	return Lesson{
		ID: "sliding-window-intuition", TrackID: "fundamentals", ModuleID: "fundamentals-core",
		Title: "Sliding window minimum", Difficulty: DiffCore, Minutes: 30,
		Summary: "A deque of candidate indexes, kept in order, so each window's min sits at the front.",
		Objectives: []string{
			"Pop indexes that fell out of the window.",
			"Pop worse indexes from the back before pushing.",
		},
		Tags:    []string{"sliding-window", "deque"},
		Prereqs: []string{"two-pointers-intuition"},
		Sections: []Section{
			{
				Heading: "Why a deque",
				Body:    "Two pointers can shrink a window when the condition is monotone. The minimum inside a fixed-length window is not that. An element that is not the min yet might become the min after a smaller one leaves.\n\nStore indexes, not values. Drop the front when it is more than k behind i. Drop the back while it is worse than a[i]. Then push i. When i >= k-1, a[dq.front()] is the answer for the window ending at i.\n\nEach index is pushed once and popped once.",
			},
		},
		Pitfalls: []string{
			"Storing values and then not knowing whether they are still inside the window.",
			"Strict vs non-strict pop when duplicates exist. Match the problem (min vs first min).",
		},
		Checks: []Check{
			{ID: "store", Prompt: "What do you store in the deque?", Choices: []string{"indexes", "only the current minimum", "prefix sums"}, Accept: []string{"indexes"}, Explain: "You need the position to know when it leaves the window."},
		},
	}
}

func binarySearch() Lesson {
	return Lesson{
		ID: "binary-search-intuition", TrackID: "search-sort", ModuleID: "search-core",
		Title: "Binary search", Difficulty: DiffIntro, Minutes: 25,
		Summary: "Half-open range. Keep the first index where the predicate becomes true.",
		Objectives: []string{
			"Write the loop so it terminates.",
			"Search the answer, not only an element, when a check is easier than a construction.",
		},
		Tags:    []string{"binary-search"},
		Prereqs: nil,
		Sections: []Section{
			{
				Heading: "Half-open",
				Body:    "Sort if you are looking up a value. Set L = 0 and R = n, exclusive.\n\nwhile L < R:\n    mid = (L + R) / 2\n    if a[mid] < x: L = mid + 1\n    else: R = mid\n\nL is the first index with a[L] >= x, or n if there is none. An infinite loop almost always means you set L = mid on an integer range and mid did not move.\n\nSearching the answer is the same loop with a different predicate: ok(mid) instead of a comparison. ok has to be monotone or the discarded half might have held the answer.",
			},
		},
		Pitfalls: []string{
			"L = mid instead of L = mid + 1.",
			"Binary search on an unsorted array.",
			"A check that is not monotone.",
		},
		Checks: []Check{
			{ID: "loop", Prompt: "Which update avoids the infinite loop when the range is integers?", Choices: []string{"L = mid + 1", "L = mid", "R = mid + 1 always"}, Accept: []string{"L = mid + 1"}, Explain: "mid can equal L. Assigning L = mid then repeats forever."},
		},
	}
}

func bfsLesson() Lesson {
	return Lesson{
		ID: "bfs-intuition", TrackID: "graphs", ModuleID: "graphs-core",
		Title: "Breadth-first search", Difficulty: DiffIntro, Minutes: 25,
		Summary: "On weight-1 edges the first time you reach a node is the shortest time.",
		Objectives: []string{
			"Enqueue a node once, when dist is set.",
			"Do not use this for arbitrary weights.",
		},
		Tags:    []string{"bfs", "graphs"},
		Prereqs: nil,
		Sections: []Section{
			{
				Heading:  "Queue, not a stack",
				Body:     "dist[source] = 0. Push the source. When you pop u, every neighbor v with dist[v] still unset gets dist[u] + 1 and is pushed.\n\nDFS visits a node the first time you happen to walk there, which is not the fewest edges. A heap is Dijkstra, for non-negative weights that are not all 1.\n\n0-1 BFS is the cousin: a deque, push front on a 0-weight edge and push back on a 1-weight edge. Do not reach for it until you have seen a 0-1 statement.",
				Code:     bfsCode,
				Language: "C++",
			},
		},
		Pitfalls: []string{
			"Pushing a node every time you see it.",
			"1-based input left as 0-based indexes.",
			"Using dist from DFS and calling it shortest.",
		},
		Checks: []Check{
			{ID: "when", Prompt: "BFS distances are shortest when?", Choices: []string{"every edge has weight 1", "weights can be negative", "the graph is directed only"}, Accept: []string{"every edge has weight 1"}, Explain: "Equal positive weights are fine too if you scale them, but the plain queue assumes each edge costs one step."},
		},
	}
}

func knapsack() Lesson {
	return Lesson{
		ID: "knapsack-intuition", TrackID: "dp", ModuleID: "dp-core",
		Title: "0/1 knapsack", Difficulty: DiffCore, Minutes: 30,
		Summary: "One array, capacity loop running downward, so each item is used at most once.",
		Objectives: []string{
			"Explain why the capacity loop goes downward.",
			"Switch the direction for unbounded knapsack and know you did.",
		},
		Tags:    []string{"knapsack", "dp"},
		Prereqs: nil,
		Sections: []Section{
			{
				Heading: "One row",
				Body:    "dp[c] is the best value with capacity c, using the items considered so far.\n\nFor an item of weight w and value v, walk c from W down to w:\n    dp[c] = max(dp[c], dp[c - w] + v)\n\nDownward means dp[c-w] is still the previous item layer. Upward would let the same item fill the bag again, which is the unbounded problem. People mix those up and then stare at a sample that happens to pass.\n\nn * W around 1e7 is the usual limit for this. Bigger than that and the state is wrong, not the language.",
			},
		},
		Pitfalls: []string{
			"Looping capacity upward on a 0/1 item.",
			"Starting the transition from c = w - 1.",
			"Values that overflow a 32-bit int.",
		},
		Checks: []Check{
			{ID: "dir", Prompt: "0/1 knapsack walks capacity in which direction?", Choices: []string{"downward", "upward", "either"}, Accept: []string{"downward"}, Explain: "Upward reuses the item you just placed."},
		},
	}
}
