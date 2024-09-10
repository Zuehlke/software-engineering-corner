---
title: Building observability into the NHS COVID-19 app backend serving 17 million users
domain: software-engineering-corner.hashnode.dev
tags: AWS, Amazon S3, dynamodb, logging, json, monitoring, Java, Kotlin, engineering
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1725649342389/ngYMk-jc_.jpg?auto=format
publishAs: KevZ
hideFromHashnodeCommunity: false
saveAsDraft: true
---

When the COVID-19 pandemic swept the globe, it triggered a race to develop digital tools that could help manage and track the spread of the virus. 
The Department of Health and Social Care (DHSC) oversees the UK's National Health Service (NHS), with the aim to help people live more independent, healthier lives for longer. 
As the world entered lockdown, pressure mounted to speed up medtech innovation and the DHSC needed a partner capable of quickly developing a scalable, secure, and user-friendly contact tracing solution to help contain the spread of COVID-19 and protect lives.


DHSC partnered with Zühlke to innovate and build the NHS COVID-19 app as a response to the global pandemic. 
Zühlke's expertise in technology and digital tools played a critical role in designing, developing, and launching the app in just 12 weeks. 
The app aimed to reduce infection rates and alleviate pressure on the healthcare system. 
This collaboration united a multidisciplinary team of policymakers, researchers, and engineers, while also working with Google and Apple to improve contact tracing capabilities. 
The app averted ~1 million cases of COVID-19, avoiding ~44,000 hospitalisations and ~10,000 deaths (September 2020 - December 2020).
See the study [The epidemiological impact of the NHS COVID-19 app](https://www.nature.com/articles/s41586-021-03606-z) published in Nature magazine.


Zühlke built the COVID-19 mobile app's backend using Amazon Web Services (AWS) scalable infrastructure to ensure it could handle the traffic of a national launch. 
The main AWS services used to deliver the app's core features included: Lambda, CloudFront, S3, DynamoDB, CloudWatch, and Athena. 
Choosing a serverless architecture allowed the engineering team to rapidly prototype, build, and iterate on features without having to worry about managing and scaling servers. 
Speed and agility were crucial, as we had to update the mobile app overnight whenever policies changed.


Operationally, the Zühlke engineering team needed to ensure the backend services were available, supporting the core features of the app and processing the incoming data to gather insights whilst preserving citizens' privacy. 
In such a high-stakes environment, observability is crucial.
The engineering team needed the ability to gain deep insights into the app's operations, allowing them to identify and resolve issues while optimising performance swiftly. 
The loss of public trust in the system would have been a catastrophic failure, driving down app usage and directly contributing to a surge in preventable deaths - undermining the purpose of the app and putting countless lives at risk.


To tackle this operational challenge, we need to prioritise observability as a core feature, making it a first-class citizen in our system design. 


We used Amazon CloudWatch to build dashboards and actively monitor the system, ensuring we can track performance metrics and operational health in real time. 
Setting up CloudWatch alarms enabled us to detect issues or anomalies, so we could address them before they affected users. 
For example, AWS Lambda comes with several performance metrics, which serve as a great starting point. 
You can build dashboards that plot how often a function is invoked, including both successful invocations and errors, as well as the time a function spends processing an event. 
Whilst useful information, it doesn't provide you with any further insights about what your users are doing or experiencing. 
When it comes to large distributed systems at scale the most important capability is to "dig" into the data - "slice and dice" it to examine it from different angles.


In the past, and still true for older systems, a lot of random text is often logged to track a user's actions and experiences with the system. 
People can read these logs, but computers struggle to understand and analyse them, making them less effective for building observable systems.


Our Lambda functions emitted **Wide Events** instead of logging random strings. 
A Wide Event is just a JSON document with a collection of key/value pairs. 
Whenever we needed to record some information - whether it's the current state of the system, the result from an API call or a decision the system made given some input parameters - we would emit an event. 
It's important to include as much information as possible in wide events. 
This consists of any relevant data that might be useful later, even if you can't think of its importance now. 
This approach helps to prepare for dealing with unforeseen circumstances that may arise during an incident investigation.


For example, one of the core journeys enabled the public to book a test and retrieve their test results from the laboratory through the COVID-19 app. 
To access their test results, users needed to enter a unique 8-character token, such as `6mwbsfj7`. 
The laboratories would send the randomly generated tokens to users either by email or text message. 
Slowly, over a couple of weeks, we noticed an increase in the number of rejected tokens. 
Structured logs and Wide Events allowed us to write queries and retrace a token's journey through the system. 
More importantly, it enabled us to develop hypotheses about the underlying causes and test if the data supported them. 
We found that Android devices were more likely affected than iOS devices, with the issue impacting users regardless of the COVID-19 app version they used. 
In the end, we concluded that a recent change to the wording and formatting of the text message caused users to copy and paste the wrong token.


```json
{
  "event": {
    "cta_token": "6mwbsfj7",
    "test_result_polling_token": "1e053abb-3409-4e03-9b6b-9c4006547ad8",
    "user_agent": {
      "app_version": {
        "major": 4,
        "minor": 3,
        "patch": 0,
        "sem_ver": "4.3.0"
      },
      "os": "Android",
      "os_version": "29"
    },
  },
  "metadata": {
    "timestamp": "2021-11-24T17:32:27.297448Z", 
    "name":"TestResultNotFound",
    "category": "Info",
    "aws_request_id": "7b4ffa4e-04e0-4747-a2d9-e4d8e50a059e"
  }
}
```

This is just one example, but you can see how powerful Wide Events can be to diagnose issues if you add more context. 
Furthermore, because the events are well-structured and machine-readable, creating dashboards in CloudWatch is straightforward.


In conclusion, we discovered that treating observability as a key feature and integral part of the system allowed us to proactively identify, diagnose, and resolve issues before they escalated into major problems for our users. 
Wide Events enabled us to creatively form hypotheses about underlying causes and write queries to verify them. 
The introduction of events also led to more meaningful conversations with stakeholders about metrics and business events they care about. 

When treated as first-class citizens, events become part of user stories and find their way into unit and regression tests. 
In turn, your monitoring dashboards remain reliable and are less likely to break.

