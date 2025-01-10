---
title: Introducing Pair Programming to a Skeptical Team
domain: software-engineering-corner.hashnode.dev
tags: pair-programming
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1736502832866/Kw5q3_iWZ.jpg?auto=format
publishAs: KevZ
hideFromHashnodeCommunity: false
saveAsDraft: true
---

Last year, I joined a client's team of highly skilled and dedicated Java engineers.
The team managed a complex event-driven system with a long history of changing requirements.
The original engineers were long gone, making the code difficult to maintain and change.
Deadlines were tight, and we needed to deliver new features fast.

The client hired Zühlke to provide additional engineering muscle and expertise to the team.
The domain and business rules were complex and catered for many edge cases.
Most of the knowledge lived in people's heads, and the documentation was minimal.
The team extensively tested each microservice using BDD-style tests, but running hundreds of tests took a long time.
Given the system's complexity, building a mental model of the microservices and their interactions was difficult and took a lot of time.

The team mostly worked independently on their respective JIRA tickets and followed a rigorous pull request (PR) review process.
After completing their task, each engineer created a PR.
Two or more team members would then review the PR, thoroughly checking the code for bugs, code style violations, and potential performance impacts.
Reviewers would leave detailed comments and suggestions.
After addressing the comments and feedback, the engineer would resubmit the PR and await further comments or approval.
The engineer could merge the change into the main branch only after meeting all the team's standards, passing all the tests, and resolving all feedback and comments.

This process could take significant time due to the waiting period for feedback and the back-and-forth needed for the final approval.
Everyone on the team was extremely helpful and would try to help if a colleague got stuck on their respective ticket, but the collaboration was ad hoc, and progress felt slow.

In one of our retrospectives, I suggested trialling pair programming for the upcoming Sprint to speed up the code review process, deliver more functionality, and meet our tight deadlines.
Pair programming involves two engineers working together on the same task, one writing the code and the other reviewing it in real-time.

The [State of DevOps Report 2023](https://dora.dev/research/2023/dora-report/) agrees:

_"Teams with shorter code review times have 50% better software delivery performance. Efficient code review processes lead to code improvements, knowledge transfer, shared code ownership, team ownership, and transparency. [...] Pair programming is a practice that can reduce your code review time regardless of your current architecture and integration practices."_

Unfortunately, the team met my idea with scepticism, which is understandable given the established ways of working.
However, we all agreed to try something new.

## Overcoming common misconceptions about pair programming

Before introducing pair programming to the team, I needed to address some of the team's misconceptions about pair programming.
In my experience, they tend to be a variation of the following three statements: 

1. Pair programming is inefficient and costly.
1. I have tried pair programming before, but I didn't like it.
1. I need time to think on my own, and I can't possibly write code with another person at the same time.

While pair programming is not the cheapest way to make software, it is cost-effective.
At its core, pair programming is flow-centric—you optimise things to finish features quicker rather than get them done cheaper.
A lot of software falls into this category, making pair programming a cost-effective solution (Pearl, 2018).
On the other hand, when you work resource-efficiently, you get the most skilled person for the specific tasks; this creates experts and bottlenecks.

If someone has tried pair programming before and doesn't like it, listening to their concerns and understanding what they don't like is essential.
Pairing is a skill that requires practice and experimentation to discover what works best for you.

Pair programming doesn't mean you must spend every minute of every day with your pair.
Allowing space to think or do individual research is all part of the process.
Once you feel comfortable, you can reconvene and continue working as a pair.

Of course, there are many more challenges, such as different skill levels, power dynamics, and poor tooling.
To tackle these challenges, I recommend reading [Martin Fowler's blog post - On Pairing](https://martinfowler.com/articles/on-pair-programming.html#Challenges).

With all the best intentions, I couldn't convince the whole team of the benefits of pair programming, and that's fine, too.
Whatever you do, don't force colleagues to participate.
It's a recipe for disaster.

## First steps and a pair programming etiquette

It's a good idea to start small.
We quickly found a Sprint ticket that we could work on together.
I recommend a small ticket with well-understood requirements and scope that the current system can easily support.
Before we started our first pairing session, we agreed to the following etiquette:

* Ask for a break if you feel tired.
* Suggest a break if you notice your partner is tired.
* Stop if you're both lost. Reconvene when one or both have gathered enough information to proceed.
* Stop if one party is not engaged. If possible, tell or ask why.
* Schedule regular checkpoints for possible breaks/micro retros.

Establishing a pair programming etiquette helps set clear expectations and guidelines for collaboration.
It enables smooth communication, mutual respect, and a productive working environment.
Ideally, you'll develop your own etiquette and share it more widely among the team.

With an etiquette established, it was time to discuss how we wanted to approach the ticket's requirement.
Do we understand the requirements?
Do we need to do some tidying before implementing the necessary change?
Is there an existing pattern in the codebase we can follow?
Can we write a failing test? Sometimes, I like to write a little to-do list in a text editor so we don't lose track of all the steps.

Once we've agreed on the overall approach, the next step is deciding how to structure our first pairing session.
We can try a few styles, such as Unstructured, Ping-Pong, Driver-Navigator, or my favourite, Driver-Navigator in Strong Style (Böckeler, 2020).
There is no right or wrong answer; you should experiment with what style works best for you and your colleague.
You can vary the style between pairs, or even depending on today's mood.
It's essential to have an open mind and the willingness to experiment.

Our first pairing session was a success, and we felt confident that we had met all the ticket requirements, adhered to all the team's coding standards, learnt something new, and were ready to raise the PR. 

We agreed with the tech lead beforehand that we still needed an independent review on the PR, but we reduced the number from 2 to 1.
The PR had fewer comments than usual and went to the main branch without much back-and-forth.

After this positive experience, I repeated the above steps with other team members.
The feedback was positive, and the team started pairing more over the next few weeks and months - most of the team, but not everyone.

## Measuring success

How to measure success is an important question and something most managers and tech leads want to know, so set the expectations up front: you will not be able to measure the success of pairing by measuring the short-term "velocity" of the team (Pearl, 2018).

Unfortunately, the problems that pair programming solves are complex and, therefore, difficult to measure.
In our case, less experienced team members learnt more, and features written as a pair spent less time in code review.
As a result, the feature can be merged into the main branch more quickly.

Keeping a log book of your wins while pairing can be useful, especially at the beginning of your pair programming journey.
For example, store daily events with specific dates of things you want to look out for, such as knowledge share opportunities, quality issues discovered, etc.

## Conclusion

Introducing pair programming was challenging.
The team was sceptical at first, which made sense, given their established ways of working.
Also, it's important to recognise that pairing requires vulnerability.
Showing vulnerability requires courage and creating an environment where people feel safe to show their vulnerability. Listening, showing empathy, starting small, and being a role model will help you overcome these challenges.

Establishing a shared pairing etiquette with the team, containing clear rules and expectations, helped us get started and removed some of the worry.

Keeping track of the pairing wins helps convince other sceptical parties outside the team and allows the team to share uncovered knowledge in team-wide sessions.

Ultimately, the team successfully met all deadlines, delivering the features on time.
Pairing helped us share knowledge, reduce delays in code reviews, and build stronger teamwork.
Not everyone embraced it, and that's okay. But for many, it made a real difference.

## References

* Pearl, M. (2018). Code with the Wisdom of the Crowd. Pragmatic Bookshelf.
* Böckeler, B and Siessegger N. (2020) On pair programming. Available at: https://martinfowler.com/articles/on-pair-programming.html.
