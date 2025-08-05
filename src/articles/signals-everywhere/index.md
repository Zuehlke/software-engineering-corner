---
title: 'Signals, Signals everywhere'
description: >-
  Signals are emerging as a unifying concept in JavaScript frameworks, offering
  a standardized approach to reactive user interfaces. This fine-grained
  reactivity, inspired by earlier technologies, simplifies state management and
  UI synchronization. The core idea involves special objects that notify
  subscribers of changes and detect dependencies, enabling more transferable
  knowledge across different technologies.
released: '2024-03-04T10:07:45.077Z'
cover: images/cover.jpg
author: Lucas Schnüriger
tags:
  - explained
  - Frontend Development
  - JavaScript
  - Reactivity
  - signals
shortDescription: >-
  Signals revolutionize JavaScript UI development by offering a standardized,
  reactive approach to state management, simplifying cross-framework learning.
---
After decades of JavaScript Wild West exploration with countless frameworks and libraries left in the dust, the recent emergence of Signals is the best thing to happen since ES5.
If you are unsure about what Signals are and why they're important, it's time to learn.

## The Problem

All JavaScript frameworks essentially try to solve one single challenge at their core: **"keeping the UI in sync with the state"** (see [The deepest reason why modern JavaScript frameworks exist](https://medium.com/dailyjs/the-deepest-reason-why-modern-javascript-frameworks-exist-933b86ebc445)).
One way or another, we need to update our visual interface every time the state changes, something React describes as `UI = fn(state)`.

Vanilla JavaScript only gives us rudimentary, imperative APIs to achieve that.
The complexity of an interactive website rapidly grows beyond what is reasonably maintainable without the use of third-party libraries and frameworks.
They provide structured ways to declaratively define our views and manage state.
The synchronisation itself we can leave to the frameworks.
Each framework proposed a new or slightly different way to make our UI reactive, while still providing good developer experience.
Angular uses a conservative change detection algorithm, React introduced the virtual DOM, and Svelte analyses dependencies at build time through a compiler.

All these approaches have their advantages and drawbacks.
In any case, learning a new framework can be tough as it means learning entirely new concepts.
In-depth Angular knowledge is only vaguely transferrable to writing React applications.

But thanks to Signals, this could change forever!
They've already revolutionised the game.

## The Conquest of Signals

[Solid](https://www.solidjs.com) combined the best of many frameworks.
It leverages the power of a compiler like Svelte.
They've adopted React's philosophy of unidirectional data flow and composition.
But for one significant feature, Solid's creator Ryan Carniato went further back in time and took inspiration from Knockout.

Released back in 2010, Knockout presented a reactivity concept they called "observables".
[Knockout describes them](https://knockoutjs.com/documentation/observables.html) as **"special JavaScript objects that can notify subscribers about changes, and can automatically detect dependencies"**.
The examples might look surprisingly familiar for their age:

```js
function AppViewModel() {
    this.firstName = ko.observable('Bob');
    this.lastName = ko.observable('Smith');
    this.fullName = ko.pureComputed(function() {
        return this.firstName() + " " + this.lastName();
    }, this);
}
```

Compare this to Signals in Solid:

```js
function App() {
    const [firstName, setFirstName] = createSignal('Bob');
    const [lastName, setLastName] = createSignal('Smith');
    const fullName = createMemo(() => `${firstName()} ${lastName()}`);
}
```

If we only look at the surface, it seems like the progress of web development in over a decade has been insignificant.
Which of course is not true.
But using fine-grained reactivity is certainly a comeback – and it's a strong one.
Aside from React, all major frameworks have now introduced Signals or a similar concept.

As Ryan Carniato described in his article [The Quest for ReactiveScript](https://dev.to/this-is-learning/the-quest-for-reactivescript-3ka3) in 2021, there are commonly three types of reactivity:

* Reactive State: Signal, Observable, Ref
* Derived Values: Memo, Computed
* Side Effects: Effect, Watch, Reaction, Autorun

The following table is an overview of how the implementation of these types is called in their respective framework.

| Framework | Signals since | Reactive State | Derived Values | Side Effect |
|-|-|-|-|-|
| Knockout | 2010 | observable | pureComputed | computed |
| Svelte | 2016 | writable/readable | derived | – (reactive statements) |
| Solid | 2018 | createSignal | createMemo | createEffect |
| Vue | 2020 | ref/reactive | computed | watch/watchEffect |
| Preact | 2022 | signal | computed | effect |
| Qwik | 2022 | useSignal/useStore | useComputed$/useResource$ | useTask$ |
| Angular | 2023 | signal | computed | effect |
| Svelte 5 | 2024 | $state | $derived | $effect |

Solid made Signals the talk of the town and has done the web community a big favour.
For the first time, we have a robust, coherent, somewhat standardised approach for reactive user interfaces across multiple frameworks.
The web is converging a little.
**Signals have become transferrable knowledge**, making it easier and faster to learn a different technology.
Which brings us – finally – to the question: what are they?

## Signals explained

The core idea is unchanged from Knockout's definition of observables: "special objects, which notify subscribers and can detect dependencies".
A Signal provides a getter and a setter, while other state solutions (like React's `useState`) return the value itself and a setter.
Having a getter means we can **pass the Signal's reference** to other parts of our application, preserving its reactivity.
Calling the getter is secretly subscribing to the value, letting the library deal with managing the subscriptions.

Whether there are two separate functions like in Solid or a single object with a `.value` property (Preact, Qwik, …) doesn't matter.
Those are implementation details and don't change what's happening behind the scenes.

Signals can be used to construct new ones, building a reactive chain.
Instead of applying the same operations on a "raw" Signal in multiple places, we can offer the result itself as a reactive value.

**The secret key to all of this is the side effects, though.**
Without them, nothing would ever happen.
Just having a reactive value doesn't *do* anything.
It's just hanging there until someone asks for its value.
That's exactly what effects do.
They make the (Signals) world go round.
Every time one of its sources changes the effect runs, producing a side effect.
That could be fetching data from an API or … updating the UI.

## Pure Signals Magic

Once you **think about your declarative view template as an effect of the Signals used inside**, the pieces fall in place.
It's, ironically, the essence of React's `UI = fn(state)`.
Let's rephrase it as **`UI = effect(signal)`** and it becomes clear.
We could ditch all the comfort of fancy UI frameworks and stick to just Signals, building our reactive UI.
The following example uses the Preact Signals core library, which can be used without Preact or any other dependencies.

```html
<html>
  <body></body>
  <script type="module">
    import { signal, effect } from "https://cdn.jsdelivr.net/npm/@preact/signals-core@1.5.1/+esm";

    const count = signal(0);

    const paragraph = document.createElement("p");
    const button = document.createElement("button");
    button.innerText = "click me";
    button.addEventListener("click", () => count.value += 1);
    document.body.append(paragraph, button);

    effect(() => (paragraph.innerText = count.value));
  </script>
</html>
```

This is powerful stuff.
We use plain JavaScript to create our elements and leverage Signals to keep them up-to-date with the state.
The outcome of the above example is pretty much the same as the [official Preact Signals example](https://preactjs.com/guide/v10/signals#introduction).
Most of the above code would be hidden by the framework underneath its templating language but it's roughly what happens internally (this is of course heavily simplified).

## Conclusion and Outlook

With reactivity "solved", the core concern of JavaScript UI frameworks going forward will be declarative templating and developer experience.
The main purpose "keeping the UI in sync with the state" **holds no longer true** for them.
It will be more about ergonomics, offering higher-level features (e.g. routing), and integration with the server.
Those aspects have already been the drivers for the so-called "meta-frameworks" like Next.js, Remix, Nuxt, and SvelteKit.
I predict that their underlying frameworks get less important over time.
Choosing for example Svelte over Angular is mostly going to be based on preferences.
Alternatively, you decide on a meta-framework, which has made the choice for you.

Web development is as exciting as ever.
How do you think will Signals influence the future of web development?
Do you think React's long-running dominance will continue, or do you think they should start adding Signals?
I'd love to hear your thoughts!

*Check out the follow-up article, where we build our own [homemade Signals](https://software-engineering-corner.zuehlke.com/homemade-signals)! It gives us a better understanding of why effects are so central.*
