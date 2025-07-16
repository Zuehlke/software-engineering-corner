---
title: DDD - How to do Event-Storming?
description: >-
  Event Storming is a collaborative workshop method used to identify and map
  domain events within a system. Participants brainstorm and arrange events on a
  timeline, fostering shared understanding and revealing potential issues. The
  resulting visual representation provides a comprehensive overview of the
  business process and serves as a foundation for further development.
released: '2023-02-06T10:05:22.608Z'
cover: images/cover.png
author: Keerthikan
tags:
  - software architecture
  - DDD
shortDescription: >-
  Learn how Event Storming, a workshop-based method, helps collect domain events
  to understand system processes and facilitate requirement engineering.
---
At Zühlke, there is a **DDD Topic Team** to discuss about various topics related to Domain-Driven-Design. Recently, we had a session about **Event Storming**. In this post, I would like to share how we did it and some key takeaways.

## What is Event Storming?

Event Storming is a workshop-based method to collect all possible domain events that can happen in the system. This workshop takes place as one of the early meetings where software developers and domain experts bring in as much ideas/events as possible from their domain knowledge. This facilitates the participants to learn from each other and get the big picture of the problem domain.

The result of the meeting is sticky notes spread around in a feasible timeline. This artifact can then be used as a means for requirement engineering.

## The Procedure

To practice during the DDD Topic Team meeting, we decided to do event storming for the time period between the marriage proposal💍 and the wedding 👰🤵. It was not a real work example, however it was good to understand the method outside software development context.

### 1. Collect domain events individually (~10min)

Firstly, we started to brainstorm individually for about 10 minutes and collected possible domain events. A domain event is a significant occurance within a system that has an impact on one or more entities within the domain, for example sending invitations to the guests. These events are often used to trigger other actions within the system.

A domain event is written in the passive form, for example *'Invitations (are) sent'*, and denoted in an orange sticky as shown below.

<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1670502974569/BCP4uy8Du.png?auto=compress" alt="domain-event" width="100"/>

The collected events can be chaotic and redundant on the board. That is okay. The important benefit of this step is that it gives everyone the chance to think of and collect events from their perspective.

### 2. Pick some pivotal events (~5min)

As the next step, we tried to pick few pivotal events together. A pivotal event means it is a very significant event in the process. They are very helpful to initially set the timeline. An example of the initial timeline with a few pivotal events would look as shown below.

![Pivotal Events](images/1749948051067-3m2kzqefork.png)

| *Source: <https://leanpub.com/ddd\\_first\\_15\\_years> – Discovering Bounded Contexts with EventStorming — Alberto Brandolini*

Tip: Do not spend too much time discussing whether it is a pivotal event or not. The main purpose of this step is to have a widespread timeline as a baseline.

### 3. Order the events in a timeline (~30min)

In the next step, we started to order the remaining domain events in-between the pivotal events. Thereby, we enforce a timeline and remove any duplicates. If two events could happen in any order (also known as `causally unrelated`), put the sticky notes in parallel.

During the discussion, a domain event could trigger some questions, problems, or conflicts. It is well worth capturing them as shown below. In such a case, the discussion should then be stopped and clarified later so that the event storming and the ordering could be continued.

<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1670417329757/gShyOCEmz.png?auto=compress" alt="hot spots" width="150"/>

### 4. Recap (~3min)

Once the events were ordered in a timeline, we recapped the session by briefly telling a story based on the events from left to right. This short summary gave us a good overview of the process flow.

The final output of the session looks as shown below.

![Event Storming](images/1749948051070-na546f08lv9.png)

## Key Takeaways

* Every participant is engaged in the meeting thanks to the hands-on approach. They can share their domain knowledge and learn from each other.
* Event storming is simple. There is no UML-like notation, so both technical and non-technical stakeholders can understand and communicate easily.
* Since all stakeholders can join, event storming is a good starting point to initiate discussions and discover gaps through the collective effort.
* The final output gives a good overview of the business process and lays the foundation for the further development.

## Further Steps

In addition to domain events, the timeline could be further extended by adding actors, commands, external systems etc. Please refer to the following resources for more information:

* [Glossary & Cheet Sheet by DDD Crew](https://github.com/ddd-crew/eventstorming-glossary-cheat-sheet)
* Book: [Introducing EventStorming - An act of Deliberate Collective Learning](https://www.eventstorming.com/book/)
* LinkedIn Learning: [Event Storming - Part of DDD Series by Allen Holub](https://www.linkedin.com/learning/software-architecture-domain-driven-design/demo-activities-flow?resume=false)

***

Have you conducted event storming in your projects? What are your experiences? Please share them in the blog's comment section.
