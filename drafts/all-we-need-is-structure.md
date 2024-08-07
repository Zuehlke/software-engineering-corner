---
title: All we need is Structure
subtitle: From Structured Programming to Structured Concurrency
domain: software-engineering-corner.hashnode.dev
tags: concurrency, asynchronous, async, multithreading, , opinion-pieces, programming, developer, learning, general-advice, software-development, programming-tips, software-engineering, computer-science
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1723012260097/450fe6ca-5c33-4335-b594-9cc7d4c3d0fb.jpeg
publishAs: tiju
hideFromHashnodeCommunity: false
saveAsDraft: true
--- 

Do you remember when Dr. Carter, in the previous article "Demystifying Concurrency: Essential Clarifications," explained the difference between `Async` and `Parallel`? I think this story ended before touching on a crucial point. Even if you understand the core concepts and therefore have a better base than most people, it's easy to get into trouble with the implementation details. Like most explanations, it gave the impression that understanding the core concepts would be enough to master concurrency. Most people know this isn't true. But as we already established, it's not easy to **not** get drawn into detailed, complicated rabbit holes that sometimes lead to even more confusion. So, let's dive deeper into the problem and try to find best practices for these issues.

Let's start with the simplest part: the quadrant that does not include concurrency.

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1723017902118/2092e941-9e63-4366-85cf-a7d439d79895.png align="center")

The concepts in this quadrant appear quite familiar. But it is helpful to build a solid foundation once again. What paradigm do we use here? Could this be object-oriented, modular, or functional programming? When we look at the [evolution of paradigms in programming](https://youtu.be/6YbK8o9rZfI?si=jQ1obPkk7b2Kfovn&t=2873), it becomes evident that there is one paradigm that has truly endured and has never been seriously challenged. This paradigm is [structured programming](https://en.wikipedia.org/wiki/Structured_programming).

The principles of structured programming have influenced many modern programming languages, including C, Pascal, and Ada. Even today, the core ideas of structured programming are embedded in the design of contemporary languages and continue to [guide best practices in software development](https://www.youtube.com/watch?v=SFv8Wm2HdNM). One of the main benefits of this pattern is that we can be sure Task 1 does not interfere with Task 2 and can therefore be considered completely isolated. This reduces the mental load significantly in all stages of the program lifecycle.

The first quadrant that is concerned with concurrency is the one that is concerned with multiple tasks running in parallel.

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1723019340446/6579d2d3-9bf8-4434-8cb1-1a6965b962b3.png align="center")

Definitions for [Parallel computing](https://en.wikipedia.org/wiki/Parallel_computing) are not that controversial and generally consistent. There are also well-established patterns for the synchronous part of parallel execution, such as [Data-Parallelism](https://en.wikipedia.org/wiki/Data_parallelism), which have been proven effective, like PLinq in C# or [MapReduce](https://en.wikipedia.org/wiki/MapReduce) to keep it more general. [Single instruction, multiple data (SIMD)](https://en.wikipedia.org/wiki/Single_instruction,_multiple_data) is another method to achieve Data-Parallelism. Also, the techniques for executing code on the GPU are well-established and work effectively, as evidenced by Nvidia's success with Cuda in AI applications. It is well understood and reasonably intuitive what this means and why it's challenging. Having a focus on strict Data Partitioning also allows us to reason about these Tasks in Isolation and keep the non-concurrent mental model that we are used to, keeping the complexity at a reasonable level.

The next quadrant is the one that is concerned with multiple Tasks running in a time-shared fashion, also called [cooperative multitasking](https://en.wikipedia.org/wiki/Cooperative_multitasking#:~:text=Cooperative%20multitasking%2C%20also%20known%20as%20non-preemptive%20multitasking%2C%20is,switch%20from%20a%20running%20process%20to%20another%20process.).

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1723020218472/be75aef6-4c18-4a07-97be-c5f0cb2d8e28.png align="center")

It looks like programming languages are converging on the async/await pattern for handling idle time. Even new experimental languages like [Roc](https://www.roc-lang.org/tutorial#the-!-suffix) and [Gleam](https://hexdocs.pm/gleam_otp/gleam/otp/task.html#await) are adopting and improving this pattern.

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1723021084216/4c4b43ab-c75b-4a2d-a783-7176f515886c.png align="center")

The async/await approach is clearly optimized for **Sequential and Asynchronous** code execution.

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1723021166295/d23e396c-949a-47da-ac93-35e62a46dff8.webp align="center")

But not everyone is happy with this approach. Languages like Verse introduce the concept of [time flow](https://dev.epicgames.com/documentation/en-us/uefn/concurrency-in-verse) to address this problem by treating it as a special case of the larger async realm. So let's see how this evolves. But at the moment, it is the current best practice for handling idle time. Like Cory Benfield in [The Function Colour Myth](https://lukasa.co.uk/2016/07/The_Function_Colour_Myth/), I would also argue that the benefits outweigh the drawbacks of this approach. It lets you think of time-shared concurrency as [Data-Parallelism](https://en.wikipedia.org/wiki/Data_parallelism). Most commonly, this is the case in node web servers where everything runs single-threaded but idle time can be used by other tasks. There are quite good explanations that showcase how this works with a (Micro)[Task Queue](https://www.lydiahallie.com/blog/event-loop#Microtask%20Queue:~:text=a%20refresher!-,Microtask%20Queue,-Most%20(modern)). The most important part of all of this is that it allows us to reason about these tasks in isolation and keep the non-concurrent mental model that we are used to, keeping the complexity of the necessary mental model at a reasonable level.

You probably spotted the pattern. The goal is always to structure the concurrency in a way that allows us to isolate the data and execution. So let's discuss the last quadrant:

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1723023230934/595b57a6-76f6-45ba-a665-96134ad10fa2.png align="center")

This part is often ignored or forgotten, probably because no one has used this visualization to explain it until now 😉. For the parallel async part of concurrency, there doesn't seem to be a clear standard. This is partly why Go was invented, and why people like [Mads Torgersen, Lead Designer of C#](https://www.youtube.com/watch?v=Nuw3afaXLUc&t=4402s), say things like:

> The world is still short on languages that deal super elegantly and inherently and intuitively with concurrency

There are certainly approaches: Go has [Goroutines](https://golangdocs.com/goroutines-in-golang), a variation of [Coroutines](https://en.wikipedia.org/wiki/Coroutine) available in many other programming languages. A similar pattern was explored in Java and other languages with [Green Threads](https://en.wikipedia.org/wiki/Green_thread). Thread and process-based concurrency provided directly by the operating system is also widely used. Additionally, the [Actor Model](https://en.wikipedia.org/wiki/Actor_model) is implemented by many libraries. But none of them seem to be the unified approach that can handle it really well.

Recently, a new pattern called [Structured Concurrency](https://en.wikipedia.org/wiki/Structured_concurrency) emerged, first introduced in the Python community with [Trio](https://github.com/python-trio/trio). It was almost independently adopted by [Kotlin](https://kotlinlang.org/docs/coroutines-basics.html#structured-concurrency) and, since [Java 21](https://docs.oracle.com/en/java/javase/21/core/structured-concurrency.html#GUID-AA992944-AABA-4CBC-8039-DE5E17DE86DB), also in the main JVM language. Swift seems to put the most effort into it by trying to get the most out of this model, extending it with [Actors](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/concurrency/#Actors) and [Sendable Types](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/concurrency/#Sendable-Types).

An easy-to-understand explanation of the basic Idea can be found [here](https://steven-giesel.com/blogPost/59e57336-7c73-472f-a781-b0b79f0d47ad). It essentially extends the async/await pattern to work for parallel tasks. It improves cancellation, error handling, and shared resource management for concurrent tasks, and also improves readability, productivity, and correctness. The most beneficial part is probably the ability to check correctness at compile time. Swift is even working to extend this pattern to ensure [data-race safety](https://www.swift.org/documentation/concurrency/). There are also libraries in other languages, such as [StephenCleary/StructuredConcurrency](https://github.com/StephenCleary/StructuredConcurrency), created by one of the key figures in the concurrency field.

As already mentioned Verse introduces the concept of [time flow](https://dev.epicgames.com/documentation/en-us/uefn/concurrency-in-verse) to implement [Structured Concurrency](https://dev.epicgames.com/documentation/en-us/uefn/concurrency-overview-in-verse#structuredconcurrency). This is controlled with concurrent expressions like [Sync](https://dev.epicgames.com/documentation/en-us/uefn/sync-in-verse), [Race](https://dev.epicgames.com/documentation/en-us/uefn/race-in-verse), [Branch](https://dev.epicgames.com/documentation/en-us/uefn/branch-in-verse), etc. This is similar to structured flow control such as `block`, `if`, `for`, and `loop` that constrain to their associated [scope](https://dev.epicgames.com/documentation/en-us/uefn/verse-glossary#scope). Similarly, in Swift, [async/await is also a special case of Structured Concurrency](https://www.hackingwithswift.com/swift/5.5/structured-concurrency) as long as it is used within an async context like a task group or with [async let bindings](https://www.hackingwithswift.com/swift/5.5/async-let-bindings). I would argue that async/await is not generally a special case of Structured Concurrency because both Swift and Verse have the notion of [Unstructured Concurrency](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/concurrency#Unstructured-Concurrency). Most programming languages decided to implement async/await by default as Unstructured Concurrency; therefore, I like to think about it as a separate concept.

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1721947148234/0c2bcec7-83c8-439a-b320-76209630fb7a.png align="center")

In most cases, it's beneficial when patterns converge, as it reduces misunderstandings and provides a shared, commonly accepted definition of terms. This clarity makes it easier to discuss important aspects and make informed decisions, including knowing what not to do. I want to emphasize that these approaches are not the only ways to handle concurrency—just as "goto" statements still exist and are used in modern languages like C#. This overview aims to highlight the current practices in handling concurrency.

Keep in mind: concurrency should not be overused. If you constantly have to think about concurrency while writing or reading your code, you either have a very difficult problem and know exactly what you're doing, or you should reconsider your design. This article aims to help you understand where the benefits of these patterns are most significant. It does not mean they are the only correct solution in those cases!

> Making trade offs well is one of the skills of being a programmer, and we should inform our community about that trade off, and then trust them to make the right call.

[Cory Benfield](https://lukasa.co.uk/2016/07/The_Function_Colour_Myth/)
