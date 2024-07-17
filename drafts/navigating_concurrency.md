---
title: Navigating the Evolving Landscape of Concurrency
subtitle: From async/await to Structured Concurrency
domain: software-engineering-corner.hashnode.dev
tags: concurrency, asynchronous, async, multithreading, , opinion-pieces, programming, developer, learning, general-advice, software-development, programming-tips, software-engineering, computer-science
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1720694369664/e0bd2284-3299-4eb9-be39-53646f913361.jpeg?auto=format
publishAs: tiju
hideFromHashnodeCommunity: false
--- 

As described in Demystifying Concurrency: Essential Clarifications, concurrency is evolving. It is clear that programming languages are converging on the async/await Task-based pattern for handling idle time. Even new experimental languages like [Roc](https://www.roc-lang.org/tutorial#the-!-suffix) and [Gleam](https://hexdocs.pm/gleam_otp/gleam/otp/task.html#await) are adopting and improving this pattern.

![async timeline](https://cdn.hashnode.com/res/hashnode/image/upload/v1720084949983/7137b347-2846-458a-8137-d6d04dfbfada.png align="center")

The async/await approach is optimized for the sequential part of asynchronous code execution. Articles like [The Function Colour Myth](https://lukasa.co.uk/2016/07/The_Function_Colour_Myth/) explore the benefits and drawbacks in detail. However, they often overlook the parallel aspect of concurrency.

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1721204475980/829b0131-3f59-44b7-88bc-3229259318b8.png align="center")

One reason for this oversight is that the definitions for [Parallel computing](https://en.wikipedia.org/wiki/Parallel_computing) are generally consistent. There are also well-established patterns for the synchronous part of parallel execution, such as [Data-Parallelism](https://en.wikipedia.org/wiki/Data_parallelism), which have been proven effective, like PLinq in C#. [Single instruction, multiple data (SIMD)](https://en.wikipedia.org/wiki/Single_instruction,_multiple_data) is another method to achieve Data-Parallelism. Also the techniques for executing code on the GPU are well-established and work effectively, as evidenced by Nvidia's success with Cuda in AI applications. It is well understood and reasonably intuitive what this means and why it's challenging.

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1721204331690/62975fa1-a6f1-4dba-ab06-db6c1a5defba.png align="center")

But when it comes to concurrency, there's one more area we haven't discussed yet. This part is often ignored or forgotten, likely because no one has used this visualization to explain it until now 😉. For the parallel async part of concurrency, there doesn't seem to be a clear standard. There are certainly approaches: Go has [Goroutines](https://golangdocs.com/goroutines-in-golang), a variation of [Coroutines](https://en.wikipedia.org/wiki/Coroutine) available in many other programming languages. A similar pattern is explored in Java and other languages with [Green Threads](https://en.wikipedia.org/wiki/Green_thread). Thread and process-based concurrency provided directly by the operating system is also widely used. Additionally, the [Actor Model](https://en.wikipedia.org/wiki/Actor_model) is implemented by many libraries. But non of them seem to be the unified approach that can handle it really well.

> "The world is still short on languages that deal super elegantly and inherently and intuitively with concurrency" Mads Torgersen Lead Designer of C# ([https://www.youtube.com/watch?v=Nuw3afaXLUc&t=4402s](https://www.youtube.com/watch?v=Nuw3afaXLUc&t=4402s))

Recently, a new pattern called [Structured Concurrency](https://en.wikipedia.org/wiki/Structured_concurrency) emerged, first introduced in the Python community with [Trio](https://github.com/python-trio/trio). It was almost independently adopted by [Kotlin](https://kotlinlang.org/docs/coroutines-basics.html#structured-concurrency) and, since [Java 21](https://docs.oracle.com/en/java/javase/21/core/structured-concurrency.html#GUID-AA992944-AABA-4CBC-8039-DE5E17DE86DB), also in the main JVM language. Swift seems to put the most effort into it by trying to get the most out of this model, extending it with [Actors](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/concurrency/#Actors) and [Sendable Types](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/concurrency/#Sendable-Types).

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1721204374778/9bd5643c-3f8d-4dbf-ab9a-ffa1b7817cd4.png align="center")

An easy-to-understand explanation of the basic pattern can be found [here](https://steven-giesel.com/blogPost/59e57336-7c73-472f-a781-b0b79f0d47ad). It essentially extends the async/await pattern to work for parallel tasks. It improves cancellation, error handling, and shared resource management for concurrent tasks, and also improves readability, productivity, and correctness. Swift is working to extend this pattern to ensure [data-race safety](https://www.swift.org/documentation/concurrency/). There are also libraries in other languages, such as [StephenCleary/StructuredConcurrency](https://github.com/StephenCleary/StructuredConcurrency), created by one of the key figures in the concurrency field.

Concurrency should not be overused. If you constantly have to think about concurrency while writing your code, you should reconsider your design and focus more on architecture. That's why it's beneficial when patterns converge. There is less room for misunderstanding, and having a shared, commonly accepted definition for these terms makes it easier to discuss important aspects. Premature optimization can lead to overly complex solutions for problems that do not need them. Nonetheless, having a clear understanding allows you to make informed decisions also about what to ignore.

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1721204510719/97d9c317-e99b-4cd9-a672-bde947a68640.png align="center")
