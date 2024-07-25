---
title: Navigating the Evolving Landscape of Concurrency
subtitle: From async/await to Structured Concurrency
domain: software-engineering-corner.hashnode.dev
tags: concurrency, asynchronous, async, multithreading, , opinion-pieces, programming, developer, learning, general-advice, software-development, programming-tips, software-engineering, computer-science
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1721214396092/931726f8-75c0-4f90-b985-2cfdc637c11c.jpeg
publishAs: tiju
hideFromHashnodeCommunity: false
saveAsDraft: true
--- 

As described in Demystifying Concurrency: Essential Clarifications, concurrency is evolving. It is clear that programming languages are converging on the async/await pattern for handling idle time. Even new experimental languages like [Roc](https://www.roc-lang.org/tutorial#the-!-suffix) and [Gleam](https://hexdocs.pm/gleam_otp/gleam/otp/task.html#await) are adopting and improving this pattern.

![async timeline](https://cdn.hashnode.com/res/hashnode/image/upload/v1720084949983/7137b347-2846-458a-8137-d6d04dfbfada.png align="center")

The async/await approach is clearly optimized for **Sequential and Asynchronous** code execution. Articles like [The Function Colour Myth](https://lukasa.co.uk/2016/07/The_Function_Colour_Myth/) explore the benefits and drawbacks in detail. So, I would argue it is best suited for problems in the Top/Left domain of concurrency.

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1721944095076/1db693ee-c30f-4a61-80fe-f9e0400ca8be.png align="center")

Definitions for [Parallel computing](https://en.wikipedia.org/wiki/Parallel_computing) are not that controvercial and generally consistent. There are also well-established patterns for the synchronous part of parallel execution, such as [Data-Parallelism](https://en.wikipedia.org/wiki/Data_parallelism), which have been proven effective, like PLinq in C#. [Single instruction, multiple data (SIMD)](https://en.wikipedia.org/wiki/Single_instruction,_multiple_data) is another method to achieve Data-Parallelism. Also the techniques for executing code on the GPU are well-established and work effectively, as evidenced by Nvidia's success with Cuda in AI applications. It is well understood and reasonably intuitive what this means and why it's challenging. So I would like to put it in the Bottom/Right domain of concurrency.

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1721945066057/c391c792-e00d-432c-a02f-45e8d6dfa7af.png align="center")

There are still two quadrants left in this visualization. Let's first examine the simpler one. This quadrant appears quite familiar, but what paradigm do we use here? Could it be object-oriented, modular, or functional programming? When we look at the [evolution of paradigms in programming](https://youtu.be/6YbK8o9rZfI?si=jQ1obPkk7b2Kfovn&t=2873), it becomes evident that there is one paradigm that has truly endured and has never been seriously challenged. This paradigm is [structured programming](https://en.wikipedia.org/wiki/Structured_programming).

The principles of structured programming have influenced many modern programming languages, including C, Pascal, and Ada. Even today, the core ideas of structured programming are embedded in the design of contemporary languages and continue to guide best practices in software development.

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1721946298556/3f7a481d-5340-49c3-8492-0bce62ceb295.png align="center")

That brings us to the last area we haven't discussed yet. This part is often ignored or forgotten, probably because no one has used this visualization to explain it until now 😉. For the parallel async part of concurrency, there doesn't seem to be a clear standard. This is partly why Go was invented, and why people like [Mads Torgersen, Lead Designer of C#](https://www.youtube.com/watch?v=Nuw3afaXLUc&t=4402s), say things like:

> The world is still short on languages that deal super elegantly and inherently and intuitively with concurrency

There are certainly approaches: Go has [Goroutines](https://golangdocs.com/goroutines-in-golang), a variation of [Coroutines](https://en.wikipedia.org/wiki/Coroutine) available in many other programming languages. A similar pattern was explored in Java and other languages with [Green Threads](https://en.wikipedia.org/wiki/Green_thread). Thread and process-based concurrency provided directly by the operating system is also widely used. Additionally, the [Actor Model](https://en.wikipedia.org/wiki/Actor_model) is implemented by many libraries. But non of them seem to be the unified approach that can handle it really well.

[https://www.youtube.com/watch?v=SFv8Wm2HdNM](https://www.youtube.com/watch?v=SFv8Wm2HdNM)

Recently, a new pattern called [Structured Concurrency](https://en.wikipedia.org/wiki/Structured_concurrency) emerged, first introduced in the Python community with [Trio](https://github.com/python-trio/trio). It was almost independently adopted by [Kotlin](https://kotlinlang.org/docs/coroutines-basics.html#structured-concurrency) and, since [Java 21](https://docs.oracle.com/en/java/javase/21/core/structured-concurrency.html#GUID-AA992944-AABA-4CBC-8039-DE5E17DE86DB), also in the main JVM language. Swift seems to put the most effort into it by trying to get the most out of this model, extending it with [Actors](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/concurrency/#Actors) and [Sendable Types](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/concurrency/#Sendable-Types).

An easy-to-understand explanation of the basic pattern can be found [here](https://steven-giesel.com/blogPost/59e57336-7c73-472f-a781-b0b79f0d47ad). It essentially extends the async/await pattern to work for parallel tasks. It improves cancellation, error handling, and shared resource management for concurrent tasks, and also improves readability, productivity, and correctness. Swift is working to extend this pattern to ensure [data-race safety](https://www.swift.org/documentation/concurrency/). There are also libraries in other languages, such as [StephenCleary/StructuredConcurrency](https://github.com/StephenCleary/StructuredConcurrency), created by one of the key figures in the concurrency field.

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1721947148234/0c2bcec7-83c8-439a-b320-76209630fb7a.png align="center")

For most cases it's beneficial when patterns converge. There is less room for misunderstanding, and having a shared, commonly accepted definition for these terms makes it easier to discuss important aspects. Having a clear understanding allows you to make informed decisions also about what not to do.

Keep in mind: concurrency should not be overused. If you constantly have to think about concurrency while writing or reading your code, you either have a very difficult problem and know exactly what you're doing, or you should reconsider your design. This article aims to help you understand where the benefits of these patterns are most significant. It does not mean they are the only correct solution in those cases!

> Making trade offs well is one of the skills of being a programmer, and we should inform our community about that trade off, and then trust them to make the right call.

[Cory Benfield](https://lukasa.co.uk/2016/07/The_Function_Colour_Myth/)