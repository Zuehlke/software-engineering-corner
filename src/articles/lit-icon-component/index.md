---
title: Creating an icon web component with lazy loading in LitElement
description: >-
  The process of building a custom icon component using LitElement is explored,
  focusing on lazy loading icons for improved performance. The approach involves
  using dynamic imports and a custom plugin to compress SVG files, remove
  unnecessary elements, and optimize attributes. The solution also addresses
  color customization by setting the fill attribute to `currentColor` for easier
  styling.
released: '2023-01-23T10:06:16.554Z'
cover: images/cover.jpeg
author: Patrick Walther
tags:
  - CSS
  - Sass
  - Web Development
shortDescription: >-
  Learn to create a lazy-loading icon web component using LitElement. This guide
  covers loading SVGs, dynamic imports, and optimizing SVG assets with
  compression.
---
Recently we started working on a design system at one of our customers. One of the components we had
to create quite early in the process was an icon component loading their custom icons.

Since there is a considerable amount of icons, we wanted to make sure, that they are loaded lazily.
As a tool to write our web components we use [LitElement](https://lit.dev/docs/) without any other ui framework around it.
Therefore, we set out to implement our own custom small and simple lit component meeting these
requirements.

## Setup

In this blog post I'm going to work with vite as the bundler and dev server. Everything mentioned
should be possible with any bundler but the code I'm going to show is going to be vite-specific.

## Loading SVGs

First off, we have to find out how to easily load an SVG file and render it in LitElement. This
turns out to be fairly simple since LitElement provides a handy function called `unsafeSVG`. This
function allows us to parse SVG as a string and properly render it. All we need to do now is load
the SVG as a string. With vite this looks like this:

```javascript
import icon from './assets/icon.svg?raw';
```

The `?raw` will tell vite to load the file as a raw string. Together this will look something like
this:

```typescript
import {customElement} from 'lit/decorators.js';
import {LitElement} from 'lit';
import icon from './assets/icons/icon.svg?raw';

@customElement('dsc-icon')
export default class Icon extends LitElement {
  protected render() {
    return unsafeSVG(icon);
  }
}
```

## Lazy Loading

We saw how to load one icon. What we need for our component is to load any given icon lazily. For
this we need to add a property which can be passed from outside the component and a dynamic import.

```typescript
import {customElement, property} from 'lit/decorators.js';
import {LitElement, nothing} from 'lit';
import {until} from 'lit-html/directives/until.js';

@customElement('dsc-icon')
export default class Icon extends LitElement {
  @property({type: String})
  public icon?: string;

  protected render() {
    const importedIcon = import(`../assets/icons/${this.icon}.svg?raw`)
      .then(iconModule => unsafeSVG(iconModule.default));
    return until(importedIcon, nothing);
  }
}
```

The dynamic import will return a promise with the loaded module. Our SVG string will be the default
import, therefore we need to access the `default` property on this loaded module. What vite will do
here is scan the folder in the dynamic import with the given partial filename and create modules for
all files that could match it. At runtime, it will be able to load the right files dynamically. It's
important to note, that vite will only scan this folder and no descendants of it.

LitElement provides a neat little directive `until` that will display something until a given
promise is resolved. For now, we will just return `nothing`. This may lead to unwanted layout shifts
later but for our first test this should be good enough.

## Adding compression

After looking at this first implementation, we saw that the SVG is loaded without any change to the
content. We would like to add compression in multiple ways:

1. Remove white space and new lines
2. Remove unnecessary tags like `title` or `desc`
3. Remove redundant, useless or deprecated attributes

After some research we found most current plugins for vite create either react or vue components out
of the loaded SVGs. We only want the raw string for LitElement, so we decided to write our own small
plugin using the well-known [SVGO](https://github.com/svg/svgo) library for the compression part.
You can check it out here if you're
interested: [vite-plugin-svgo](https://github.com/r3dDoX/vite-plugin-svgo).

So all we have to do is declaring the plugin in our `vite.config.ts`:

```typescript
import {defineConfig} from 'vite';
import svg from 'vite-plugin-svgo';

export default defineConfig({
  // rest of config omitted
  plugins: [
    svg(),
  ]
});
```

This will let vite load SVG files and compress them on the fly. Since the plugin is now able to load
SVG files without any flag we can get rid of `?raw` and let our plugin decide how to handle SVG
files properly.

```typescript
import(`../assets/icons/${IconMap[this.icon]}.included.svg`)
```

## SVGO optimizations

All our icons have a specific `fill` which makes it hard to change the color of the icon. Since we
are using the ShadowDOM, we are not easily able to change the `fill` attribute via CSS from outside
the component. Therefore, we would like this to be the current text color for easier use of the
icons. SVGO allows us to override the fill attribute with `currentColor` which will achieve exactly
that. The closest text color will be used as the fill color of our icon. Since text colors get
inherited even through the ShadowDOM this will allow us to easily set the color of used icons.

```typescript
import {defineConfig} from 'vite';
import svg from 'vite-plugin-svgo';

export default defineConfig({
  // rest of config omitted
  plugins: [
    svg({
      plugins: [
        {
          name: 'preset-default',
          params: {
            overrides: {
              convertColors: {
                currentColor: true,
              },
            },
          },
        },
      ],
    }),
  ]
});
```

## Going forward

We showed how to create a very easy icon component meeting our initial requirements. There is still
open points like the "loading" state but overall we solved the basics and can now improve on the
details.
