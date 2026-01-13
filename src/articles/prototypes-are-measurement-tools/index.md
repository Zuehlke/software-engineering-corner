---
title: Every Prototype Is Also a Measurement Tool
description: >-
  Prototypes are often built with the finished product in mind, yet their most critical role during development is frequently overlooked: enabling measurement and insight. 
  Effective development depends on access to complete, time-synchronized raw sensor data, actuator commands, and internal states to understand system behavior and debug efficiently. 
  Treating prototypes as measurement instruments from day one influences architecture, interfaces, and component choices—especially in complex or distributed systems. 
  Early investment in logging and measurability reduces risk, shortens development cycles, and turns iteration into a systematic, data-driven process.
released: '2026-01-13T10:22:39.140Z'
cover: images/cover.jpg
author: Markus Grün
tags:
  - product development
  - system architecture
  - debugging & testing
  - measurement & logging
shortDescription: >-
  Designing prototypes without measurability turns development into guesswork.
  Treating them as measurement instruments from day one enables faster debugging and more reliable iteration.
---

For more than a decade, I’ve been developing devices for a wide range of customers and applications. 
In many projects, I’m responsible for system integration, commissioning, and testing throughout development. 
Whether it’s a completely new, innovative product or the next iteration of an existing one, I keep seeing the same pattern.

Right from the start — during requirements definition, system architecture, and in early functional prototypes — one crucial element is often overlooked. 
And this happens regardless of whether you’re developing an electric toothbrush, a coffee machine, or a medical ventilator.

From day one, the device is designed with the finished product in mind. 
What's often forgotten is this: the path to that finished product is long, full of unknowns that must be explored, understood, and — most importantly — measured. During development, the final product doesn’t exist yet. 
It only emerges through countless iterations, tests, measurements, debugging loops, and insights.

## The missing piece: measurability during development

Especially in early phases, core functions of the device often need to be explored experimentally. 
Proofs-of-concept usually only answer a simple question: _Does it work at all?_ How it works in detail only becomes clear over the course of the project.
A colleague once told me:

_“We’re building a tea machine, not a measurement device.”_

He was right — and wrong at the same time. 
Yes, the end user doesn’t need raw sensor data, actuator commands, or internal states. 
The same is true for production and end-of-line testing.

But for development, the opposite is true.

System integrators and engineers need access to all relevant signals — and since nobody knows at the beginning which signals will turn out to be relevant later, "relevant" effectively means *everything*. 
All raw sensor data, all actuator control values, all internal states (such as state machine states), ideally at the native sampling rate. 
Only with this level of visibility can you truly understand system behavior, develop features efficiently, analyze bugs, and systematically identify root causes.

## Turning prototypes into measurement instruments

For a prototype to also serve as a measurement tool, it must be able to output its raw data. 
The specific interface is largely irrelevant.
What matters is completeness and proper time alignment.

Personally, I prefer streaming CSV data over UART, for a few simple reasons:
* Almost every microcontroller has at least one UART
* Retrieving the data is straightforward (every software developer has a USB-UART adapter lying around)
* Logging is platform-independent (Putty, CoolTerm, etc.)
* CSV is human-readable
* CSV can be processed directly with almost any tool (Python, Excel, MATLAB, …)
Most importantly, the output must be synchronized to the system clock, ideally by including timestamps. 
Without proper timing, measurement data quickly becomes ambiguous and hard to interpret.

## When data volume becomes a problem

In complex systems with many sensors and actuators, data volume can quickly become a bottleneck — especially at high sampling rates. 
UART interfaces reach their limits quickly. 
At 460,800 baud and a 1 kHz sampling rate, only approximately five values per cycle can be transmitted (assuming roughly 8 bytes per value for decimal ASCII representation).
Even with compact 16-bit values, the situation isn’t much better.

There are several strategies to handle this:
1.	**Increase the data rate:**  
Modern microcontrollers can handle several Mbaud, though this may require DMA support and early architectural planning. In some cases, it even makes sense to use a more powerful processor during development than in the final product.
2.	**Use a more efficient data format:**  
Formats like protobuf or CBOR are far more efficient but no longer human readable and require more effort during analysis.
3.	**Downsampling:**  
If the signal characteristics allow it, transmitting only every nth sample can significantly reduce bandwidth.
4.	**Selective logging:**  
Developers choose only the signals relevant for the current measurement. This requires more logic and user interaction.
5.	**Event-based logging:**  
Useful for signals that change infrequently (e.g., system states). Harder to use with CSV because timestamps must be transmitted.
6.	**Separate channels:**  
High-frequency signals can be streamed over dedicated interfaces, slower ones over shared channels.

The key takeaway: logging must be considered from the very beginning — during system architecture design, hardware design, and even component selection — to avoid performance issues later.

## Distributed systems: logging across multiple controllers

Modern devices often consist of several microcontrollers forming a distributed system.
Not all sensors and actuators are connected to the same CPU.
There are two common logging approaches:

1.	**Centralized logging:**  
All controllers send their data to a main processor, which handles the logging.
2.	**Decentralized logging:**  
Each controller has its own logging interface.

Both approaches can work — but only if the architecture supports them. 
Once again, this brings us back to early design decisions. 
Inter-controller communication must either be designed for the required data volume and frequency, or the main processor must provide a system clock or heartbeat that other controllers can synchronize to. 
These are not details you want to figure out late in the project.

## Why logging must be planned from day one

Implementing a solid developer interface is straightforward when it’s part of the original system architecture.
If it’s added late in the project, the result is usually:

* significant additional effort
* lengthy discussions and resistance
* in some cases, fundamental architectural changes

A well-designed early concept saves time, makes the project more robust, and — most importantly — accelerates development.
Debugging becomes painful when you can’t see what’s happening inside the system.

## Example: logging in a highly complex distributed system

In one of my recent projects, I was fortunate: a logging function already existed, though not in the required scope.
Extending it was accepted without much resistance.
Still, it became clear once again that retrofitting logging late is far more work than planning it upfront.

The device consisted of several distributed processors that preprocessed sensor data before sending it to a main CPU.
For logging, this introduced two challenges:

1.	In addition to processed data, raw sensor data now also had to be transmitted to the main CPU.
2.	The raw data had a higher sampling rate than the processed signals.

As a result, the entire data path — both between processors and in the logging output — had to be reworked to support native-rate raw data logging.
It took more than a week of unplanned work before all raw data finally appeared correctly at the logging interface.

## Example: pressure sensor calibration during operation

The same project also showed why logging actuator commands is just as important as logging raw sensor data — both at native frequency and fully time-synchronized.

A pressure sensor needed to be calibrated regularly during operation.
The calibration-related downtime had to be limited to just a few milliseconds.
For calibration, valves temporarily switched the sensor to a reference pressure.
This caused pressure transients that had to settle before calibration was possible.
Switching back introduced additional disturbances that affected the actual measurement signal.

Only by logging all raw sensor data and control signals with precise time alignment was it possible to determine exactly when switching and calibration should occur and when the sensor returned to stable readings — and therefore how fast the calibration cycle could realistically be.

## Conclusion: Every Prototype Is a Measurement Instrument — Or Should Be

A prototype that “works” is useful.\
A prototype that is measurable is invaluable.

Without complete and correctly timed measurement data, debugging becomes guesswork and optimization becomes trial and error. Planning a clear developer interface early saves time, reduces frustration, and dramatically accelerates product development.

Or, to put it another way:
We’re not just building a tea machine. First, we’re building a measurement instrument.

