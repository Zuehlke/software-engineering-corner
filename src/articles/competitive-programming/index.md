---
title: Competitive Programming—Change the Way You Think and Code
description: >-
  This article discusses what Competitive Programming (CP) is and how it can change the way you think and code. In the first part, the reader will be given a brief introduction to CP, covering CP platforms, training resources, and some words of advice from highly rated competitive programmers.
  The second part of this article will guide the reader through a selected set of problems, with the aim of demonstrating how our intuition and reasoning can sometimes be wrong.
released: '2026-08-22T10:34:00.000Z'
cover: images/cover.jpg
author: Manu Paul Kunnumpurathu
tags:
  - competitive-programming
  - problem-solving
  - dsa
shortDescription: >-
  This article discusses what Competitive Programming (CP) is and how it
  can change the way you think and code.
---

# Competitive Programming—Change the Way You Think and Code

---

## Table of Contents

- [What is Competitive Programming?](#what-is-competitive-programming)
- [Why should you start CP?](#why-should-you-start-cp)
- [CP platforms](#cp-platforms)
- [Practice materials and resources](#practice-materials-and-resources)
- [Words of advice](#words-of-advice)
- [CSES problems](#cses-problems)
  - [Sum of Two Values](#sum-of-two-values)
    - [Solution](#solution)
      - [Brute force solution](#brute-force-solution)
      - [Accepted solution](#accepted-solution)
  - [Sum of Three Values](#sum-of-three-values)
    - [Solution](#solution-1)
      - [HashMap solution](#hashmap-solution)
      - [Accepted solution](#accepted-solution-1)
- [Learnings](#learnings)
  - [C++ vs Java](#c-vs-java)
  - [Clean Code—horrible performance](#clean-codehorrible-performance)
  - [Fewer Lines of Code ≠ Less Complex](#fewer-lines-of-code--less-complex)
- [Our journey ends here](#our-journey-ends-here)

---

## What is Competitive Programming?

Competitive Programming (CP) is a **mind sport** in which participants solve
well-defined algorithmic problems within a time limit. It combines
**problem-solving** with **Data Structures and Algorithms (DSA)**, ranging from
simple challenges—e.g. basic arithmetic or sorting an array—to more complex
problems requiring advanced concepts—e.g. dynamic programming, advanced
mathematics, and complex graph theory, just to name a few.

## Why should you start CP?

Now that you know what CP is, you might ask yourself why you should invest some
of your already very limited time and energy in CP or problem-solving in
general. The answer to this very question is that CP **requires _thinking_**,
which can be divided into **intuition** (System 1)—which is fast and happens
subconsciously based on patterns learned from past experiences—and **reasoning**
(System 2)—which is slow and deliberate, and requires high effort.

> Note that the aforementioned dual process theory is a framework that is
> widely supported by cognitive psychology and not something I invented.

Besides _thinking_, CP also **improves one's programming and debugging skills**,
since only a bug-free and efficient solution is accepted. Such skills are of
immense value in software engineering, and it is no coincidence that IT
companies are interested in candidates who have a background in CP.

If you are still considering embarking on this journey with me, allow me to
conclude this section by saying that **LLMs are going to lose their jobs** once
you become more proficient in CP and problem-solving—fingers crossed.

I hope I have captured your attention—now, without further ado, let us delve
into the following sections.

## CP platforms

If you are already proficient in problem-solving and seeking competition, various CP platforms exist. The most popular amongst them is **[Codeforces](https://codeforces.com/)**, which hosts frequent rated contests, has a large community and a strong problem archive. The rating system is **[Elo-based](https://codeforces.com/blog/entry/68288)**—ratings can go up and down based on your performance in contests.

Other notable CP platforms are [AtCoder](https://atcoder.jp/)—popular in Japan and internationally, contains high-quality problems; [CodeChef](https://www.codechef.com/contests)—beginner-friendly, hosts monthly long challenges and short contests; and [LeetCode](https://leetcode.com/)—mainly interview-focused problems, great for DSA practice.

## Practice materials and resources

Mastering CP requires a great amount of work. Thus, to make your learning
experience most pleasant and rewarding, a well-structured roadmap, i.e., a
learning strategy, is highly advisable.

The CP practice materials and resources I came across so far include the
following:

- **[CSES Problem Set](https://cses.fi/)** _developed by Antti Laaksonen and fellow contributors_—an online platform featuring a curated set of classic problems covering all core topics; excellent for building a solid foundation
- **A Guide to Competitive Programming** _by Antti Laaksonen_—a concise book covering algorithms and data structures with CP-style examples
- **[Competitive Programmer's Handbook](https://usaco.guide/CPH.pdf)** _by Antti Laaksonen_—a handbook which gives you a thorough introduction to CP
- **[USACO Guide](https://usaco.guide/)**—a free, structured curriculum from bronze to platinum; great roadmap for beginners and intermediate competitors

> I myself am currently working with the **CSES Problem Set** and **A Guide to Competitive Programming**.

Many sources listed above are written or developed by Antti Laaksonen; they are
widely recognized by the CP community. Regarding Antti Laaksonen, he is a
Finnish computer scientist, university lecturer and author best known for his
books on CP. Besides contributions to the community, he also holds the title of
Grandmaster on Codeforces under the handle
[pllk](https://codeforces.com/profile/pllk).

## Words of advice

Some words of advice from the Grandmaster himself:

> "When solving problems, one should keep in mind that the **_number_ of solved
> problems is not as important as the _quality_ of the problems**. It is tempting to
> select problems that look nice and easy and solve them, and skip problems that look
> hard and tedious. However, the way to really improve one’s skills is to focus on the
> latter type of problems."—Antti Laaksonen

Other valuable insights I have gathered from highly-rated competitive programmers and
Grandmasters indicate that it is also important to **solve
random problems**—to simulate the contest environment—and to practice
regularly—ideally **short daily sessions to improve quickly** instead of a long
weekly session.

The last piece of advice I want to leave you with—something I occasionally fail
to do to this very day—is to **timebox!** Timeboxing prevents you from wasting
precious hours and stops you from pursuing a dead-end approach. A simple rule of
thumb is to **timebox for 30 minutes**. If you are unable to come up with an
approach, read part of the editorial or the entire thing, learn the concepts and then try
solving it again. Rinse and repeat. Do not let your pride take over!

## CSES problems

In this section, I want to guide you through a selected set of CSES
problems—problems for which not much prior knowledge in mathematics or DSA is
required—with the aim of demonstrating how our intuition and reasoning can
sometimes be wrong.

> Note that the problems listed below build upon one another.
> I therefore highly recommend that you walk through the problems in the specific order
> unless you have already solved them.

### Sum of Two Values

The first problem I want to solve with you is [Sum of Two Values](https://cses.fi/problemset/task/1640)—also known as _"2Sum"_ on some other platforms such as LeetCode. Before proceeding with this article, please read the problem description thoroughly so that you have an idea of what we are trying to solve.

In a first step, I want you to come up with your own solution. Design your
algorithm—grab pen and paper, this is the fun part in my opinion—and then
implement it.

> **Figure out _yourself_**—timebox for 30 minutes before reading the solution!

#### Solution

Oftentimes, especially in the initial phase of our CP or problem-solving
journey, we tend to come up with brute force solutions, even if we possess the
required knowledge, skills and tools to solve the problems more efficiently.

##### Brute force solution

For the _"Sum of Two Values"_ problem, I suppose most of you implemented the
following brute force solution:

```java
import java.io.*;
import java.util.*;

public class Solution {
	
    public static void main(String[] args) throws Exception {
        final BufferedReader br =
                new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());

        final int n = Integer.parseInt(st.nextToken());
        final int x = Integer.parseInt(st.nextToken());

        st = new StringTokenizer(br.readLine());
        final int[] values = new int[n + 1];

        for (int i = 1; i <= n; i++) {
            values[i] = Integer.parseInt(st.nextToken());
        }

        for (int i = 1; i <= n; i++) {
            for (int j = i + 1; j <= n; j++) {
                if (values[i] + values[j] == x) {
                    System.out.println(i + " " + j);
                    return;
                }
            }
        }

        System.out.println("IMPOSSIBLE");
    }

}
```

The logic is sound but very inefficient. Submitting the above solution on
CSES will result in **Time Limit Exceeded (TLE)**.

This outcome could have been prevented if we had already considered the time
limit constraint—I could have saved you the trouble by providing you with
sufficient knowledge in advance, but I believe in learning by making
mistakes—before implementing the brute force approach.

The starting point for estimating whether an algorithm is efficient enough to solve a particular problem is the fact that, according to the [USACO Guide](https://usaco.guide/bronze/time-comp?lang=java), a grading server can perform around $10^8$ operations per second.

For the problem we are trying to solve, we know that the time limit is one second and the input size is $n = 2\cdot 10^5$. If the time complexity is $O(n^2)$, the algorithm will perform about $(2 \cdot 10^5)^2 = 4 \cdot 10^{10}$ operations, which is too slow for solving the problem. However, if the time complexity is $O(n \log n)$, there will be only about $2 \cdot 10^5 \cdot \log(2 \cdot 10^5) ≈ 3.5 \cdot 10^6$ operations, and the algorithm will surely fit the time limit.

The brute force solution uses two nested loops. The outer loop iterates over all indices $i$ from $1$ to $n$, and for each $i$, the inner loop iterates over all indices $j$ from $i + 1$ to $n$. The total number of pair comparisons is an arithmetic series and is therefore:

$$
\sum_{i=1}^{n}(n - i) = (n-1) + (n-2) + \cdots + 1 + 0 = \frac{n(n-1)}{2} = \frac{1}{2} \cdot (n^{2} - n)
$$

In Big-O, we can drop constants and lower-order terms. Thus, the above
expression reduces to $O(n^2)$; the brute force approach has a time complexity
of $O(n^2)$.

##### Accepted solution

A possible way to solve this problem efficiently is by iterating over the
input—stored in `summand`—and checking whether `neededSummand` is stored in the
map `positionBySummand`. If the key `neededSummand` exists in
`positionBySummand`, we have found a solution; otherwise, the `summand` with its
`position` will be added to the map.

```java
import java.io.*;
import java.util.*;

public class Solution {
	
    public static void main(String[] args) throws Exception {
        final BufferedReader br =
                new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());

        final int n = Integer.parseInt(st.nextToken());
        final int x = Integer.parseInt(st.nextToken());

        st = new StringTokenizer(br.readLine());

        final Map<Integer, Integer> positionBySummand
                = new HashMap<>();

        for (int position = 1; position <= n; position++) {
            final int summand = Integer.parseInt(st.nextToken());
            final int neededSummand = x - summand;

            if (positionBySummand.containsKey(neededSummand)) {
                System.out.println(
                        positionBySummand.get(neededSummand)
                                + " "
                                + position
                );
                return;
            }

            positionBySummand.put(summand, position);
        }

        System.out.println("IMPOSSIBLE");
    }

}
```

The time complexity of this implementation is $O(n)$.

### Sum of Three Values

Now that you know how _"Sum of Two Values"_ works, I want you to solve [Sum of Three Values](https://cses.fi/problemset/task/1641)—also known as _"3Sum"_, not the kind you are looking for, but still a very important problem; many other problems can be reduced to it.

Again, devise an algorithm which gets accepted with the help of pen and paper.

> **Figure out _yourself_**—timebox for 30 minutes before reading the solution!

#### Solution

Even though we are trying to solve a similar problem, it has to be approached
differently for it to get accepted.

##### HashMap solution

I assume that most of you tried the HashMap variant from before, which is
a natural first attempt:

```java
import java.io.*;  
import java.util.*;  
  
public class Solution {  
  
    public static void main(String[] args) throws Exception {  
        final BufferedReader br = new BufferedReader(  
                new InputStreamReader(System.in)  
        );  
  
        StringTokenizer st = new StringTokenizer(br.readLine());  
  
        final int n = Integer.parseInt(st.nextToken());  
        final int x = Integer.parseInt(st.nextToken());  
  
        final int[] a = new int[n];  
  
        st = new StringTokenizer(br.readLine());  
  
        for (int i = 0; i < n; i++) {  
            a[i] = Integer.parseInt(st.nextToken());  
        }  
  
        for (int i = 0; i < n; i++) {  
            final Map<Integer, Integer> map = new HashMap<>();  
  
            for (int j = i + 1; j < n; j++) {  
                final int neededSummand = x - a[i] - a[j];  
  
                if (map.containsKey(neededSummand)) {  
                    System.out.println(  
                            (i + 1)  
                                    + " " +  
                                    (map.get(neededSummand) + 1)  
                                    + " " +  
                                    (j + 1)  
                    );  
                    return;  
                }  
  
                map.put(a[j], j);  
            }  
        }  
  
        System.out.println("IMPOSSIBLE");  
    }  

}
```

However, for test cases with a large input size `n`, you will get a **TLE**, even though $O(n^{2})$ should theoretically fit within the time limit. The problem is that for large `n`, the **high constant factor of `HashMap<Integer, Integer>` dominates**—each iteration performs hash-table operations and involves boxing `int` values into `Integer` objects—consequently causing TLE.

From ecstasy to agony—a rollercoaster full of mixed emotions—is how I would
describe our voyage so far. We have reached an impasse, but in return we have
gained new knowledge—Quid pro quo, that is how I perceive it.

##### Accepted solution

The key insight is to **sort the array** and then use a **two-pointer technique** to replace the $O(n)$ HashMap inner search with an $O(n)$ two-pointer scan—both yield $O(n^{2})$ overall, but the two-pointer variant has a **far smaller constant factor**.

Here is how it works step by step:

1. **Preserve original indices before sorting.** The problem requires returning the original 1-based positions. Since sorting will reorder elements, each element is wrapped in a `Digit` object that stores both its `value` and its `originalIndex`.

2. **Sort by value.** `Arrays.sort` with a comparator on `digit.value` gives us a sorted array in $O(n \log n)$.

3. **Fix the first element, then two-pointer the rest.** For each index `i`, treat `digits[i]` as the fixed first element `a`. The remaining task is to find two elements in `digits[i+1..n-1]` whose values sum to `twoSum = target - a.value`. Because that sub-array is already sorted, we can solve this with two pointers `indexB = i+1` (left) and `indexC = n-1` (right):
   - If `b.value + c.value == twoSum` → found, output the three original indices and exit.
   - If the sum is **too large** → move `indexC` left to decrease the sum.
   - If the sum is **too small** → move `indexB` right to increase the sum.

   Each pointer only moves inward, so the inner while-loop runs in $O(n)$ total per outer iteration.

4. **No boxing, no hashing.** Unlike the HashMap approach, all operations here are on primitive `int` comparisons and array index arithmetic—dramatically lower constant overhead, which is why this passes under the time limit where the HashMap solution does not.

```java
import java.io.*;
import java.util.Arrays;
import java.util.Comparator;
import java.util.StringTokenizer;

public class Solution {

    public static void main(String[] args) throws IOException {
        final BufferedReader br =
                new BufferedReader(new InputStreamReader(System.in));
        final PrintWriter printWriter =
                new PrintWriter(
                        new BufferedWriter(
                                new OutputStreamWriter(System.out)
                        )
                );

        StringTokenizer st = new StringTokenizer(br.readLine());

        final int n = Integer.parseInt(st.nextToken());
        final int target = Integer.parseInt(st.nextToken());

        st = new StringTokenizer(br.readLine());

        final Digit[] digits = new Digit[n];
        for (int i = 0; i < n; i++) {
            digits[i] = new Digit(i + 1, Integer.parseInt(st.nextToken()));
        }

        Arrays.sort(digits, Comparator.comparingInt(digit -> digit.value));

        String result = "IMPOSSIBLE";

        for (int i = 0; i < n; i++) {
            final Digit a = digits[i];
            final int twoSum = target - a.value;

            int indexB = i + 1; // left
            int indexC = digits.length - 1; // right

            while (indexB < indexC) {
                final Digit b = digits[indexB];
                final Digit c = digits[indexC];
                final int sumOfTwo = b.value + c.value;

                if (sumOfTwo == twoSum) {
                    result = String.format(
                            "%d %d %d",
                            a.originalIndex,
                            b.originalIndex,
                            c.originalIndex
                    );
                    printWriter.println(result);
                    printWriter.flush();
                    return;
                } else if (sumOfTwo > twoSum) {
                    indexC--;
                } else {
                    indexB++;
                }
            }
        }

        printWriter.println(result);
        printWriter.flush();
    }

    private static final class Digit {
        private final int originalIndex;
        private final int value;

        private Digit(final int originalIndex, final int value) {
            this.originalIndex = originalIndex;
            this.value = value;
        }
    }

}
```

## Learnings

In the following sections, I want to share some of my insights with you.
However, please take some of what I say with a grain of salt.

### C++ vs Java

C++ is the most popular programming language in the CP community. You often
write shorter code; C++ is faster—it is all about speed and avoiding TLE—and the
Standard Template Library (STL) provides lots of DSA functions e.g.,
`next_permutation` out of the box:

```cpp
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    string s;
    cin >> s;

    sort(s.begin(), s.end());
    vector<string> v;
    do {
        v.push_back(s);
    } while (next_permutation(s.begin(), s.end()));

    cout << v.size() << "\n";
    for (auto s : v) {
        cout << s << "\n";
    }

}
```

Compared to C++, the Java code below is very verbose, since it does not provide
the `next_permutation` function. Typically, competitive programmers who solve
problems with Java keep such implementations in a personal template rather than
implementing them from scratch every time.

Do not expect me to explain the Java implementation below because I was not able
to implement it back then.

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.*;

public class Solution {

    public static void main(String[] args) throws IOException {
        final BufferedReader br
                = new BufferedReader(new InputStreamReader(System.in));
        final String input = br.readLine();   // Read the input string

        /*
         * Convert string to character array and sort it
         * Sorting ensures we start from the lexicographically
         * smallest permutation
         */
        final char[] arr = input.toCharArray();
        Arrays.sort(arr);

        /*
         * TreeSet stores unique permutations automatically
         * and keeps them sorted
         */
        final Set<String> uniquePermutations = new TreeSet<>();

        /*
         * Generate permutations using nextPermutation logic
         * The loop keeps going until no next permutation is possible
         */
        do {
            uniquePermutations.add(new String(arr));
        } while (nextPermutation(arr));

        // Print the number of unique permutations
        System.out.println(uniquePermutations.size());

        // Print all unique permutations in sorted order
        final StringBuilder sb = new StringBuilder();
        for (String uniquePermutation : uniquePermutations) {
            sb.append(uniquePermutation).append("\n");
        }

        System.out.println(sb);
    }

    /**
     * Generates the next lexicographical permutation of 
     * the given array. Returns false if the current 
     * permutation is the last one (highest order).
     * <p>
     * Example:
     * a b c -> a c b -> b a c -> b c a -> c a b -> c b a
     */
    private static boolean nextPermutation(char[] arr) {
        /* 
         * Step 1: Find the longest suffix that 
         * is non-increasing (right to left). 
         */
        int i = arr.length - 2;
        while (i >= 0 && arr[i] >= arr[i + 1]) {
            i--;
        }

        /*
         * If i < 0, then the array is in descending order,
         * so this is the last permutation
         */
        if (i < 0) {
            return false;
        }

        // Step 2: Find the rightmost element greater than a[i]
        int j = arr.length - 1;
        while (arr[j] <= arr[i]) {
            j--;
        }

        // Step 3: Swap a[i] with a[j]
        swap(arr, i, j);

        // Step 4: Reverse the suffix starting at a[i+1]
        reverse(arr, i + 1, arr.length - 1);

        return true; // Next permutation generated
    }

    // Swap two characters in the array
    private static void swap(char[] arr, int i, int j) {
        char tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }

    // Reverse a portion of the array in place
    private static void reverse(char[] arr, int start, int end) {
        while (start < end) {
            swap(arr, start, end);
            start++;
            end--;
        }
    }

}
```

To this very day, I am still recovering from the emotional damage caused by the
C++ solution. I am not telling you to switch to C++, but there are certainly
some advantages. I personally use Java, since I am already familiar with it, but
C++ is tempting sometimes—especially for problems such as the above one.

### Clean Code—horrible performance

For certain problems, the `BufferedReader` was too slow to handle large inputs
efficiently. Thus, I had to implement a custom `FastReader`—with the help of
ChatGPT, my friend in need. The following implementation is super efficient but
very difficult to understand—ChatGPT did all the coding, and I did all the
prompting. The bottom line is that _Clean Code_ is not always as good as Uncle
Bob preaches.

```java
// Fast input reader to handle large input efficiently
public class FastReader {
	final BufferedInputStream in = new BufferedInputStream(System.in);
	final int BUFFER_SIZE = 1 << 16;
	final byte[] buffer = new byte[BUFFER_SIZE];
	int length = 0, ptr = 0;

	// Read a single byte from input
	private int readByte() throws IOException {
		if (length == -1) return 0; // end of stream
		if (ptr >= length) {
			length = in.read(buffer);
			if (length <= 0) return 0; // end of stream
			ptr = 0;
		}
		return buffer[ptr++] & 0xFF;
	}

	// Read next integer from input
	private int nextInt() throws IOException {
		int c = readByte(), x = 0;

		// Skip any whitespace
		while (c <= ' ') c = readByte();

		// Construct the integer digit by digit
		while (c >= '0' && c <= '9') {
			x = x * 10 + (c - '0');
			c = readByte();
		}
		return x;
	}

}
```

### Fewer Lines of Code ≠ Less Complex

Another insight I gained from CP is that the Lines of Code (LoC) estimation—a
technique used to predict the project effort, cost, and duration—is a fallacy. I
dare you to predict the effort, cost, duration, pain, sweat, and tears involved
in the following implementation. A little bit of sorting, looping, and an `if`
condition is all you need to showcase the limitations of LoC estimation.

```java
public class Solution {
	
	public static void main(String[] args) throws Exception {
		final BufferedReader br 
			= new BufferedReader(new InputStreamReader(System.in));
 
		final int n = Integer.parseInt(br.readLine());
		final long[] coins = new long[n];
 
		final StringTokenizer st = new StringTokenizer(br.readLine());
		for (int i = 0; i < n; i++) {
			coins[i] = Long.parseLong(st.nextToken());
		}
 
		Arrays.sort(coins);
 
		long smallestMissingPositiveSum = 1;
 
		for (long coin : coins) {
			if (coin > smallestMissingPositiveSum) {
				break;
			}
			smallestMissingPositiveSum += coin;
		}
 
		System.out.println(smallestMissingPositiveSum);
	}

}
```

## Our journey ends here

This is the end of our journey. I hope you enjoyed reading this article as much
as I enjoyed writing it. There is nothing more I have to share with you—you have
everything you need to start your own CP journey. Whether it is a casual one—the
route I am currently taking—or an arduous one—the road to becoming a
Grandmaster—the choice is up to you.
