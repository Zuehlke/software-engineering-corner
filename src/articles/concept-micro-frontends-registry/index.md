---
title: A conceptual idea for building a registry to access micro frontends
description: >-
  The challenge of managing widget configurations in a self-contained system
  architecture is explored, specifically the complexities arising from multiple
  CDNs per service and stage. Two potential solutions are considered: leveraging
  a reverse proxy for routing or introducing a dedicated registry service for
  micro frontends. Each approach presents trade-offs between configuration
  simplicity and system complexity.
released: '2023-03-06T10:18:09.897Z'
cover: images/cover.jpg
author: Michael Lehmann
tags:
  - Microservices
  - frontend
  - Web Development
  - software architecture
  - Frontend Development
---
This time I am not going to write about experiences I made in my daily life as a software architect and developer. But I will dump my brain about something that currently flutters around in my head. This is more of conceptual nature.

## What's pinching me?

So, what is the problem that makes me write this article? In my current project, we are working with a [Self Contained System Architecture](https://scs-architecture.org/), short SCS. Combined with a minimal [Micro Frontend](https://micro-frontends.org/) approach. We dynamically integrate web components from other SCS to keep the responsibility of rendering the data in the SCS where the corresponding data belongs to. In the project, we generally are talking about *widgets*.

![Self Contained Systems with Widgets](images/1749948026642-adyfl2dwpk.png)

This is not the problem, it works like a breeze and solves our dependency issues and decouples used technologies and frameworks. What concerns me more is the way we are configuring the URLs of the JavaScript bundle files to integrate those widgets.

These web components get built into a single bundle file and are hosted in a CDN on Azure. In our architecture, every SCS has its completely separate tech stack and hosting environment. So every SCS has its own CDN. Even worse, we separate every stage as well. This means we have actually a CDN per SCS per stage.

So we need to configure the URL of the widgets and the API endpoints they are using environment specific. Our current approach is configuring it by ASP.Net Core app settings.

```json
{
  "ClientConfiguration": {
    "SCS_A": {
      "BundleFileUrl": "http://localhost:4600/dist/components/",
      "ApiBaseUrl": "http://localhost:5600/dist/components/"
    },
    "SCS_B": {
      "BundleFileUrl": "http://localhost:4700/dist/components/",
      "ApiBaseUrl": "http://localhost:5700/dist/components/"
    }
  }
}
```

To load those settings into the Angular frontend we provide an API endpoint. At the end, we render the web component with the [Angular Extensions for Lazy Elements](https://angular-extensions.github.io/elements/#/home).

```html
<some-element *axLazyElement="bundleFileUrl" [backend-api]="apiBaseUrl"> </some-element>
```

At the time of writing this, we don't have a lot of widgets. But it keeps growing and I am afraid to get a mess with this configuration approach. How can we make sure the configurations are consistent across the whole system? How can we avoid to adding so many configurations in our app settings to keep it readable? How can we avoid to keep repeating those configurations again and again?

## How could we solve this problem?

I have basically two solution approaches in my mind.

1. We leverage a reverse proxy or an API gateway to do the routing to the correct CDN and file.
2. We introduce a *registry* for our micro frontends.

Both are viable solutions and have their advantages and disadvantages.

### Use a reverse proxy to decouple the routing configuration from the SCS

We are actually already using the *Azure Front Door* reverse proxy. We could extend its routing configuration in order to route the URL of the JavaScript bundle automatically.

This would have the advantage, that we don't need to configure an url in the SCS at all. Since we are using SPA web applications, our frontends are running in the browser of our user. We could just simply use relative paths to address the JavaScript file. E.g. `/SCS_A/widgets/main.js`. And we would also leverage existing infrastructure.

But I see the disadvantage that we need to address the URL and especially the bundle file name explicitly. Which introduces kind of a coupling to that and would require a code change with deployment to adjust that. One of the drivers to adopt the SCS architecture is actually to avoid deployment of the full system when only something small has changed.

Additionally, we just move the configuration hell to the reverse proxy. This piece of software is made for that, but we want to keep it as simple as possible as well.

### Introduce a registry for our micro frontends

Well, the other idea would be introducing a service which is dedicated to solve this problem. If we have a look at some micro frontend frameworks such as [Single SPA](https://single-spa.js.org/) we can see some similar patterns.

```js
registerApplication(
  "app2",
  () => import("src/app2/main.js"),
  (location) => location.pathname.startsWith("/app2"),
  { some: "value" }
);
```

What I like about this approach is the commitment to the *single responsibility* principle. We would have a service that is explicitly designed and dedicated to this task. It would also be possible to decouple the full URL from the code but still avoid the configuration in the SCS applications.

```ts
const microServiceConfig: { bundleFileUrl: string; backendApiUrl: string; } = registry.resolveMicroFrontendConfig(key: 'scs_A_widgets');
```

This approach also has its downside. We trade the simplicity of the SCS configuration against increasing the complexity of our system. It would be a quite proper solution. Is it worth the extra complexity? We haven't decided yet.

## Final words

As I stated at the beginning. This is just dumping out of my brain. We might tackle this problem in the near future but until now we didn't talk about that yet.

What do you think? What is your opinion? Do you have some experience in this topic? Is there a better solution approach?

Please leave your comments and discuss it with me.
