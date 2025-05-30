---
title: Feature Flags in Angular
subtitle: "Crafting a Custom Feature Flag Setup in Angular"
domain: software-engineering-corner.zuehlke.com
tags: angular, web-development, javascript, frontend-development, guide
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1732888744339/n2T03yjCA.jpg?auto=format
publishAs: zemph
hideFromHashnodeCommunity: false
saveAsDraft: true
---

# Feature Flags in Angular

_Disclaimer: On a project I am currently working on, I introduced feature flags and created a setup in Angular that works great for us. 
With this post I would like to share the results with you._

## What are feature flags
In the most basic form, you can think of feature flags as a remote configuration consisting of features and their state (enabled / disabled). 
This configuration can be updated during the runtime of the application to  manage gradual rollouts, A/B tests, and quick rollbacks, improving flexibility and reducing risk.


## Tooling

There are many tools available for adding feature flags to your project. 
The only requirement is a request, which returns a list of feature-flags with their current state. 
This could even be done by hosting a static JSON file somewhere which can easily be updated. 

## Goal

In this article we are going to implement following three feature flags:
 - toggling the injection of an external analytics script into the DOM
 - showing/hideing an advertisement banner within our application
 - enabling a route to a new feature

## Setup

Before we jump into the examples, we first need a setup to manage and use feature flags in our app. We'll define some types for better structure, set up default values, and create a way to fetch and provide the flags throughout the app.

### Type Safety

To keep things simple and avoid mistakes, it’s helpful to define a clear structure for our feature flags. This way, we know exactly what flags are available.

```js
// feature-flag.model.ts

export type FlagKey = 'analytics' | 'banner' | 'route';

export type Flag = {
  readonly key: FlagKey;
  readonly enabled: boolean;
}

export type FlagMap = {
  readonly [key in FlagKey]: Flag;
};
```
