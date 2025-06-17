---
title: Moving from Sass to CSS variables to implement Dark Mode
description: >-
  The development of a dark mode for public-facing machines with bright screens
  explored the use of CSS variables to facilitate runtime adjustments and
  testing. This approach enabled dynamic color modifications for accessibility
  improvements, particularly for users with visual impairments. While some Sass
  features are absent in CSS, the flexibility and tooling of CSS variables
  proved valuable for iterative development and user feedback integration.
released: '2022-10-26T08:18:21.470Z'
cover: images/cover.jpeg
author: Patrick Walther
tags:
  - CSS
  - dark mode
  - Sass
  - variables
  - Web Development
---
We are currently working on a machine that runs 24/7 at train stations all over Switzerland. The
screen is fairly bright to help people navigate through our web application even when there is
direct sunlight hitting the machine. For people with visual impairment, this brightness is a big
issue since some have to go very close to the screen to properly read and interact with it. This is
why we started developing a Dark Mode that is specifically designed for people with visual
impairment.

# Introducing CSS variables

We knew from the beginning, that implementing Dark Mode will need a lot of trial and error due to
the screens in these machines differing highly from a normal computer screen. Due to this fact we
wanted to go with a solution that allows us to easily tweak the colors at runtime during tests with
people. Our current Sass variables did not really fit this requirement since they get hardcoded in
every component stylesheet at build time. Which means changing a color at runtime to test something
would only work by changing it everywhere it is used.

A more promising approach seemed to be CSS variables. At runtime we would still have the references
instead of hardcoded values. The Dev Tools show these variables and you can modify them:

![CSS Variables in Dev Tools](images/1749948150821-epznmw0vd54.png)

This allows us to use the Dev Tools to change colors at runtime and test them on the real machines
with real people. So let’s look at how we can introduce CSS variables into our codebase.

# Move from Sass to CSS Vars

## Syntax

From a syntax perspective the change is fairly straight forward.

Sass syntax:

```scss
$test-var: 13rem;

.test {
  width: $test-var;
}
```

CSS syntax:

```css
:root {
    --test-var: 13rem;
}

.test {
    width: var(--test-var);
}
```

At a first glance, the CSS syntax looks more bloated but with the good IDE support nowadays you don’t
have to write most of it and references as well as autocomplete work as expected.

## Scoping

The variable in the example above is declared under `:root` which means it is in the global scope.
So it is accessible anywhere in the CSS Object Model. Just like that we can also declare CSS
variables in any other CSS selector making it locally scoped.
This also allows us to overwrite the value of a variable for a specific local scope. Consider the
following example:

```css
main {
    --bg-color: palevioletred;
}

div {
    --bg-color: papayawhip;
}

p {
    background: var(--bg-color);
}
```

```html

<main>
    <p>This will have a palevioletred background</p>
    <div>
        <p>This will have a papayawhip background</p>
    </div>
</main>
```

The paragraph that is wrapped in the `div` will get the overwritten `--bg-color` while the other
paragraph gets the original value of the variable. Check it out on Codepen:

%\[https://codepen.io/r3dDoX/pen/WNzgYNL]

## Sass Features missing in CSS

### sass:math

In Sass you can have a lot of calculations at build time, which is not possible with CSS. All
calculations have to be done with
the `calc()` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/calc)) function at runtime.

### sass:color

Sass has various helper functions to adjust color values which currently is not possible with CSS.
What we were mostly missing were functions like: `darken()` or `lighten()`. Right now we were able
to work around this by having a few more variables holding these adapted color values.

In the future we should have this functionality (and much more) in CSS, which is described very well
[in this blog post](https://blog.jim-nielsen.com/2021/css-relative-colors/).

# Actual Implementation of Dark Mode

Since CSS variables allow us to overwrite the value of the variable dynamically introducing color
variables for a Dark Mode looks something like this:

```css
:root {
    --color-background: #fff;
    --color-text-primary: #000;
    /* ... */
}

:root[data-theme="dark"] {
    --color-background: #000;
    --color-text-primary: #fff;
    /* ... */
}
```

All our application has to do now is to set the attribute `data-theme="dark"` on our root element when
we want the color variables to use the values defined for the dark theme.

After setting up these variables, the next step was to go through all the components and migrate them.
This was rather tedious, but with the help of search and replace quite possible.

# Conclusion

CSS variables allowed us to incrementally introduce Dark Mode while continuously testing with
customers as well as testers that the contrasts on the machines work as expected. During our
testing sessions we could just adapt certain variables at runtime allowing us to directly test
their feedback.

On top of that, the tooling during build time as well as runtime in the browser is very compelling.
Overall we only missed the ability of relative colors which should be arriving in CSS in the near
future.
