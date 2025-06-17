---
title: Building micro-frontends with Angular and StencilJS
description: >-
  Micro frontends offer a way to decompose monolithic UIs into independently
  deployable and scalable components, aligning the frontend architecture with
  microservices principles. WebComponents offer a standardized approach to
  composing these distributed UI elements, though framework maturity requires
  some manual effort. Stencil.js can be used to create small, efficient
  WebComponent bundles for integration into applications.
released: '2022-12-26T14:31:14.118Z'
cover: images/cover.jpeg
author: Michael Lehmann
tags:
  - Microservices
  - JavaScript
  - Angular
  - Web Development
  - software architecture
---
Micro frontends is an emerging frontend architecture pattern defined by [Martin Fowler](https://martinfowler.com/articles/micro-frontends.html). The pattern slices a web frontend into loosely coupled, scaleable, and independent deployable components.

## From UI monoliths to micro frontends

Traditionally, when building a microservice application, we'll end up in a UI monolith.

![ui-monolith.png](images/1749948088687-2w9l4r4eiix.png)

This hurts because we are losing our benefit from the microservice architecture in the frontend. It might be a drawback which you purposely take into account and pay the price for it.

But with the micro frontends architecture pattern, we have a tool in our hand to bring the microservice pattern into the frontend. Each microservice has its own frontend which gets composed together in a shell web application.

![scs.png](images/1749948088688-x1fvr4jcwvp.png)

## Sharing the layout in self-contained systems

We are using the [self-contained systems](https://scs-architecture.org/) architecture in my current project. This is a special variation of the micro frontend pattern. Self-contained systems consist of multiple scalable and independent deployable web applications which are preferably linked together via HTML.
We were facing the need to share layout components such as header and footer. Or building a dashboard, which integrates widgets from several web applications. We don't want to create libraries or something like that, because it would couple the frameworks and their versions to the applications. The micro frontend pattern is exactly what we need.

This sounds great. Unfortunately, the technologies (i.e. the web frameworks) did not catch up yet. And because Angular, React and VueJs are not ready for this scenario, a lot of manual work is required to compose a micro frontend application.

## Techniques to compose the UI with micro frontends

So let's have a look at our approach for building micro frontends supporting our self-contained systems. We are using Angular in our web applications. I don't want to discuss the framework decision in this article. It was more or less given by the knowledge of the team.

There are multiple ways how we can compose micro frontends together:

* Integrate the HTML via iFrame. This is quite old school, but it works. iFrame integration sounds easy, but I spent a lot of time in the past on sizing and responsiveness working across the applications.

* Load and integrate the HTML via vanilla javascript. This is very painful to get it right. HTML requires JavaScript files, styles etc. It is a lot of manual work to load everything and make it work.

* A modern approach would be integrating them via WebComponents. Web components can be loaded dynamically at runtime and is a standardized way of doing that with vanilla JS. And there are plenty of frameworks out there to build WebComponents.

We decided to go for WebComponents. WebComponents are standardized and it seems to be the most painless approach. Browser support is not an issue anymore. In the meanwhile, most of the browsers caught up or have been abandoned.

## Finding the right WebComponent framework

After that decision, we needed to find a suitable framework to build the WebComponents. It is possible to build WebComponents with Angular by using Angular Elements. Using Angular would be a good fit because the whole team knows and is developing Angular. Unfortunately, Angular Elements build a complete Angular application into the WebComponents, which results in rather large bundles.

I compared the bundle sizes a while ago. I used [ngx-build-plus](https://github.com/manfredsteyer/ngx-build-plus) to build a single file Angular Elements bundle. Stencil.js outputs a bundle per WebComponent.

For my example, I got the following values (round in kB):

* Angular: 186 kB
* Stencil.js: 13kB

This is quite shocking. The Stencil.js bundle size is only around 24% of Angular Elements bundle size.

With this result, we decided to implement our layout components with Stencil.js.

## Create a Stencil project

Let's have a look at our setup with StencilJS and the integration in our Angular applications. We are using [NX](https://nx.dev/) for our UI workspaces. Let's create an NX workspace with a StencilJS project.

First, we create the NX workspace with typescript presets:

```bash
npx create-nx-workspace my-workspace --preset=ts
```

Afterward we are going to create a Stencil project in our freshly created NX workspace by using the NX plugin from [Nnext](https://nxext.dev/docs/nxext/overview.html):

```bash
npm install @nxext/stencil --save-dev
nx g @nxext/stencil:library my-lib
```

The Nnext plugin provides a generator that allows to create our first component:

```bash
nx g @nxext/stencil:component my-header --project my-lib
```

This outputs a component skeleton like this:

```ts
@Component({
  tag: "my-header",
  styleUrl: "my-header.scss",
  shadow: true,
})
export class MyHeader {
  @Prop() first: string;
  @Prop() middle: string;
  @Prop() last: string;

  private getText(): string {
    return (
      (this.first || "") +
      (this.middle ? ` ${this.middle}` : "") +
      (this.last ? ` ${this.last}` : "")
    );
  }

  render() {
    return <div>Hello, World! I'm {this.getText()}</div>;
  }
}
```

I will not be going to write a StencilJS tutorial at this place. But one thing I need to mention. Stencil provides several [output targets](https://stenciljs.com/docs/output-targets). We actually want to have a single file bundle which would be the `dist-custom-elements-bundle` out target. Unfortunately, this has been deprecated. We use its successor `dist-custom-elements`. It does basically the same thing but produces a js file per component. This is the better way because it is better to load several smaller bundles than a large one. It will also be better for leveraging `http2`. We would prefer a single file because it means less file handling in our frontends, but we can work with that.

```json
outputTargets: [
  {
    type: 'dist-custom-elements',
  },
];
```

Finally, we are deploying these output files in an Azure Blob Storage. But any static hosting would do the job.

It sounds that easy, but nobody on our team had a real experience in StencilJS and especially in lazy load them in an Angular application. One problem worth mentioning is the handling of assets. If the component uses assets that get deployed, you need to make sure to load them with an absolute path. **Relative paths get resolved to the URL where the application is deployed**. We solved the problem by compiling everything (e.g. SVG icons and JSON translation files) into the bundle. This way, we don't need to load them during the runtime.

## Consuming the WebComponents dynamically during run time

After creating and deploying our WebComponents, they need to be integrated into the frontend of our applications. A simple script element loading js bundle will do the job. Then we just can use the custom element:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/my-name@0.0.1/dist/myname.js"></script>
<my-header></my-header>
```

We found a nice library, [Angular Extension Elements](https://angular-extensions.github.io/elements/#/home), which makes it even easier to lazy load elements in Angular. It also supports displaying special components for the loading and error cases.

```html
<my-header
  *axLazyElement="headerUrl; errorTemplate: errorHeader; loadingTemplate: loading; module: true"
></my-header>
```

One thing which needs to be done to make this work is defining the custom elements schema on the corresponding Angular module.

```ts
@NgModule({
  declarations: [...],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [LazyElementsModule],
})
```

That is basically everything you need to dynamically compose a web application during the runtime.

## Summary

Micro frontends allow us to split a UI monolith apart. Every micro service provides its own UI components which get composed in a shell application. With that, we reduce the coupling between our applications and services to a minimum. And to a point where doesn't hurt very much, due to the loose coupling via links and UI composition.
