---
title: Untangling Legacy Systems
domain: software-engineering-corner.hashnode.dev
tags: legacy,legacy-systems,legacy-app-modernization
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1726833712279/s9pjCgvRc.avif?auto=format
publishAs: KevZ
hideFromHashnodeCommunity: false
saveAsDraft: true
---
Dealing with outdated software and legacy systems can make you feel as though you've been thrust into a pit of snakes, much like Indiana Jones in the Raiders of the Lost Ark. *"Snakes. Why did it have to be snakes?"*

## What is a legacy system anyway?

You most likely think of decade old machines running in someone’s basement or a long forgotten machine under a colleague’s desk. While this is certainly true, not all legacy systems are the same. Sometimes, systems can become legacy without any fault of their own. 

There are internal and external factors that can contribute to a system becoming “legacy”:
•	changing business needs
•	absence of vendor support
•	changing user expectations 
•	departure of the initial team that developed the software

First of all, it’s essential to agree on a common goal if the transformation is to be successful. The focus might vary across stakeholders, but potential areas of focus include expanding functionality, reducing cost, increasing scalability, reliability, maintainability, agility, flexibility, security, or stability. However, before you can have any meaningful input into the roadmap, you’ll need a better understanding of your legacy system.

## Practical tips to better understand your legacy system

### Be clear about what you’re trying to discover
Unlike our archaeological hero who makes it up as he goes along it’s important to first understand what you are trying to discover.

The essential information you are trying to discover will likely be:

* original requirements, including how and why they have evolved over the lifecycle of the application
* architecture details
* performance constraints
* build and deploy process and code metrics

At this point, it might be worth starting a glossary and documenting any acronyms or domain knowledge/terms you come across.

### Document what you find
In my experience, what proved to be most effective is to start by drawing a diagram of the system’s architecture. Personally, I tend to use the C4 model to document architectures. The C4 model is an easy to learn, developer-friendly approach to software architecture diagramming. I am also a big fan of diagram as code, and tools such as Structurizr will help you get started easily. The diagram will also be invaluable later on, when you start speaking to developers, architects, and subject matter experts as you dig deeper.

As part of documenting the architecture you might start to uncover other systems that are coupled to your legacy system and are essential for it to function. 

Like documenting the overall architecture of the system, I find documenting the interactions between systems using a sequence diagram one of the most effective ways to understand and communicate the inner workings of a system to a wider audience. D2, Mermaid or PlantUML are great tools to create diagrams as code.

### Explore the source code
After you’ve drawn some C4 architecture diagrams and understand at a high level how the legacy system works it might be time to get your hands on the source code and hopefully the version control history. This is the first opportunity for you to measure the quality of software by counting the [WTF per minute](https://web.archive.org/web/20090301090433/https:/www.codinghorror.com/blog/archives/001229.html) you’re muttering to yourself in disbelief whilst trying to make sense of it all. 

Joking aside, it’s important to keep an open mind and understand that there’s probably a good reason why the code looks the way it does due to circumstances that are likely not documented. If you are extremely lucky, you might find Architecture Decision Records which document the design choices throughout the development of the system. I’d encourage you to adopt them for any new software you write. Alternatively, I find it useful to read the commit messages. Sometimes they yield clues as to what the developers were thinking at the time. More importantly, you’ll also discover who worked on the system and you might be able to speak to the original developer(s).

Static code analysis tools and especially those that are capable of visualising class hierarchies and dependencies between packages are invaluable to give you a sense of the size of the ‘snake pit’. It’s also a great way to communicate what you are dealing with when speaking to non-technical colleagues that have asked you to untangle the ‘ball of snakes’. The book “Software Design X-Rays” by Adam Tornhill will give you the necessary tools and techniques to identify technical debt based on behavioural data from how developers worked with the code.

### Run the legacy system
At this point you can try to run the tests, if there are any, build and even run the legacy system on your machine if possible. Most likely, you’ll need to stub and mock the infrastructure required for the legacy system to function properly. 

Docker is well suited for spinning up isolated databases and other infrastructure on your machine. In case you need to simulate other APIs/systems the legacy system is dependent on you can use one of the many API simulation tools such as Hoverfly, WireMock or Servirtium. Keep in mind that this might be a time sink and you’ll probably want to stop before you waste too much time.


If you've reached this point, your comprehension of the system should have significantly improved compared to your initial understanding. As you learn more about the system it’s crucial to revisit previous assumptions and continuously refine and update the diagrams and other artefacts you’ve produced throughout your discovery. 

## Where should you go from here? 

Ideally, you have acquired sufficient knowledge about the system, enabling you to collaborate effectively with other departments within your organisation to collectively determine the best approach for addressing the legacy system and making changes to it. In my experience, the Mikado method provides a pragmatic, straightforward, and empirical method to plan and perform non-trivial technical improvements to your legacy system once you are ready.

If you’re struggling with modernising your legacy systems - don’t hesitate to reach out to me and [my colleagues at Zühlke](https://www.zuehlke.com/en/expertise/software-engineering). We are always ready to help with your digital transformation initiatives.

