---
title: "Messaging-First Architectures: Resilient Systems with Azure Service Bus"
date: "2025-06-24"
saveAsDraft: true
hideFromHashnodeCommunity: false
publishAs: gayatri-potawad
tags:
  - Azure
  - architecture
  - software-architecture
  - messaging
  - motivation
  - microservice
enableToc: true
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1750763487391/xyENTEBwe.jpeg?auto=format
---

Messaging-First Architectures: Resilient Systems with Azure Service Bus 


In one of my recent projects, I worked on a large-scale retail platform where nearly every critical business flow from orders to inventory updates relied on Azure Service Bus. This was my first dive into a messaging-first architecture on Azure. 


This blog is my attempt to capture what I learned and design principles that shaped the system and hopefully help anyone walking a similar path, especially if you’re transitioning from synchronous REST-based APIs to asynchronous messaging. 

 
1. Azure Service Bus 

Azure Service Bus is a fully managed enterprise message broker that enables decoupled communication between services using queues and topics. 
If you’ve worked with something like ActiveMQ, Kafka, or RabbitMQ, a lot will feel familiar, but Azure adds cloud-native features like auto-scaling, integration with Azure Functions, and dead-letter handling. 



2. Why Messaging-First? 


In most systems I’ve worked on, HTTP APIs were the go-to service A calls service B, often in a tightly coupled chain. That works fine for many workflows, especially when you need quick, direct responses. 

But in a recent project, we leaned into a messaging-first approach using Azure Service Bus. 
Instead of services calling each other directly, they communicated through messages — and that changed a lot. 

It wasn’t about replacing REST, but about picking the right model for the problem. 
Messaging brought clear benefits in areas like: 

Decoupling services so they could evolve independently. 

Smoothing out traffic spikes with queues. 

Handling retries and failures more gracefully. 

That said, messaging isn't a silver bullet. It introduces latency and adds complexity in tracking, ordering, and debugging. 
But where it fits, especially in async-heavy workflows, it can make systems more resilient and scalable. 

For me, messaging-first became less about abandoning APIs, and more about using the right tool where it made sense. 


3. Designing Around the Bus 

In a messaging-first architecture, the Service Bus becomes the backbone of your system. Services are designed to react to messages, rather than respond to requests.

We might think "If everything goes through Service Bus, isn’t that a single point of failure?” 

The reality is, Azure Service Bus (especially on the Premium tier) is built for high availability. 
It’s redundant across zones, fully managed, and handles all the scaling, patching, and infrastructure stuff behind the scenes. 
You’re not babysitting a broker; Microsoft does that for you. 

That said, putting messaging at the center of your system does mean you have to take it seriously. 
Things like Dead Letter Queues, lock timeouts, or message retries can become blind spots if you’re not monitoring them properly. 
Team had to invest in observability early; logs, alerts, correlation IDs to make sure we weren’t flying blind. 

So yes, Service Bus is central. But with the right setup, it’s not fragile. In fact, it ended up being reliable parts of the stack. 

Overview of a simple ordering service with minimal processes 

https://cdn.hashnode.com/res/hashnode/image/upload/v1750763150332/cwv8WTrXn.png?auto=format


4. Patterns in Practice 

Use Queues When: 

You need point-to-point communication. 

A single consumer should process each message. 

You’re building backend workers (e.g., order processor, inventory updater). 

Use Topics When: 

You want publish-subscribe semantics. 

Multiple services should react to the same event. 

You need fan-out e.g., logging, notifications, audit trails. 



5. DLQs Done Right 

Dead-letter queues (DLQs) are where messages end up when something goes wrong — too many delivery attempts, serialization issues, or unhandled exceptions. 

In our case, DLQs turned out to be a quiet but critical signal. 

We started seeing messages pile up in the DLQ, with reasons like "Max Delivery Attempts Exceeded." At first glance, it wasn’t obvious what the problem was — the functions were technically healthy. 
But when we dug deeper, we realized that the Azure Service Bus was retrying deliveries because our functions were simply taking too long to respond. 
Not because they failed but because they slowed down under high CPU load. 

The root cause? Several functions running in the same App Service Plan were fighting for compute. 
CPU was hitting 100%, and as a result, some functions would time out after Azure Service Bus’s default 5-minute lock duration. 
Since there weren’t clear diagnostic logs from Service Bus indicating a timeout, we had to correlate it ourselves using App Insights and DLQ metadata. 

The fix: We tuned the App Service to auto-scale more aggressively aiming to bring the CPU load down within 10 minutes (two timeouts) instead of letting it hover for 30 minutes (more than 5 timeouts). 
Once that was in place, the DLQ entries dropped, and message flow stabilized. 

Moral of the story: DLQs don’t just catch errors they reveal when your system is struggling. 
They can help you fine-tune not just code but scaling policies too. 

Shape 


6. Retry Strategies 

Azure Service Bus provides built-in retry handling, but you can (and often should) tune it. 

maxDeliveryCount controls how many times a message is retried before DLQ. 

Set autoComplete to false so you can complete processing only on success. 

Use custom retry queues or scheduled retries for long tail errors. 

Coming from Java, this felt a bit like using Spring Retry but without needing annotations, you control retries in your message loop or function binding. 


7. Observability + Fail-Safes 

A messaging-first system only works if you can see what’s happening. 

Enable diagnostic settings to stream logs and metrics to Log Analytics. 

Add Application Insights and propagate correlation IDs. 

Include message IDs and payloads (truncated!) in logs for traceability. 

Track processing times and delivery counts to detect slow consumers. 

Don’t treat observability as an afterthought. When a message fails silently, it’s hard to debug unless you’ve wired in visibility. 

Shape 



8. Gotchas to Avoid 

Even with a solid design, there are a few sharp edges in messaging-first systems;
here are the mistakes we ran into (so you hopefully don’t have to): 

Ignoring DLQs 

It’s easy to treat DLQs like a trash bin. DLQs often surface subtle bugs, timeouts, or performance issues we might otherwise miss. We learned to monitor them like a first-class signal. 

Sending Large Messages 

Messages over 256 KB can silently fail. 
While we didn’t hit this ourselves, it’s a common pitfall. 
If you’re close to the limit, compress the payload or store large data in blob storage and just pass a reference. 

Lock Timeouts 

By default, a message lock lasts 30 seconds. If your function or processor takes longer, Azure will think it failed and redeliver the message. We observed implementing lock renewal, increases processing efficiency to avoid duplicate executions. 



Wrapping Up 

This project really changed the way I think about service communication. Messaging-first isn’t just about queues and topics. It’s about designing for resilience, decoupling, and scale from day one.  

But here’s the nuance: messaging-first doesn’t mean messaging-only. 

Some interactions are still best done synchronously like fetching user details for a UI in real time or validating input. The real strength comes from knowing where async fits best: background jobs, cross-system workflows, retries, or anything that shouldn’t block the user. 

System can be hybrid. It’s not one or the other. It’s about picking the right tool for the job. 

If you're building distributed systems on Azure, or transitioning from a synchronous mindset like I was, I hope this gives you a good head start. 
