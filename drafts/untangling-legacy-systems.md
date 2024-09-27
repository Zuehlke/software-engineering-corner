---
title: Untangling Legacy Systems
domain: software-engineering-corner.hashnode.dev
tags: legacy,legacy-systems,legacy-app-modernization
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1727431394860/XZ6VWy5WU.jpg?auto=format
publishAs: KevZ
hideFromHashnodeCommunity: false
saveAsDraft: true
---
Whether you're tasked with updating functionality, improving performance, migrating to new technologies, or simply trying to understand an undocumented system for maintenance, dealing with legacy systems is an inevitable challenge in the software industry.

Dealing with outdated software and legacy systems can make you feel as though you've been thrust into a pit of snakes, much like Indiana Jones in the Raiders of the Lost Ark. "*Snakes. Why did it have to be snakes?*"

## What's a legacy system anyway?

You most likely think of decade old machines running in someone’s basement or a long forgotten machine under a colleague’s desk.
While this is certainly true, not all legacy systems are the same. Sometimes, systems can become legacy without any fault of their own. 

There are internal and external factors that can contribute to a system becoming “legacy”:

* changing business needs
* absence of vendor support
* changing user expectations 
* departure of the initial team that developed the software

To ensure a successful transformation, it's crucial to establish a shared vision and align on common objectives from the outset.
The focus might vary across stakeholders, but potential areas of focus include expanding functionality, reducing cost, increasing scalability, reliability, maintainability, agility, flexibility, security, or stability.
However, before you can have any meaningful input into the roadmap, you’ll need a better understanding of your legacy system.

## Practical tips to better understand your legacy system

### Be clear about what you’re trying to discover

Unlike our archaeological hero who makes it up as he goes along it’s important to first understand what you are trying to discover.

The essential information you are trying to discover will likely be:

* original requirements, including how and why they have evolved over the lifecycle of the system
* architecture details
* performance constraints
* build and deploy process and code metrics

At this point, it might be worth starting a glossary and documenting any acronyms or domain knowledge/terms you come across.

### Document what you find

Before creating new documentation, start by searching through existing resources like Confluence and SharePoint for any available documentation on the legacy system.
This can provide valuable insights and save time in your discovery process.

In my experience, an effective approach is to continuously draw and update diagrams of the system's architecture as you uncover more information.
The C4 model is well-suited for this task, as it allows you to represent the legacy system at various levels of detail, from high-level context down to individual code components.
The C4 model is an easy to learn, developer-friendly approach to software architecture diagramming.
I'm also a big fan of diagram as code, and tools such as Structurizr will help you get started easily.
The diagram will also be invaluable later on, when you start speaking to developers, architects, and subject matter experts as you dig deeper.

As you document the architecture, you may uncover other systems that couple with your legacy system and play essential roles in its functionality.

Like documenting the overall architecture of the system, I find documenting the interactions between systems using a sequence diagram one of the most effective ways to understand and communicate the inner workings of a system to a wider audience.
D2, Mermaid or PlantUML are great tools to create diagrams as code.

### Explore the source code

After you’ve drawn some C4 architecture diagrams and understand at a high level how the legacy system works it might be time to get your hands on the source code and hopefully the version control history.
This is the first opportunity for you to measure the quality of software by counting the [WTF per minute](https://web.archive.org/web/20090301090433/https:/www.codinghorror.com/blog/archives/001229.html) you’re muttering to yourself in disbelief whilst trying to make sense of it all. 

Joking aside, it’s important to keep an open mind and understand that there’s probably a good reason why the code looks the way it does due to circumstances that are likely not documented.
If you are extremely lucky, you might find Architecture Decision Records which document the design choices throughout the development of the system.
I’d encourage you to adopt them for any new software you write.
Alternatively, I find it useful to read the commit messages.
Sometimes they yield clues as to what the developers were thinking at the time.
More importantly, you’ll also discover who worked on the system and you might be able to speak to the original developers.

Static code analysis tools and especially those that are capable of visualising class hierarchies and dependencies between packages are invaluable to give you a sense of the size of the 'snake pit'.
The book "Software Design X-Rays" by Adam Tornhill will give you the necessary tools and techniques to identify technical debt based on behavioural data from how developers worked with the code.
It’s also a great way to communicate what you are dealing with when speaking to non-technical colleagues that have asked you to untangle the 'ball of snakes'.

### Run the legacy system

At this point, you can try running any available tests, building, and even running the legacy system on your machine if possible.
Reviewing the tests can provide a comprehensive overview of the system's features and deepen your understanding of its functionality.

In most cases, you'll need to stub or mock the necessary infrastructure for the legacy system to run properly.
Docker is a great tool for spinning up isolated databases and other components locally.
If the legacy system relies on external APIs or systems, tools like Hoverfly, WireMock, or Servirtium can simulate those dependencies.
Be cautious, though, as setting up these simulations can be time-consuming, so it’s important to know when to stop before wasting too much time.

If you've reached this point, your comprehension of the system should have significantly improved compared to your initial understanding.
As you learn more about the system it’s crucial to revisit previous assumptions and continuously refine and update the diagrams and other artefacts you’ve produced throughout your discovery. 

## Where should you go from here? 

Once you've gained a solid understanding of the legacy system, you can begin exploring different modernisation strategies.
The path you choose will depend on factors like the system’s complexity, criticality, and the available resources.
Common approaches include:

* Big Bang Migration: This involves replacing the legacy system in one go with a completely new solution. 
While it promises fast results, it's high-risk and is only feasible if the legacy system is well understood, and thorough testing can be performed before the switchover.

* Modular Migration: This method incrementally replaces parts of the legacy system, allowing for more control and less risk.
It's suitable for systems with a modular structure or where decoupling components is possible.

* Decommissioning: If the system is no longer needed or its functionality can be offloaded to other systems, decommissioning may be the most efficient option.
This is only viable when the system’s remaining value does not justify further investment.

* Maintaining the Legacy System: In some cases, maintaining the legacy system may be the best choice, especially when the system remains critical and replacing or modernizing it is too costly or risky.
Maintenance should focus on ensuring stability and handling any ongoing updates or security concerns.

No matter which approach you choose, a thorough understanding of the legacy system is essential.
As outlined earlier in this article, factors such as evolving business needs, performance constraints, and the system’s architecture will influence your decision.
It’s crucial to have a clear picture of the legacy system before proceeding with any modernisation effort.
If you're looking for more ideas, the [Legacy Modernization meets GenAI](https://martinfowler.com/articles/legacy-modernization-gen-ai.html) article offers a fresh perspective on tackling legacy transformation using today’s technologies.

If you’re struggling with modernising your legacy systems - don’t hesitate to reach out to me and [my colleagues at Zühlke](https://www.zuehlke.com/en/expertise/software-engineering).
We are always ready to help with your digital transformation initiatives.
