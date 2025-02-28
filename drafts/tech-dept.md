---
title: Technical debts are fun
subtitle: Keeping your HTTP stack easy to maintain
domain: software-engineering-corner.hashnode.dev
tags: kotlin, mobile, android, ios, kmp, kmm, kotlin-multiplatform, ktor, networking, http, testing, mocking
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1732552346062/ykEYfmZW2.jpg?auto=format
publishAs: mohsenr
hideFromHashnodeCommunity: false
saveAsDraft: true
---

[//remove me]: # ( https://miro.com/app/board/uXjVIYkz16U=/?share_link_id=497027063057)

# What is Technical Debt?

Imagine this: You're on a tight deadline and take a shortcuts in your code.
Few months later, bugs occurred, slowed down development and requires urgent fixes.
This is called technical debt.

> Basically, Technical debt occurs when a unit of work is inefficient, not scalable, or difficult to
> test. It often results from rushed development, outdated technologies, or poorly structured
> processes.
> While taking shortcuts can speed up delivery, it often leads to higher costs in the long run,
> making maintenance harder and development slower.

## Types of Technical Debt
Having a look at a software-oriented company, technical debt can be categorized as:

### 📃 **Documentation Debt**

> **Outdated, missing, or unclear documentation**, making it harder for teams to onboard or maintain
> systems.

### 🐛 **Code Debt**

> **Poorly written, inefficient, or not scalable code** that is difficult to maintain or extend

### 🧱 **Architecture Debt**

> **Badly designed software components**, lack of modularization, and poor scalability, leading to
> performance and availability issues

### 🏰 **Infrastructure Debt**

> **Outdated technologies** and tools that hinder adoption of modern best practices, forcing developers
> to "**reinvent the wheel**."

### 🔃 **Process Debt**

> **Inefficient, unclear, or overly bureaucratic workflows** that slow down development and introduce
> unnecessary manual steps.

### 🧪 **Testing Debt**

> **Lack of automated testing**, leading to reliance on manual testing, which slows down releases and
> increases the risk of bugs.

## Potential Causes
Such Technical debt doesn’t appear out of nowhere—it’s usually caused by:
- 📈 **Rapidly changing business** requirements that force teams to adapt quickly, often at the cost
  of
  technical quality.
- 📆 **Tight deadlines** that encourage shortcuts, accumulating technical debt over time.
- 💰 **Limited budgets** that put teams under pressure, causing rushed development and fewer
  automated tests.
- 🌬️ **Lack of understanding** in best practices or future-proof designs.
- ☹️ **Poor** or missing code **reviews**.
- ⛔ **Bypassing code reviews** and resisting necessary changes.

When discussing technical debt with different roles in an agile team, each will have a unique
perspective on its impact and priority.

## PO View

If you ask a Product Owner (PO) about technical debt, their response will likely focus on time,
priority, and business impact rather than technical details.

Common reactions include:

- *"How much time do you need to resolve it?"* (Concerned about **effort and impact** on delivery.)
- *"Is it really necessary right now?"* (**Balancing priorities** between features and tech debt.)
- *"Make it visible to the team and refine it ASAP."* (**Encouraging the team** to track and prioritize
  it
  in backlog refinements.)
- 🚨 *"I don’t care!"* (If the debt isn’t visibly affecting business value, it **might not seem
  urgent**.)

> 💡 **Key takeaway:** POs often focus on business value and delivery speed. To gain their buy-in, it’s
crucial to quantify the impact of technical debt in terms of lost efficiency, risk, and long-term
costs.

## Lead View

A Lead Architect is primarily concerned with the long-term stability, scalability, and risks of
unresolved technical debt. Their focus is on preventing bottlenecks that could harm future
development.

- *"Yes, let's make it visible to the team!"* (Ensuring **transparency and accountability**.)
- *"I’ve already designed the architecture for how it should be."* (Taking a **proactive** approach.)
- *"Who is interested in designing the architecture?"* (Encouraging **collaboration and mentorship**.)
- *"I will convince the PO to prioritize resolving tech debt in an upcoming sprint."* (Aligning
  **technical needs with business priorities**.)
- 🚨 *A bad architect:* **Doesn’t** even **recognize** technical debt or, worse, **doesn’t care** about it.

> 💡 **Key takeaway:** Great architects proactively manage technical debt and advocate for long-term
solutions. If a PO needs convincing, the Lead Architect often plays a key role in making the
business case.

## Developer View

From a developer's perspective, technical debt awareness depends on two key factors:

- **Experience** – More experienced developers recognize tech debt and its consequences.
- **Willingness to address it** – Some developers raise concerns, while others ignore them due to
  pressure or lack of motivation.

Since developers often work under tight deadlines, they may take shortcuts that unintentionally
introduce technical debt.

### ⚖️ The Pragmatic Developer (Balances Priorities)

- *"This code is messy, but we don’t have time for a full refactor. I’ll leave a TODO and fix it
  later."*
- *"I know this is not the best solution, but it works for now."*
- *"Let’s at least document this workaround so future devs don’t get stuck."*
- *"We should track this in our backlog, but I doubt it’ll ever get prioritized."*

> 💡 **Key Trait:** Finds a balance between short-term delivery and long-term maintainability.

### 😖 The Frustrated Developer (Wants to Fix Tech Debt but Feels Stuck)

- "Why are we still using this outdated framework?"
- "If only we had time, I could clean up this spaghetti code..."
- "I don’t want to touch this module—every change breaks something."
- "Every bug fix here takes forever because of tech debt."
>  💡 Key Trait: Understands the pain of tech debt but may feel powerless to address it.

### 🙃 The Careless Developer (Ignores or Contributes to Tech Debt)

- "Let’s just copy-paste this code instead of refactoring."
- "Tests? Who needs them? It works on my machine!" 🚀🔥
- "I’ll just comment this out instead of deleting it."
>  💡 Key Trait: Prioritizes speed over quality, often leading to long-term problems.

### 🥳 The Proactive Developer (Reduces Tech Debt Because It’s Fun!)

- "Let’s refactor this while we’re already working in this area."
- "I’ll write a quick test to make sure this doesn’t break later."
- "We should automate this process instead of doing it manually every time."
- "I’ll bring this up in the next sprint planning so we can allocate time to fix it."

>💡 Key Trait: Enjoys making code better and invests in maintainability, automation, and long-term
efficiency—all while having fun! 🎉

Yes, resolving technical debt can be satisfying — as long as new debt isn't constantly introduced. 

🚀 How does your team deal with technical debt? </br>
📥 Share your experiences in the comments! </br>
🗣️ Let’s discuss how we can make codebases more maintainable. </br>

<hr>

- [1] https://patternica.com/blog/how-to-reduce-technical-debt
- [2] https://martinfowler.com/bliki/TechnicalDebtQuadrant.html
- [3] https://martinfowler.com/bliki/TechnicalDebt.html
- [4] https://www.machonedigital.com/blog/3-main-types-of-technical-debt-and-how-to-manage-them
- [5] https://www.linkedin.com/pulse/architects-role-identifying-technical-debt-across-systems-9ouje/
- [6] https://www.scalablepath.com/project-management/technical-debt
- [7] https://www.reddit.com/r/ExperiencedDevs/comments/uemf4v/how_to_keep_up_with_technical_debt_when_po_is/_
- [8] https://chatgpt.com/