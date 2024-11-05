---
title: A Byte of the Carbon Cake
domain: software-engineering-corner.hashnode.dev
tags: green-computing, carbon-friendly, software-architecture
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1730804922642/7N2hwJ1lV.jpg?auto=format
publishAs: PaulSimmmons
hideFromHashnodeCommunity: false
saveAsDraft: true
enableToc: true
---
# A Byte at the Carbon Cake

We all make decisions that impact the future of our planet, from our choice of food and consumer products to transport options 
for commuting or holidays. In doing so we have become accustomed to the notion of a carbon footprint and the target of carbon neutrality.  

How can we apply the same thought process to the impact of the software solutions that we produce?

This article provides guidance on steps we can take today. It begins with a look at the relative cost of carbon footprints for everyday things and 
proposes some practical steps we might adopt to make our contribution to reducing the footprint of our software, 
something of which our customers are increasingly business-conscious.

### Not in Scope

Our focus is on the carbon cost of systems that run the software that we create, and we highlight just a few of many worthwhile patterns that are applicable. 
Although we touch lightly on many topics, intentionally out of scope is the way in which cloud providers account for their carbon footprints. 
Also note that the relative carbon footprints of everyday things are necessarily a guideline only.

## What is ‘carbon cost’?
First, let’s review the carbon cost of some popular items so that we can understand the relative cost of common software components. For this we’ll use the standard unit of Kg of carbon dioxide (KgCO2). Note that for greenhouse gases other than CO2 it is common practice to convert to CO2 as an equivalent.

![Figure: Relative carbon footprints of everyday thing](https://cdn.hashnode.com/res/hashnode/image/upload/v1730803114790/O_AEqKW9y.png?auto=format)

In this chart we show some examples of everyday carbon footprints; from the lowest footprint of 10 KgCO2 for a train journey London to Birmingham, and 
similar for a bus at 130 KgCO2, scaling up to the cost of a petrol lawnmower for 22 mows/year, some example flight costs, pets and the energy cost for a house.

Some details behind these numbers: the cost of a house represents an average UK gas-fired heating with grid electricity. 
The cow is calculated methane production per year and uses standard conversion to CO2. Costs of transport are factored for one person journey, whereas costs showing 'p.a' represent 1 year. 
Cost of ownership of cats and dogs represent their whole-ownership life-cost per year. Source references are provided at the end of this article.


### Aside: How much is 1kg of CO2?

![Figure: A 1m balloon of 1kg CO2](https://cdn.hashnode.com/res/hashnode/image/upload/v1730803843903/zOJqgrkgS.jpg?auto=format)

*Figure: A 1m balloon of 1kg CO2*

As an aside, if you are a visual person, to picture 1Kg of CO2, imagine a balloon of approximately 1 m diameter, at 18 degrees, sea level

## How do we measure?

To calculate an equivalent carbon cost of software solutions deployed to the cloud, we must consider the triad of compute, memory and disk. We will ignore the embedded cost of hardware because cloud providers include that in the rate. Note that if we wish to measure for physical hardware solutions such as on-premise data centres or a Mac or laptop, of course we need to factor in the embedded carbon cost.

There’s plenty of controversy over climate reporting, with some hypervisor providers reputed to adopt clever accounting methods to obfuscate the true carbon cost. There are some key omissions which force us to guess some aspects, such as whether AWS S3 storage is based on physical hard drives, or how long a Lambda function remains in memory.

Fortunately there are a growing number of third-party sources which help us see the ‘wood for the trees’; one such is ClimateIQ which provides emission factors for many economic sectors, of which cloud computing is one. You can query this via their data explorer, https://www.climatiq.io/data, and sign up for a free account to run API queries and filter the data.

### A worked example

Using Climate IQ as a source we can determine the following carbon cost rates:

| Carbon Cost Item         | Carbon Rate           | Reference                                                       |
|--------------------------|-----------------------|-----------------------------------------------------------------|
| CPU compute              | 0.0007478 kg/CPU-hour | Climatiq id cpu-provider_aws-region_eu_west_1                   |
| Memory                   | 0.0001 kgCO2e/GB-hour | Climatiq id memory-provider_aws-region_eu_west_1                |
| Magnetic hard disk (HDD) | 0.0002 kgCO2e/TB-hour | Climatiq id storage-provider_azure-region_north_europe-type_hdd |
| Solid state disk (SSD)   | 0.0004 kgCO2e/TB-hour | Climatiq id storage-provider_azure-region_north_europe-type_ssd |

Rates differ by region and cloud provider, these examples are for Amazon cloud region; AWS Dublin

A few observations based on these rates:

 * The rates ('carbon cost') are incredibly small in comparison to everyday things
 * The rate of SSD is double that of HDD and we assume this reflects the cost of electricity required to maintain state, compared to magnetic hard drive; a subject we'll touch on this in the next section
 * The standard units for memory and disk storage are respectively GB and TB, hence the carbon rate for memory is in fact 500x that of storage at the same unit

We can use these rates, or similar for other providers or regions, to calculate the cost of our use of a cloud service. We simply evaluate for each of our service resources the number of CPU hours spent, memory and disk storage per hour. A worked example from a genuine project, that hosts a modest website with some video content, is as follows:

The system consists of a handful of Spring micro-services with a database, a video server and some light messaging. Micro-services and messaging run in a Kubernetes cluster running on AWS EC2 on an m7g.medium CPU, 3 nodes with total of 15 Gb memory and a disk of 100 gb in an availability zone of 3 instances. The database TO BE ADDED.. The calculation is shown below and gives a total of 32 KgCO2/year ( ADD DATABASE COST) for one environment.

### Relative carbon footprints

![Figure: carbon cost proportions of the worked example](https://cdn.hashnode.com/res/hashnode/image/upload/v1730803133864/TkxqTomsM.png?auto=format)

Some interesting facts emerge from this simple calculation above:

1. The carbon cost of memory is surprisingly high compared to CPU (41:57), just over 2/3~rds~, whereas instinctively we think it should be insignificant.  
We should consider memory allocation carefully, measure and optimise it for our service resources.
2. Hard disk (HDD) space appears relatively cheap as a proportion of overall carbon impact.
3. Faster solid-state drives (SSD), with its use of non-volatile memory to store data, is twice the cost of HDD and so can become a significant carbon cost factor, 
particularly if data is replicated across availability zones. The general rule is to optimise use of storage, which although not explicit in [GSF Pattern: Optimise Storage Resource](https://patterns.greensoftware.foundation/catalog/cloud/optimise-storage-resource-utilisation), 
it's clear that selecting HDD where possible is naturally a lower rate of energy consumption.
4. Small rates grow quickly when considering real-world systems; scaled by unit size, time and over multiple environments.


### Show your working

![Show your working](https://cdn.hashnode.com/res/hashnode/image/upload/v1730803667437/-5H-Mb7rt.jpg?auto=format)

*Figure: ‘show your working’*

*Side note: As an amusing aside, this image is a child’s genuine answer in her primary school maths test. She is yet to learn about apostrophes :-)*

My maths teacher taught me to always 'show your working', so here they are for the above carbon footprint calculations, based on the rates given above from ClimateIQ:

```
CPU carbon footprint = 0.0007 * 3 nodes)  = 0.0021 per hour
Memory carbon footprint = 0.0001 * 15  = 0.0015 per hour
Storage carbon footprint = ( 100/1000 * 3 instances * 0.0002) = 0.00006 per hour

Total carbon footprint =  0.00366 * 8760 hours/year =~ 32 KgCO2/year

Total carbon footprint for 3 environments = 32 * 3 envs = 66 KgCO2/year

(TO BE ADJUSTED FOR DB)
```
[Figure: Relative Carbon Footprints, showing our Example Micro-service Cloud System]() 

Let’s place our micro-services cloud system on the relative carbon footprint line. At 32 KgCO2 it would be somewhere on the left between a single London-Birmingham bus trip and mowing the lawn for a year. But of course any realistic software system will likely have 2-3 similar environments, with varied configurations, plus services such as gateways, load balances, databases etc... These services may be PAYG shared, rather than dedicated to this system, but nevertheless need to be accounted. In practice it’s likely that this carbon cost will be a multiple, let’s say 5x at 150 KgCO2/year for a very modest system.

This is a very modest system and is small scale in comparison to many brand-name e-commerce retail sites or banking systems. Run the system for 5 years, an admittedly arbitrary figure to represent system life, and we’ve exceeded the cost of a return holiday flight from London to Malaga.

## Green washing?

Any article on carbon footprint is almost obliged to mention green-washing, the subtle art of hiding the truth whilst appearing transparent on climate change and carbon footprints.

Amazon has a target of 100% green by their own measurement. 
That does NOT mean that your system will be carbon-friendly on AWS, it simply means that AWS are accounting for the offsets. 
In regions where they are truly powered by green energy, that same power could be used elsewhere other than their data centre, and what incentive is there to decrease their (or our) usage?   

Ultimately, the green software foundation's [GSF energy efficiency policy](https://learn.greensoftware.foundation/energy-efficiency) suggests we should aim to use less energy, and that has to be the end goal. Green data centres do not equal carbon-free environments in which to run our software.

Other considerations: we have ignored the carbon cost of data transfers, which are small but can accumulate. 
That said there are few metrics available from cloud providers to capture transfers within their network, and thus within your system’s network.


## What can we do?  What 'byte' can we take?

So to reduce the carbon footprint of the software we create, what ‘byte’ can we take of the carbon cake?

First, there are some excellent best practices available on sites such as [Patterns, Green Software Foundation](https://patterns.greensoftware.foundation/)
and I recommend a read through the patterns. Amazon Cloud (AWS) also have valuable guidance in their AWS Well-architected Sustainability.  Google Cloud (GCP) also has good credentials for transparency in how they calculate the carbon footprint of their services.

With an engineering mindset, it’s tempting to focus on the challenge of improvements to compute workloads; 
we are trained to optimise and it’s arguably one of the most challenging and fun aspects. 
Key patterns in this space are 
demand-shaping (doing work at a rate to match the current carbon-free energy availability in the region), 
demand-shifting  (moving workloads to a region with lower carbon energy cost) and 
time-shifting (deferring until a time when carbon-free energy is available). There’s already some useful tools in this space, 
such as a Kubernetes (carbon-aware) scheduler.

However with the trend in cloud providers towards fully-green energy, it’s likely that their data centres in the most popular regions will be 100% soon, and so the gains in moving workloads from one to another are decreasing.  
This diminishes the benefits of demand shifting and demand shaping, leaving time-shifting as a reasonable option.

Therefore we purposefully ignore demand-shaping and shifting n the following opinionated view of the activities with the most significant impact; 
focusing instead on three groups; easy-wins, medium effort and those activities at architecture design time:


### First: Low-Hanging Fruit

![Low hanging fruit](https://cdn.hashnode.com/res/hashnode/image/upload/v1730804092300/ebrrwNFL7.jpeg?auto=format)
* **Measure**

  Start with carbon footprint tools, which will provide a ball-park figure of carbon usage decomposed over services. Be wary that these may not include ‘free usage’ (where free means cost-free of course) and may lack accuracy on shared ‘serverless’ services, eg: lambda functions.  Third party data from CCF or ClimateIQ data provides more granular detail.


* **Switch off**

  Particularly relevant for dev and test envs, but also look for resources or services no longer actively used, for example S3 buckets, old logs. 
  See [GSF pattern: delete unused storage](https://patterns.greensoftware.foundation/catalog/cloud/delete-unused-storage-resources)


* **Scale appropriately**

  Ramp down for quiet business periods.  Ramp down environments or services as appropriate.  Consider containerising or co-hosting services where CPU usage is low, such as 
  [GSF pattern: optimize CPU utilization](https://patterns.greensoftware.foundation/catalog/cloud/optimize-avg-cpu-utilization).

### Second: Medium Effort Activities

* **Review Failover**

  Re-examine fail-over strategy to reduce under utilised resources; 
  ie: does your system really need active-active? [AWS Well Architected: Planning for Disaster](https://docs.aws.amazon.com/wellarchitected/2022-03-31/framework/rel_planning_for_recovery_disaster_recovery.html) .  
  This may allow some to be switched off, or moved to colder options with longer failover times.


* **Right-size Databases**

  Database can have a significant carbon footprint.  Right-size with appropriate data management …have a data archive policy, manage data to carbon-cheaper storage where practical. 
[AWS Well Architected: Sustainable A4](https://docs.aws.amazon.com/wellarchitected/latest/framework/sus_sus_data_a4.html)


* **Compute Outliers**

  Services that are particularly light on CPU, or underused memory and disk, though take care to be sure about failover and resilience configurations.


* **Choice of Disk**

  Be frugal with your choice of SSD over HDD storage, it’s double the cost. 
  This might be a 'low effort' activity, however as it's likely SSD was originally chosen for performance reasons, such as a use in a cache, the effort here is in performance testing such as load, soak or similar.

These medium-effort activities are clearly not free, and are probably best considered a form of technical debt and managed as such alongside project feature development.

### Third: Architecture or Feature Design

![Design time](https://cdn.hashnode.com/res/hashnode/image/upload/v1730805754587/E5d6FuVir.jpg?auto=format)

The groups above assume an existing system. When designing future systems, we should consider carbon as a quality that informs the non-functional qualities such as scalability, security, reliability, performance etc.. 
when assessing trade-offs in light of business drivers (eg: a process such as ATAM). The calculations for this can be driven by data such as ClimateIQ, but there aren't yet tools to help with new features or entire new systems.  

Three key principles for carbon efficiency to drive new design are:

* **Favour Asynchronous**

  Identify and design tasks that can be scheduled or prioritised separately. Simple examples might be running data extracts, ETL transformations, backups.
Distributed systems separated by messaging events lend themselves to this style naturally. 
 Flexibility of design is the key, and a good design decomposition to units of work will lend itself to compute solutions such as demand-shaping, demand-shifting or time-shifting. [AWS Well Architected: Sustainable A2](https://docs.aws.amazon.com/wellarchitected/2022-03-31/framework/sus_sus_software_a2.html)


* **Scale**

  Design and build for scalability. Discuss and predict target usage, perhaps daily, monthly trends, 
identify periods of low or no usage and use these facts, alongside standard architectural qualities, 
to drive design decisions. Early design for scale will encourage system boundaries, such as domains and bulkhead patterns,
to translate to asynchronous tasks and improve the effectiveness of carbon usage, eg: doing more tasks when energy is more green.


* **Sustainability Goals**

  Discuss and agree sustainability goals, and align your system SLAs with these; there’s a higher carbon cost as you move higher up each scales of availability, performance and security.  See [AWS Well Architected: Sustainability A3](https://docs.aws.amazon.com/wellarchitected/latest/framework/sus_sus_user_a3.html)

## Summary Crumbs

![Crumbs on a plate](https://cdn.hashnode.com/res/hashnode/image/upload/v1730805588511/oeMpjNpo9.jpg?auto=format)

Customers are becoming more sensitive to the carbon cost of software systems. 
The carbon footprint of your system may be larger than you think, especially over multiple environments.

The good news is that there are potential quick-wins by adjusting cloud infrastructure without extensive re-design work, 
and these can be driven from existing carbon footprint tools.  With additional effort we can create and manage a plan of work driven by sustainability targets, which could be considered a form of technical debt.  

Similarly, for new software architectures and feature designs we recommend carbon costing should be considered a factor in architectural trade-off analysis, 
however the tools for pre-emptive carbon measurement are yet to mature.


## Further Reading

An explanation of carbon awareness, energy and carbon efficiency https://learn.greensoftware.foundation/

Awesome green software links to a number of dev tools and emission calculators: https://github.com/Green-Software-Foundation/awesome-green-software

AWS well-architectured sustainability: https://docs.aws.amazon.com/wellarchitected/latest/framework/sustainability.html

Architecture trade-off analysis: ATAM: https://insights.sei.cmu.edu/documents/629/2000_005_001_13706.pdf

### Source References:

Carbon footprint of lawnmowers: https://sciencing.com/calculate-carbon-footprint-lawn-mower-24046.html

Carbon footprint of cats and dogs: https://academic.oup.com/bioscience/article/69/6/467/5486563

Carbon footprint of transport, housing, etc: https://calculator.carbonfootprint.com/


