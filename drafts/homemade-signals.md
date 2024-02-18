---
title: Homemade Signals
subtitle: "Let's look behind the curtain and build our own JavaScript Signals"
domain: software-engineering-corner.zuehlke.com
tags: signals, web-development, javascript, frontend-development, reactivity, guide
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1708269071670/uuXEcIHgR.jpg?auto=format
publishAs: culas
hideFromHashnodeCommunity: false
saveAsDraft: true
---

_First off: the code in this post is not intended to be used for production level application but rather solely serve educational purposes._

In [a previous blog post](https://software-engineering-corner.zuehlke.com/signals-signals-everywhere), we explored where Signals came from, what they are and how they took over the frontend ecosystem.
We already saw that it simplifies keeping the UI in sync with the state in a straightforward way, even if we skip using any other libraries.
Today, we go one step further.
We are building or own rudimentary Signals in an attempt to understand the underlying mechanisms.
This exercise had been extremely valuable for me.

## Quick Recap

Signals have taken over the the world of frontend frameworks.
Just about every framework except React has adopted some form of Signals in the past two years and it looks like they're to stay.

JavaScript frameworks try to solve the challenge of keeping the UI consistent and up-to-date with the state.
After exploring a wide range of solutions, we seem to have arrived at a point where most agree Signals to be an essential piece to the puzzle.
They are special JS objects that can notify suscribers about changes.
We can pass around a Signal without it losing reactivity and we don't need to explicitly subscribe or clean up our subscriptions.
There are three types of reactivity: reactive state, derived values and side effects.

Effects make everything move, as they produce a side effect every time a source Signal changes.
This allows frameworks to rerender relevant parts of the UI much more efficiently than elaborate change detectors or by comparing virtual DOM trees.

## Basic Reactive State

The first element we're implementing is the elementary building block: a Signal.
This initial version is just going to be a simple wrapper aroud a value with accessor functions.

```js
function signal(initialValue) {
    let _value = initialValue;
    return {
        get value() {
            return _value;
        },
        set value(newValue) {
            if (newValue !== _value) {
                _value = newValue;
            }
        }
    }
}
```

It doesn't notify anyone reading the value yet.
But we can pass its reference around and always get the up-to-date value whenever we read it.
This is so far only really useful for primitive values, since JavaScript passes them by value.

```js
const counter = signal(0);
counter.value += 1;
console.log(counter.value); // 1
```

## Derived Values

Signals that are derived, or _computed_, from other Signals is an importation use case.
We want to be able to use them like this:

```js
const counter = signal(0);
const double = computed(()= => counter.value * 2);
```

Due to their calculated nature, we only need them to be readable, not writable.
We want it to re-run the given computation every time we read it.
A very simple version could look something like the following:

```js
function computed(computation) {
    return {
        get value() {
            return computation();
        }
    }
}
```

## Fuel the Engine with Effects

Side effects are essentially the part that makes Signals move and brings our applications to live.
Unlike computed Signals, an effect doesn't return anything.
We're not assigning effects to some variable but want it to _do_ something for us every time there's a change in the dependency tree.
The most basic variation could look like this:

```js
function effect(fn) {
    fn();
}
effect(() => console.log(`${counter.value} * 2 = ${double.value}`));
```

This would run the function once and print `0 * 2 = 0`.
But how are we now making everything actually reactive?
We need some way to subscribe to changes in the source Signals without adding anything to the API.
This eliminates the (often in examples used) option of a `subscribe` method, as it defeats the purpose of ergonomic, minimalistic reactive values.
So we need to look at it from the other side.
Whenever a Signal's value is requests, it has to somehow know, who asks for it.
JavaScript doesn't have any built-in mechanism to inspect the call-stack, which means we track it ourselves.

```js
let caller;
```

This global variable will keep track of the effect function currently running.
Of course the real solution frameworks have found are a little more sophisticated and safer than exposing a global variable.
At minimum it'd be a top-level variable inside an ES module with the Signals logic inside.
For simplicity's sake, let's run with this basic single-file version and add the necessary code to the signal and effect functions.

```js
function signal(initialValue) {
    let _value = initialValue;
    const observers = [];
    return {
        get value() {
            if (caller && !observers.includes(caller)) {
                observers.push(caller);
            }
            return _value;
        },
        set value(newValue) {
            if (newValue !== _value) {
                _value = newValue;
                observers.forEach(fn => fn());
            }
        }
    }
}

function effect(fn) {
    caller = fn;
    fn();
    caller = undefined;
}
```

Before running the function initially, the effect saves the function's reference in the `caller` variable.
If there is a read access to a signal inside the callback, it will run the value accessor function.
Inside the getter, we now check whether the signal's value is being access by an effect by looking at `caller`.
It's our way of inspecting the call-stack.
We can then add the caller to the list of observers.
Afterwards, `caller` gets unset and the reactive effect is set up.
This whole process only works that easily because JavaScript is single-threaded and `caller` can't be changed by any parallel thread during the `effect` function.

This rudimentary implementation also explains why an explicit read operation inside an effect is absolutely necessary.
Without it, no subscribing would happen.

## Push and Pull

Whenever a new value is assigned to the Signal, it notifies all observing effects.
Contrary to Observables of RxJS and similar libraries, the Signal is not directly passing its new value to subscribers (push principle).
Instead, it's just triggering all the functions it's been accessed from initially.
This way they re-evaluate all their dependencies and ask for the values (pull principle).

Why is this relevant?
The effect might have not called a Signal directly but rather used a computed reactive value.
The source Signal's value would be of no use for the effect.
By just running the effect all Signals (whether computed or not) and side-effects are being executed, resulting in consistent behaviour.

## The Hard Bits

This basic example is enough to have basic functioning Signals.
But by any means, please don't go and build your apps with this.
There are many more concerns that need to be considered, that we're not exploring today.
Just to name a few: unsubscribing / clean up, addressing the diamond problem (explained in-depth in [Super Charging Fine-Grained Reactive Performance](https://dev.to/modderme123/super-charging-fine-grained-reactive-performance-47ph) by Solid's core member Milo), scheduling, preventing infinite loops.
Those are arguably much harder problems to solve but I don't consider them essential to get a basic grasp of how and why Signals work.

## Conclusion

With only a few lines of code we built a fully reactive system of Signals including computed values and side-effects.
The core concept is effects, which get subscribed to the source Signals by using JavaScript's single-threaded nature.
The reality is a lot more complicated than that, but I believe this to be just enough to get a basic understanding of the mechanisms in play.
I hope it cleared up some confusion or questions about Signals.
Building my own Signals had resulted in a couple of lightbulb moments for me.
Thanks to Maarten Bicknese, [his deep dive article about Signals](https://www.thisdot.co/blog/deep-dive-into-how-signals-work-in-solidjs) got me on the right path.
Leave me a comment, what you thought about this article and where it might have helped you.

## Bonus: our own UI framework

Because building my own Signals had me excited, I continued on to see whether my explanation of `UI = effect(signal)` from the first article holds true.
I built a quick UI framework prototype based solely on Signals with a declarative, functional interface.
To my suprise, everything I tried just worked.
Check out the full code including an example in my [GitHub Gist](https://gist.github.com/culas/96664bda9249a98f36c26bc79c1c2f62).
The entire rendering is based on effects and only uses vanilla JavaScript.
Let me know, if you would be interested in a walkthrough.
