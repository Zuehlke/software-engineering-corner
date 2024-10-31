---
title: Taking a Byte of the Carbon Cake
domain: software-engineering-corner.hashnode.dev
tags: green-computing, carbon-friendly, software-architecture
cover: https://cdn.hashnode.com/res/hashnode/image/upload/?/??.jpg?auto=format
publishAs: PaulSimmmons
hideFromHashnodeCommunity: false
saveAsDraft: true
enableToc: true
---
# How to Take a Byte at the Carbon Cake ( DRAFT, Oct 24)

We all make decisions that impact the future of our planet, from our choice of food and consumer products to transport options for commuting or holidays.  In doing so we have become accustomed to the notion of a carbon footprint and the target of carbon neutrality.  How can we apply the same thought process to the impact of the software solutions that we produce?

This article provides guidance on steps we can take today.  It begins with a look at the relative cost of carbon footprints for everyday things and propose some practical steps we can adopt to contribute our part to reducing that of our software, something of which our customers are increasingly business-conscious.

## What is ‘carbon cost’?
First, let’s review the carbon cost of some popular items so that we can understand the relative cost of common software components.  For this we’ll use the standard unit of Kg of carbon dioxide (KgCO2).  Note that there are other greenhouse gases and it’s common practice to convert to this as an equivalent.


Carbon Footprints ( TODO: PICTURE TO BE ENRICHED with a set of examples of everyday things )

### Aside: How much is 1kg of CO2?

If you are a visual person you can imagine a balloon approximately 1 m diameter as a visual of 1 kg of CO2 at a temperature of 18c, sea level.

## How do we measure?

To calculate an equivalent carbon cost of software solutions deployed to the cloud, we must consider the triad of compute, memory and disk.  We will ignore the embedded cost of hardware because cloud providers include that in the rate.  Note that if we wish to measure for physical hardware solutions such as on-premise data centres or a Mac or laptop, of course we need to factor in the embedded carbon cost.
There’s plenty of controversy over climate reporting, with some hypervisor providers reputed to adopt clever accounting methods to obfuscate the true carbon cost.  There are some key omissions which force us to guess some aspects, such as whether AWS S3 storage is based on physical hard drives, or how long a Lambda function remains in memory.
Fortunately there are a growing number of third-party sources which help us see the ‘wood for the trees’; one such is ClimateIQ.  ClimateIQ provides emission factors for many economic sectors, of which cloud computing is one.  You can query this via their data explorer, https://www.climatiq.io/data, and sign up for a free account to run API queries and filter the data.

### A worked example

Using Climate IQ as a source we can determine the following carbon cost rates:

| Carbon Cost Item                          | Carbon Rate          | Reference                                                       |
|-------------------------------------------|----------------------|-----------------------------------------------------------------|
| CPU in AWS region Dublin (EU WEST 1)      | 0.0007478kg/CPU-hour | Climatiq ID cpu-provider_aws-region_eu_west_1                   |
| Memory (same AWS region)                  | 0.0001kgCO2e/GB-hour | Climatiq ID memory-provider_aws-region_eu_west_1                |
| Magnetic hard disk (HDD, same AWS region) | 0.0002kgCO2e/TB-hour | Climatiq ID storage-provider_azure-region_north_europe-type_hdd |
| Fast disk (SSD, same AWS region)          | 0.0004kgCO2e/TB-hour | Climatiq ID storage-provider_azure-region_north_europe-type_ssd |

Note the cost of SSD is double that of HDD and I assume this reflects the cost of electricity required to maintain state, compared to magnetic hard drive.  We'll touch on this later. )

Given the above we can calculate the cost of our use of a cloud service by evaluating for each of service, given we can determine the number of CPU hours spent, memory (GB) and disk storage (TB/hour). 

An example from a genuine project is as follows:

A modest website is backed by a handful of Spring microservices with a database and some light messaging.  The microservices and messaging run in a Kubernetes cluster running on AWS EC2 on an m7g.medium CPU, 3 nodes with total of 15 Gb memory and a disk of 100 gb in an availability zone of 3 instances.  The database TO BE ADDED..  The calculation is shown below and gives a total of 32 KgCO2/year ( ADD DATABASE COST) for one environment (^).

### Relative carbon footprints

The relative carbon cost of each aspect is worthy of note;  the carbon cost of memory is surprisingly 70% that of CPU, whereas instinctively we think it’s insignificant.  We should consider memory allocation carefully, measure and optimise it for our service resources.

Relative to these carbon costs, hard disk (HDD) space appears cheap. Note that faster SSD is double the cost of HDD and so can become a significant carbon cost factor, particularly if data is replicated across availability zones.  

The general rule is to optimise use of storage, which although not specifically mentioned in the pattern [GSF Pattern: Optimise Storage Resource](https://patterns.greensoftware.foundation/catalog/cloud/optimise-storage-resource-utilisation), choosing HDD where possible is naturally a lower rate of energy consumption.

### Show your working

[Show your working](Https://TBA)
Illustration: ‘show your working’, as an amusing side note, this was a child’s genuine answer in her primary school maths test. She needs to learn about apostrophes :-)

My maths teacher always told me to show your workings, so here they are for the above carbon footprint calculations, based on the rates given above from ClimateIQ:

```
CPU carbon footprint = 0.0007 * 3 nodes)  = 0.0021 per hour
Memory carbon footprint = 0.0001 * 15  = 0.0015 per hour
Storage carbon footprint = ( 100/1000 * 3 instances * 0.0002) = 0.00006 per hour

Total carbon footprint =  0.00366 * 8760 hours/year =~ 32 KgCO2/year
```
[Carbon Footprints PICTURE TO BE ENRICHED as copy of the first with this system footprint added]() 

Let’s place this on the relative carbon footprint line. 

It’s somewhere between a single London-Birmingham bus trip and mowing the lawn for a year.  But of course any realistic software system will likely have 2-3 similar environments, with varied configurations, plus services such as gateways, load balances, databases etc...  These services may be PAYG shared, rather than dedicated to this system, but nevertheless need to be accounted.  

Therefore in practice it’s likely that this carbon cost will be a multiple, let’s say 5x at 150 KgCO2/year for a very modest system.   Run that system for 5 years and we’re not quite approaching the cost of a flight from London to New York at 1100 KgCO2, but we’re getting there.

## Green washing?

Any article on carbon footprint is almost obliged to mention green-washing, the subtle art of hiding the truth whilst appearing transparent on climate change and carbon footprints.

AWS is 100% green by 2030, by their own measurement.  That does NOT mean that your system is carbon-friendly, it simply means that AWS are accounting for the offsets.  In regions where they are truly green powered, that power could be used elsewhere, what incentive is there to decrease usage?   

Ultimately, the [GSF energy efficiency policy](https://learn.greensoftware.foundation/energy-efficiency) suggests we should aim to use less energy, and that has to be the end goal.

Another consideration, which we’ve ignored in this article, is the carbon cost of data transfer. This is likely to be small but can accumulate.  That said, there are few metrics available from cloud providers to capture transfers within their network, and thus within your system’s network.

## What can we do?

So what ‘byte’ can we take out of the carbon cake?

There are some excellent best practice available on sites such as [Patterns, Green Software Foundation](https://patterns.greensoftware.foundation/), and I recommend a read through these.

With an engineering mindset, it’s tempting to focus on the challenge of improvements to compute workloads; we are trained to optimise and it’s arguably one of the most challenging and fun aspects.  Key patterns in this space are demand-shaping (doing work at a rate to match the current carbon-free energy availability in the region), demand-shifting  (moving workloads to a region with lower carbon energy cost) and time-shifting (deferring until a time when carbon-free energy is available).  There’s already some useful tools in this space - eg: Kubernetes scheduler <>.

However with the trend in cloud providers towards fully-green energy, it’s likely that their data centres in the most popular regions will be 100% soon, and so the gains in moving workloads from one to another are decreasing.  This diminishes the benefits of demand shifting and demand shaping, leaving time-shifting as a reasonable option.

Therefore there follows an opinionated view of the activities with the most significant impact, ignoring demand-shaping and shifting; focusing in three groups; easy-wins, medium effort and those at architecture design time

### First: Low-Hanging Fruit

* Measure
Start with carbon footprint tools, which will provide a ball-park figure of carbon usage decomposed over services.  Be wary that these may not include ‘free usage’ (where free means cost-free of course) and may lack accuracy on shared ‘serverless’ services, eg: lambda functions.  Third party data from CCF or ClimateIQ data provides more granular detail.
* Switch off!
Particularly relevant for dev and test envs, but also look for resources or services no longer actively used, for example S3 buckets, old logs. See https://patterns.greensoftware.foundation/catalog/cloud/delete-unused-storage-resources
* Scale appropriately
Ramp down for quiet business periods.  Ramp down environments or services as appropriate.  Consider containerising or co-hosting services where CPU usage is low ( patterns https://patterns.greensoftware.foundation/catalog/cloud/optimize-avg-cpu-utilization <https://patterns.greensoftware.foundation/catalog/cloud/containerize-your-workload-where-applicable> ).

### Second: Medium Effort Activities

* **Review Failover**

  Re-examine fail-over strategy to reduce under utilised resources; 
  ie: does your system really need active-active? [AWS Well Architected: Planning for Disaster](https://docs.aws.amazon.com/wellarchitected/2022-03-31/framework/rel_planning_for_recovery_disaster_recovery.html) .  This may allow some to be switched off, or moved to colder options with longer failover times.

* **Right-size Databases**

  Database can have a significant carbon footprint.  Right-size with appropriate data management …have a data archive policy, manage data to carbon-cheaper storage where practical. 
[AWS Well Architected: Sustainable A4](https://docs.aws.amazon.com/wellarchitected/latest/framework/sus_sus_data_a4.html)
* **Compute Outliers**

  Services that are particularly light on CPU, or underused memory and disk, though take care to be sure about failover and resilience configurations.
* **Choice of Disk**

  Be frugal with your choice of SSD over HDD storage, it’s double the cost

These medium-effort activities are clearly not free, and are probably best considered a form of technical debt and managed as such alongside project feature development.

### Third: Architecture or Feature Design

The first two groups above assume an existing system.  When designing future systems, we can apply these principles for carbon efficiency:

* **Favour Asynchronous** 
Identify and design tasks that can be scheduled or prioritised separately.  Simple examples might be running data extracts, ETL transformations, backups.   Distributed systems separated by messaging events lend themselves to this style naturally. Flexibility of design is the key, and this will lend itself to compute solutions such as demand-shaping, demand-shifting or time-shifting, ….
[AWS Well Architected: Sustainable A2](https://docs.aws.amazon.com/wellarchitected/2022-03-31/framework/sus_sus_software_a2.html)

* **Scale**
  Design and build for scalability.  Predict target usage, perhaps daily, monthly trends, identify periods of low or no usage and use these facts, alongside standard architectural qualities, to drive design decisions.

* **Sustainability Goals**
  Discuss and agree sustainability goals, and align your system SLAs with these; there’s a higher carbon cost as you move higher up each scales of availability, performance and security.  See [AWS Well Architected: Sustainability A3](https://docs.aws.amazon.com/wellarchitected/latest/framework/sus_sus_user_a3.html)

## Conclusions

Customers are becoming more sensitive to the carbon cost of software systems.  The carbon footprint of your system may be larger than you think, especially with multiple environments.  

The good news is that there are potential quick-wins by adjusting cloud infrastructure without extensive re-design work.  

With additional effort you can create and manage a plan of work driven by sustainability targets, which could be considered a form of technical debt or, in the case of new design, should drive that design as an architectural quality.

### Want to read more?

An explanation of carbon awareness, energy and carbon efficiency: https://learn.greensoftware.foundation/.

'Awesome green software' contains links to a number of dev tools and emission calculators: https://github.com/Green-Software-Foundation/awesome-green-software

