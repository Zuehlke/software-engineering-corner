---
title: Demystifying Concurrency
subtitle: Essential Clarifications
domain: software-engineering-corner.hashnode.dev
tags: concurrency, asynchronous, async, multithreading, opinion-pieces, programming, developer, learning, general-advice, software-development, programming-tips, software-engineering, computer-science
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1721214359400/b5d75350-8c3f-4392-840b-a96520ab9f94.jpeg
publishAs: tiju
hideFromHashnodeCommunity: false
saveAsDraft: true
--- 
I often encounter situations where Software Engineers have differing mental models of concurrency. To make matters worse, there are terms that are used (almost) synonymously, like async and parallel. But also definitions for [Data parallelism](https://en.wikipedia.org/wiki/Data_parallelism) and [Task parallelism](https://en.wikipedia.org/wiki/Task_parallelism), [Implicit parallelism](https://en.wikipedia.org/wiki/Implicit_parallelism) and [Explicit parallelism](https://en.wikipedia.org/wiki/Explicit_parallelism) that seem to suggest that there are multiple kinds of concurrency. There is a wealth of content and numerous definitions on this topic, but I have yet to find a single explanation or definition that clearly delineates the differences. Most explanations only add to the confusion, and even the best ones remain somewhat unclear.

![concurrency cat](https://cdn.hashnode.com/res/hashnode/image/upload/v1720043156235/4a3cefd6-4d34-47f7-8ad4-9e991bc36525.jpeg align="center")

### Breaking Down the Confusion: Towards a Common Understanding of Concurrency

There are reasons for this confusion. The most important one is probably that there are multiple incompatible mental models and definitions for these terms in different contexts. For example, in the context of inter-service communication, async is used to describe the **non-blocking** nature of communication. But, in the context of programming languages, it is used to handle async task execution in a **sequentially blocking** manner. Regardless of this incompatibility, they get mixed and matched without much thought:

[![](https://cdn.hashnode.com/res/hashnode/image/upload/v1720597890803/22affb01-7923-487e-961d-4352fb97404c.png align="center")](https://www.youtube.com/watch?v=x-MOtcat1iE)

It's telling that the Wikipedia pages for [Concurrency (computer science)](https://en.wikipedia.org/wiki/Concurrency_(computer_science)) and [Asynchrony (computer programming)](https://en.wikipedia.org/wiki/Concurrency_(computer_science)) explicitly mention their context. However, even within computer science, there are different interpretations of concurrency. The most obvious contexts are programming languages and distributed systems. But there are other contexts as well, such as [Asynchronous circuits](https://en.wikipedia.org/wiki/Asynchronous_circuit) and networking.

Many attempts have been made to explain these concepts. A lot of good ones as well. But even when a good one gets attention, like the talk [**Concurrency is not parallelism - The Go Programming Language**](https://go.dev/blog/waza-talk), the misleading parts, such as the confusing title, also seem to stick with the public. In this case, it has led many to mistakenly believe that concurrency and parallelism are somehow opposites, which the talk never intended to suggest.

To add to the confusion, some popular sources contradict basic implementations in well-known languages. For example, take this recent video on YouTube from ByteByteGo:

[![](https://cdn.hashnode.com/res/hashnode/image/upload/v1720600036172/359d125c-aa41-4f08-aeca-2c6bac04639b.png align="center")](https://www.youtube.com/watch?v=RlM9AfWf1WU)

I think it does a good job of separating the different execution modes. However, there is a confusing and contradictory part in the third card of the preview image, which claims there is parallel computing without concurrency. However, this is exactly the scenario that data structures with the prefix "concurrent" (e.g., [ConcurrentDictionary](https://learn.microsoft.com/en-us/dotnet/api/system.collections.concurrent.concurrentdictionary-2?view=net-8.0) in C# or [ConcurrentHashMap](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ConcurrentHashMap.html) in Java) are optimized for. How much is this definition worth if it contradicts how concurrency is interpreted by some of the most popular languages?

![actual_progress](https://imgs.xkcd.com/comics/actual_progress_2x.png align="center")

It does not help that concurrency is inherently a complex topic. Each language, like C#, Java, JavaScript, Python, Rust, and Swift, has its ways and patterns, which fill entire books. 
Then there is reactivity, a closely related topic that can be almost as complex as concurrency. Articles like [What the hell is Reactive Programming anyway?](https://dev.to/this-is-learning/what-the-hell-is-reactive-programming-anyway-31p5) with all the references mentioned, show how quickly you get into quite complicated topics. And the popular [Reactive Manifesto](https://www.reactivemanifesto.org/) demonstrates that it also extends into the distributed systems realm where the connections to concurrency get more obvious.

All this is unfortunate because having a shared understanding of concurrency is crucial for building stable and efficient software. So in this article, I want to propose a definition of concurrency specifically in the context of programming languages.

Having a solid mental model not only helps in communicating ideas more precisely but more importantly gives you the tools to understand what others are talking about and to identify misunderstandings.

### A Tale of Two Models: Parallel vs. Asynchronous Programming

Before I share my definition of concurrency, I would like to introduce it with a little story:

> John, a software developer at a tech startup, was puzzled by the difference between parallel and asynchronous programming. Seeking clarity, John approached his tech lead, Dr. Carter, one morning.
> 
> "Dr. Carter, I'm confused. Parallel and async programming seem similar, but I know they're different. Can you explain?"
> 
> Dr. Carter smiled. "Think of it this way: Parallel programming is like having multiple people do your tasks simultaneously. One person handles laundry, another cooks, and another cleans. They work at the same time, using multiple CPU cores. It's great for CPU-bound tasks."
> 
> "Got it," John said, feeling a bit more confident. "But what about async programming?"
> 
> "Async programming is a bit different," Dr. Carter explained. "It's like you doing the laundry, but while the washing machine is running, you start cooking. You don't just sit and wait for the laundry to finish. Instead, you switch to another task that doesn't need you to be present the whole time."
> 
> John's eyes lit up. "So, parallel is about multiple workers at the same time, and async is about efficient multitasking during idle periods. Got it!"
> 
> Dr. Carter grinned. "Exactly. And here's a twist: When you combine both, you achieve the ultimate stage of concurrency. It's like having multiple people, each efficiently switching between tasks, making the most of both parallel execution and idle times. Concurrency is about managing multiple tasks at the same time, whether they're running simultaneously or not."
> 
> Excited, John returned to his desk, ready to explore the power of concurrency, understanding how to leverage both parallel and asynchronous programming to make their applications faster and more efficient than ever.

The next twist in this story would likely involve issues with race conditions and language-specific implementation details... But that is not the focus of this article. A better approach is to show a visualization of the definition of concurrency as described in this story:

### The Three Quadrants of Concurrency: A Visual Approach

What I want to emphasize is that there are different types of concurrency. It doesn't matter if the work is happening at the same time or if tasks are taking turns to make progress. The best and simplest definition I found is:

> "Concurrency: Doing more than one thing at a time."
> 
> [Stephen Cleary](https://www.oreilly.com/library/view/concurrency-in-c/9781492054498/ch01.html#idm45458718736760)

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1721204052382/54a74571-56c5-4d0d-87fc-5ea8e35ab9eb.png align="center")

This visualization is inspired by [Code Wala](https://codewala.net/2015/07/29/concurrency-vs-multi-threading-vs-asynchronous-programming-explained/). To make it clearer, I added examples from the article into the quadrants. It's a good time to compare it to the visualization by ByteByteGo that I included earlier in this article.

I propose that concurrency includes everything highlighted in blue. My visualization shows the two main aspects of concurrency: one axis separates sequential from parallel, and the other axis separates synchronous from asynchronous. More importantly, it includes async, which is often missing in definitions or explanations of concurrency. Classics like [Clean Code: A Handbook of Agile Software Craftsmanship](https://learning.oreilly.com/library/view/clean-code-a/9780136083238/), [The Pragmatic Programmer: Your Journey to Mastery](https://learning.oreilly.com/library/view/the-pragmatic-programmer/9780135956977/f_0054.xhtml), and [Concurrent Programming in Java](https://learning.oreilly.com/library/view/concurrent-programming-in/0201310090/pr01.html) (I've checked many other books and papers) do not even mention async. While there were reasons for this omission a decade ago, they are no longer relevant. With the widespread adoption of async/await in most popular languages, ignoring async is no longer justifiable. In modern definitions of concurrency, including async is essential for a complete understanding.

![Single Threaded Concurrency?](https://cdn.hashnode.com/res/hashnode/image/upload/v1721202007780/4636cc34-a6c7-4ce0-be47-632f8f136ef1.png align="center")

The key is to understand that there are four distinct ways that code can be executed based on causality and **only the first one is not concurrent**:

1. **Sequential and Synchronous (not Concurrent):** This is the most straightforward method of running code. Tasks are executed one after another, in a specific order. Each task must complete before the next one begins. This is how most people learn to code and how they typically conceptualize program execution. Imagine reading a book, chapter after chapter, without interruption.
    
    ![singlethreaded](https://codewala.net/wp-content/uploads/2015/07/singlethreaded.png align="center")
    
2. **Sequential and Asynchronous (Concurrent):** In this mode, tasks are still executed one after another, but the program can initiate a task and move on to the next one without waiting for the previous task to complete. This allows for more efficient use of time, especially when dealing with I/O-bound tasks. Imagine that while heating up the water, a single person can simultaneously cut the vegetables.
    
    ![async-single](https://codewala.net/wp-content/uploads/2015/07/async-single.png align="center")
    
3. **Parallel and Synchronous (Concurrent):** Here, multiple tasks are executed simultaneously. Each task runs independently at the same time, leveraging parallel processing to complete them faster. This approach is particularly effective for CPU-bound tasks that require significant computational power. Imagine a factory floor where every worker does the same work in parallel.
    
    ![multithreaded](https://codewala.net/wp-content/uploads/2015/07/multithreaded.png align="center")
    
4. **Parallel and Asynchronous (Concurrent):** This method combines the benefits of both parallel and asynchronous execution. Multiple tasks run simultaneously, and within each task, asynchronous operations can occur. This allows for highly efficient handling of both CPU-bound and I/O-bound tasks, optimizing the use of computational resources and time. Imagine a restaurant kitchen where cooks and washers work hand in hand to help each other be more efficient.
    
    ![async-mutlithreaded](https://codewala.net/wp-content/uploads/2015/07/async-mutlithreaded.png align="center")
    

Understanding these different execution modes is crucial for writing efficient and maintainable code, as it helps in selecting the right approach based on the nature of the tasks and the resources available.

### The Evolving Landscape of Concurrency

One of the best resources I've found so far is the [**Concurrency in C# Cookbook**](https://learning.oreilly.com/library/view/concurrency-in-c/9781492054498/ch01.html#idm45458718736760) by Stephen Cleary. I think C# is uniquely positioned to be a baseline for this topic because it introduced the async/await keywords in a way that has since been adopted by many other languages and significantly shaped our understanding of concurrency. However, other languages are also heavily invested in these patterns and continue to evolve the field. Therefore, I tried to be as language-agnostic as possible in this article.

![async timeline](https://cdn.hashnode.com/res/hashnode/image/upload/v1720084949983/7137b347-2846-458a-8137-d6d04dfbfada.png align="center")

Most popular languages are adopting the async/await model to handle asynchrony, but there's still room for improvement. [**Structured Concurrency**](https://vorpus.org/blog/notes-on-structured-concurrency-or-go-statement-considered-harmful/) is an exciting concept first promoted by the Python community and now gaining traction with Swift and Java. Could this lead to a programming model as dominant as structured programming? Is there an ongoing evolution toward a unified approach to concurrency? If so, there could also be a convergence in the definitions of concurrency.

[![Archaeology of Asynchrony](https://cdn.hashnode.com/res/hashnode/image/upload/v1720083601709/872208b6-f5aa-438a-8aee-0bdbbbc4ca69.png align="center")](https://github.com/StephenCleary/Presentations/blob/main/Why-Async%20(Brief)/Why-Async%20-%2016.9.pptx)

My definition of concurrency is aligned with the current convergence, as it aids in understanding structured concurrency and has proven applicable in various contexts I've encountered, such as distributed systems and even aligns how GitHub actions use [concurrency](https://docs.github.com/en/actions/learn-github-actions/usage-limits-billing-and-administration#usage-limits).

# Conclusion

![](https://www.thinkindependent.com.au/wp-content/uploads/2017/03/Aint-what-you-dont-know-Image-Mark-Twain-1200x480.jpg align="center")

The frequent confusion surrounding concurrency among Software Engineers stems from differing mental models and definitions. Terms like "async" and "parallel" are often used interchangeably, further muddying the waters. Despite a wealth of content and definitions available, a clear, universally accepted explanation remains elusive, often leading to more confusion. Having a solid mental model of the basic concept is key to not getting lost in this already inherently complicated topic.

![Concurrency Mental Model](https://cdn.hashnode.com/res/hashnode/image/upload/v1721204091692/53afe636-2de9-4fff-b11b-ca73065aa11a.png align="center")
