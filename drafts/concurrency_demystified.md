---
title: Demystifying Concurrency
subtitle: Essential Clarifications
domain: software-engineering-corner.hashnode.dev
tags: concurrency, asynchronous, async, multithreading, , opinion-pieces, programming, developer, learning, general-advice, software-development, programming-tips, software-engineering, computer-science
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1720694369664/e0bd2284-3299-4eb9-be39-53646f913361.jpeg?auto=format
publishAs: tiju
hideFromHashnodeCommunity: false
--- 
I often encounter situations where Software Engineers have differing mental models of concurrency. To make matters worse, there are terms that are used (almost) synonymously, like async and parallel. There is a wealth of content and numerous definitions on this topic, but I have yet to find a single explanation or definition that clearly delineates the differences. Most explanations only add to the confusion, and even the best ones remain somewhat unclear.

![concurrency cat](https://cdn.hashnode.com/res/hashnode/image/upload/v1720043156235/4a3cefd6-4d34-47f7-8ad4-9e991bc36525.jpeg align="center")

### Breaking Down the Confusion: Towards a Common Understanding of Concurrency

There are reasons for this confusion. The most important one is probably that there are multiple incompatible mental models and definitions for these terms in different contexts. Regardless of the incompatibility, they get mixed and matched without much thought.

First, it is important to acknowledge that these terms are used in several contexts. It's telling that the Wikipedia pages for [Concurrency (computer science)](https://en.wikipedia.org/wiki/Concurrency_(computer_science)) and [Asynchrony (computer programming)](https://en.wikipedia.org/wiki/Concurrency_(computer_science)) explicitly mention the context of computer science. However, even within computer science, there are different interpretations of concurrency. The most obvious contexts are programming languages and distributed systems. But there are other contexts as well, such as [Asynchronous circuits](https://en.wikipedia.org/wiki/Asynchronous_circuit) and networking.

[![](https://cdn.hashnode.com/res/hashnode/image/upload/v1720597890803/22affb01-7923-487e-961d-4352fb97404c.png align="center")](https://www.youtube.com/watch?v=x-MOtcat1iE)

Many attempts have been made to explain these concepts. A lot of good ones as well. But even when a good one gets attention, like the talk [**Concurrency is not parallelism - The Go Programming Language**](https://go.dev/blog/waza-talk), the misleading parts, such as the confusing title, also seem to stick with the public. In this case it has led many to mistakenly believe that concurrency and parallelism are somehow opposites, which the talk never intended to suggest.

To add to the confusion, some popular sources contradict basic implementations in well-known languages. For example, take this recent video on YouTube:

[![](https://cdn.hashnode.com/res/hashnode/image/upload/v1720600036172/359d125c-aa41-4f08-aeca-2c6bac04639b.png align="center")](https://www.youtube.com/watch?v=RlM9AfWf1WU)

The most confusing and contradictory part is the third card of the preview image, which claims there is parallel computing without concurrency. However, this is exactly the scenario that data structures with the prefix "concurrent" (e.g., [ConcurrentDictionary](https://learn.microsoft.com/en-us/dotnet/api/system.collections.concurrent.concurrentdictionary-2?view=net-8.0) in C# or [ConcurrentHashMap](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ConcurrentHashMap.html) in Java) are optimized for.

![actual_progress](https://imgs.xkcd.com/comics/actual_progress_2x.png align="center")

It does not help that concurrency is inherently a complex topic. Each language, like C#, Java, JavaScript, Python, Rust, and Swift, has its own ways and patterns, which fill entire books. Then there is reactivity, a closely related topic that can be almost as complex as concurrency. Articles like [What the hell is Reactive Programming anyway?](https://dev.to/this-is-learning/what-the-hell-is-reactive-programming-anyway-31p5) with all the references mentioned, show how quickly you get into quite complicated topics. And the equally popular [Reactive Manifesto](https://www.reactivemanifesto.org/) demonstrates that it also extends into the distributed systems realm where the connections to concurrency get more obvious.

All this is unfortunate because having a shared understanding of concurrency is crucial for building stable and efficient software. I hope this article can help create a better common mental model or at least provide something I can reference in future discussions about concurrency. In this article, I want to propose a definition of concurrency specifically in the context of programming languages.

![standards](https://imgs.xkcd.com/comics/standards_2x.png align="center")

Having a solid mental model not only helps in communicating ideas more precisely but more importantly gives you the tools to understand what others are talking about and to identify misunderstandings. I like to think that I found a definition that is close to something like a [least squares](https://en.wikipedia.org/wiki/Least_squares) definition of all the interpretations/definitions around programming. I think I also have found a way to visualize it in an intuitive way. Fortunately, it is also applicable in other contexts I've encountered, such as distributed systems and even everyday tasks.

### [The Evolving Landscape of Concurrency](https://imgs.xkcd.com/comics/standards_2x.png)

One of the best resources I've found so far is the [**Concurrency in C# Cookbook**](https://learning.oreilly.com/library/view/concurrency-in-c/9781492054498/ch01.html#idm45458718736760) by Stephen Cleary. I think C# is uniquely positioned to be a baseline for this topic because it introduced the async/await keywords in a way that has since been adopted by many other languages and significantly shaped our understanding of concurrency. However, other languages are also heavily invested in these patterns and continue to evolve the field. Therefore, I aim to be as language-agnostic as possible in this article.

![async timeline](https://cdn.hashnode.com/res/hashnode/image/upload/v1720084949983/7137b347-2846-458a-8137-d6d04dfbfada.png align="center")

Most popular languages are adopting the async/await model to handle asynchrony, but there's still room for improvement. [**Structured Concurrency**](https://vorpus.org/blog/notes-on-structured-concurrency-or-go-statement-considered-harmful/) is an exciting concept first promoted by the Python community and now gaining traction with Swift and Java. Could this lead to a programming model as dominant as structured programming? Is there an ongoing evolution toward a unified approach to concurrency? If so, there could also be a convergence in the definitions of concurrency.

[![Archaeology of Asynchrony](https://cdn.hashnode.com/res/hashnode/image/upload/v1720083601709/872208b6-f5aa-438a-8aee-0bdbbbc4ca69.png align="center")](https://github.com/StephenCleary/Presentations/blob/main/Why-Async%20(Brief)/Why-Async%20-%2016.9.pptx)

### Defining Concurrency: Methods and Misconceptions

In the [**Concurrency in C# Cookbook**](https://learning.oreilly.com/library/view/concurrency-in-c/9781492054498/ch01.html#idm45458718736760) Stephen Cleary defines concurrency as "Doing more than one thing at a time."

There are multiple ways to achieve this:

* **Multithreading**
    
    Doing lots of work by dividing it up among multiple threads that run concurrently.
    
* **Parallel processing**
    
    Doing lots of work by dividing it up among multiple threads that run concurrently.
    
* **Asynchronous programming**
    
    A form of concurrency that uses futures or callbacks to avoid unnecessary threads.
    
* **Reactive programming**  
    A declarative style of programming where the application reacts to events.
    

![Concurrency Stephen Cleary](https://cdn.hashnode.com/res/hashnode/image/upload/v1720020387249/e5094574-cb02-4c9e-bbfa-21c90527f118.png align="center")

But even this definition has at least two problems. First, it is not clear enough. Second, it includes concepts like reactivity that do not match the level of detail and introduce other topics not closely related to concurrency, making it seem out of place and adding unnecessary complexity.

Defining concurrency seems not to be easy. One reason for this difficulty is the many concepts and approaches related to concurrency, each with different levels of details. These can complicate it even further. Therefore, it's important to use the right scope and level of abstraction when defining these terms.

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

### The Four Quadrants of Concurrency: A Visual Approach

![The Four Quadrants of Concurrency](https://cdn.hashnode.com/res/hashnode/image/upload/v1720521325970/90f2b757-3a2a-4acb-990b-fba36ac69f12.png align="center")

This visualization ist inspired from [Code Wala](https://codewala.net/2015/07/29/concurrency-vs-multi-threading-vs-asynchronous-programming-explained/). To make it clearer I added examples from the article into the quadrants. It's probably a good time to compare it to the visualization by ByteByteGo that I included earlier in this article. It's similar to what they are trying to explain, but it has the advantage of not needing to negate anything and It emphasizes that there are two independent axes in concurrency.

It is crucial to understand that there are four distinct ways that code can be executed based on causality:

1. **Sequential and Synchronous (not Concurrent):** This is the most straightforward method of running code. Tasks are executed one after another, in a specific order. Each task must complete before the next one begins. This is how most people learn to code and how they typically conceptualize program execution. Imagine reading a book, chapter after chapter, without interruption.
    
    ![singlethreaded](https://codewala.net/wp-content/uploads/2015/07/singlethreaded.png align="center")
    
2. **Sequential and Asynchronous (Concurrent):** In this mode, tasks are still executed one after another, but the program can initiate a task and move on to the next one without waiting for the previous task to complete. This allows for more efficient use of time, especially when dealing with I/O-bound tasks. Imagine that while heating up the water, a single person can simultaneously cut the vegetables.
    
    ![async-single](https://codewala.net/wp-content/uploads/2015/07/async-single.png align="center")
    
3. **Parallel and Synchronous (Concurrent):** Here, multiple tasks are executed simultaneously. Each task runs independently at the same time, leveraging parallel processing to complete them faster. This approach is particularly effective for CPU-bound tasks that require significant computational power. Imagine a factory floor where every worker does the same work in parallel.
    
    ![multithreaded](https://codewala.net/wp-content/uploads/2015/07/multithreaded.png align="center")
    
4. **Parallel and Asynchronous (Concurrent):** This method combines the benefits of both parallel and asynchronous execution. Multiple tasks run simultaneously, and within each task, asynchronous operations can occur. This allows for highly efficient handling of both CPU-bound and I/O-bound tasks, optimizing the use of computational resources and time. Imagine a restaurant kitchen where cooks and washers work hand in hand to help each other be more efficient.
    
    ![async-mutlithreaded](https://codewala.net/wp-content/uploads/2015/07/async-mutlithreaded.png align="center")
    

Understanding these different execution modes is crucial for writing efficient and maintainable code, as it helps in selecting the right approach based on the nature of the tasks and the resources available.

![Single Threaded Concurrency?](https://cdn.hashnode.com/res/hashnode/image/upload/v1720048752061/bb0322a4-bd42-4274-aa9c-50846b0561d7.png align="center")

# Conclusion

The frequent confusion surrounding concurrency among Software Engineers stems from differing mental models and definitions. Terms like "async" and "parallel" are often used interchangeably, further muddying the waters. Despite a wealth of content and definitions available, a clear, universally accepted explanation remains elusive, often leading to more confusion. Having a solid mental model of the basic concept is key to not getting lost in this already inherently complicated topic.

![Concurrency Mental Model](https://cdn.hashnode.com/res/hashnode/image/upload/v1720521390262/3cba54bc-1f69-45a4-bf16-f499afaf4b07.png align="center")
