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

_First off: the code in this post is not meant to be used for production-level application but serves an educational purpose._

In [a previous blog post](https://software-engineering-corner.zuehlke.com/signals-signals-everywhere), we explored where Signals came from, what they are, and how they took over the frontend ecosystem.
We already saw that they simplify keeping the UI in sync with the state, even if we skip using any other libraries.
But today, we're taking it one step further.
We are building rudimentary Signals from scratch to understand the underlying mechanisms.
This exercise has been massively valuable for me.

## Quick Recap

Signals have taken over the world of frontend frameworks.
Just about every framework except React has hopped on board with this concept over the past two years, and it looks like Signals are here to stay.

JavaScript frameworks try to solve the challenge of keeping the UI consistent and up-to-date with the state.
They are special JS objects that can notify subscribers about changes.
We can pass around a Signal without it losing reactivity.
There are three types of reactivity: reactive state, derived values, and side effects.

Effects are the powerhouses that make everything move, as they produce a side effect every time a source Signal changes.
That allows frameworks to re-render relevant segments of the UI much more efficiently than elaborate change detectors or by comparing virtual DOM trees.

And now, off to building Signals ourselves.

## Basic Reactive State

The first element we're implementing is the elementary building block: a Signal.
This initial version is just a simple wrapper around a value with accessor functions.

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
That is so far only useful for primitive values since JavaScript otherwise passes them by value.

```js
const counter = signal(5);
counter.value += 1;
console.log(counter.value); // 6
```

## Derived Values

Signals that are derived, or _computed_, from other Signals are an importation use case.
We want to be able to use them like this:

```js
const counter = signal(5);
const double = computed(()= => counter.value * 2);
console.log(double.value); // 10
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

So far we get the current value if we ask for it (pull principle), but nothing happens after a Signal changes.

## Fuel the Engine with Effects

Side effects are essentially the part that makes Signals move and brings our applications to life.
Unlike computed Signals, an effect doesn't return anything.
We're not assigning effects to some variable but want it to _do_ something for us every time there's a change in the dependency tree.
The most basic variation could look like this:

```js
function effect(fn) {
    fn();
}
effect(() => console.log(`${counter.value} * 2 = ${double.value}`));
```

This would run the function once and print `5 * 2 = 10`.
But how are we now making everything reactive?
We need some way to subscribe to changes in the source Signals without adding anything to the API.
This eliminates the (often in examples used) option of a `subscribe` method, as it defeats the purpose of ergonomic, minimalistic reactive values.
So we need to look at it from the other side.
Whenever a Signal's value is requested, it has to know who asks for it.
JavaScript doesn't have any built-in mechanism to inspect the call stack, which means we track it ourselves.
And that's a simple as this:

```js
let caller;
```

This global variable `caller` will keep track of the effect function currently running.
Of course, the real solutions frameworks have found, are a little more sophisticated and safer than exposing a global variable.
At a minimum, it'd be a top-level variable inside an ES module with the Signals logic.
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
Inside the getter, we now check whether the signal's value is accessed from an effect by looking at `caller`.
It's our way of inspecting the call stack.
We can then add the caller to the list of observers.
Afterwards, `caller` gets unset and the reactive effect is set up.
This whole process only works because JavaScript is single-threaded, and `caller` can't be changed by any parallel thread during the `effect` function.

We don't have to change anything in `computed`, since computed Signals will just rerun the computation every time their value is accessed.

This rudimentary implementation also explains why an explicit read operation inside an effect is necessary.
Without it, no subscribing would happen.

## Going for a Test Drive

Let's put our code to the test by creating a very simple button, which increases the counter by one on each click.

```js
const counter = signal(0);

const button = document.createElement('button');
document.body.append(button);

// this is our trigger which changes the Signal's value
button.addEventListener('click', () => counter.value++);

const updateButton = () => button.innerText = counter.value;

// whenever counter changes, we update the button's text
effect(updateButton);
```

When this code runs initially, it will create a simple HTML button and attach our click handler.
Once the effect function runs, the following process initialises the reactivity:

1. `updateButton` is internally assigned to `caller`
2. `updateButton` is executed by the effect, which then calls the getter of our `counter` signal
3. the getter sees the function in `caller` and adds it to the list of observers, then the Signal's value is returned
4. `updateButton` assigns the received value to the button's inner text.
5. the effect resets `caller`

On each click, the Signal's setter will call each observer and thus re-execute `updateButton`.
During subsequent calls of `updateButton`, `caller` is undefined.
Therefore the function is not added again, but rather just receives the new value.

See the full working code in a single HTML file in my [GitHub Gist](https://gist.github.com/culas/96664bda9249a98f36c26bc79c1c2f62#file-01-signal-html).

## Push and Pull

Whenever a new value gets assigned to a Signal, it notifies all observing effects.
Unlike Observables of RxJS and similar libraries, the Signal doesn't directly pass its new value to subscribers (push principle).
Instead, it just triggers all the functions it was accessed from initially.
This causes them to re-evaluate all their dependencies and request the values (pull principle).

Why is this relevant?
The effect may not have called a Signal directly but rather used a computed reactive value.
The source Signal's value would be of no use for the effect.
By simply running the effect, all relevant Signals (whether computed or not) and side effects are executed, resulting in consistent behaviour.

## The Hard Bits

This basic example is sufficient to create basic functioning Signals.
However, please don't go and build your apps with this.
Many more concerns need to be taken into account, which we're not exploring today.
Just to name a few: unsubscribing/clean up, addressing the diamond problem (explained in-depth in [Super Charging Fine-Grained Reactive Performance](https://dev.to/modderme123/super-charging-fine-grained-reactive-performance-47ph) by Solid's core member Milo), scheduling, and preventing infinite loops.
These are arguably more challenging problems to solve but are not essential to gaining a basic grasp of how and why Signals work.

## Conclusion

With only a few lines of code, we created a fully reactive system of Signals including computed values and side effects.
The main concept is effects, which are subscribed to the source Signals by leveraging JavaScript's single-threaded nature.
Although the reality is more complex, this should be just enough to achieve an understanding of the mechanisms in play.
Building my own Signals resulted in some lightbulb moments for me.
[Maarten Bicknese's deep dive article about Signals](https://www.thisdot.co/blog/deep-dive-into-how-signals-work-in-solidjs) got me on the right path.
Leave a comment about what you think about this experiment and where it might have helped you.

## Bonus: our own UI framework

Because building my own Signals had me excited, I continued to see whether my explanation of `UI = effect(signal)` from the first article holds.
I built a quick UI framework prototype based solely on Signals with a declarative, functional interface.
To my surprise, everything I tried just worked.
Check out the full code including an example in my [GitHub Gist](https://gist.github.com/culas/96664bda9249a98f36c26bc79c1c2f62#file-02-signal-framework-html).
The entire rendering is based on effects and only uses vanilla JavaScript.
