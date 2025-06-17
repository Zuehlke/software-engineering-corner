---
title: Build Azure AD B2C Templates
description: >-
  Customizing Azure Active Directory B2C user interfaces with HTML templates can
  enhance the user experience. A streamlined development workflow can be
  achieved using a zero-configuration build tool to optimize and prepare these
  templates for production. This approach allows for features like CSS
  preprocessing and avoids complex JavaScript frameworks, resulting in clean and
  lightweight templates.
released: '2022-11-28T10:22:39.140Z'
cover: images/cover.jpg
author: Christoph Salvisberg
tags:
  - Azure
  - Sass
  - Web Development
  - Build tool
---
# The goal

When integrating Azure Active Directory B2C service into your app, you can customize the [HTML with templates](https://docs.microsoft.com/en-us/azure/active-directory-b2c/customize-ui-with-html) to provide a more immersive user experience. This article will describe a simple approach on how to setup a local project to develop such templates and create a production ready build.

The basics to do so are simple enough: Publish a public available HTML page with styles/js to your liking that includes a `div` with id `api` can be used by the Azure B2C engine to render its login input fields inside:

```html
<div id="api"></div>
```

But some challenges came to my mind immediately: How do we get a production ready optimized build (e.g. CSS transpiling, minifying, ...) as well as some improved developer experience (SCSS preprocessor)

# The idea

[Parcel.js](https://parceljs.org/) is a zero-configuration build tool for the web. This seems to be a good fit for my requirements as I didn't want to pick a JS Framework to just create a simple static HTML file with CSS and JavaScript.

You can jump into the [github repo](https://github.com/csalv22/az-b2c-parcel/) directly to have a look implementation.

# Setup the code

Let's get our hands dirty and add the dependency to the current project (or create a new project first with `yarn init`) `yarn add --dev parcel`

Azure B2C requires a HTML template per language. A file named  `/src/en.html` represents the template in English:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Product Brand Name</title>
</head>
<body>
    <div id="api"></div>
</body>
</html>
```

In the `package.json` add a new line `"start-b2c": "parcel ./src/*.html", ` in the scripts section.
Now start up your application via console `yarn start-b2c`  and access the template on  <http://localhost:1234/en.html>

Congratulations, you have a basic template that would already be working.

## HTML

Now the HTML above can be extended with additional structures to fulfill the design as desired. A [sample version](https://github.com/csalv22/az-b2c-parcel/blob/main/src/en.html) with a bit more features can be found, but writing HTML & SCSS is not what this blog post is about.

## CSS

Now to the interesting part: Before writing the css styles for the templates, there are a few things we should do before.

### SASS / SCSS

We will rely on [sass](https://sass-lang.com/) as preprocessor to have a stronger toolset than just plain css. This can be [added to our setup](https://parceljs.org/languages/sass/) very easily: `yarn add --dev @parcel/transformer-sass`

Create a new stylesheet in `/src/scss/index.scss` with the following content

```scss
div {
  &#api {
    width: 100px;
    height: 100px;
    background-color: #123456;
  }
}
```

Restart the developer process (`yarn start-b2c`) to apply the SCSS style you created.
Now you're set up to design your html/css structure and can verify the result in the browser.

### CSS normalize / reset

As still all browsers render unstyled html elements slightly differently, the current web site would result in different appearance on the different browsers, which we have to address.
I decided to go for [normalize.css](github.com/necolas/normalize.css) as I prefer having some basic styles in contrary to a reset css. There are many options and alternatives out there (e.g. [the-new-css-reset](https://www.npmjs.com/package/the-new-css-reset), [sanitize.css](https://csstools.github.io/sanitize.css/), [normalize.css](https://csstools.github.io/normalize.css/),...) to be explored by yourself.

### CSS transpiling

[Transpiling](https://parceljs.org/languages/css/#transpilation) is done out of the box by parcel.js, so if you have an appropriate configuration in your package.json, no additional steps are required.

## JS

In my use case I didn't have the need to have any custom JS, plain html & css serves our needs. But parcel.js gives you many options into hand (you could even go for one of the big JS Frameworks and use static site rendering to create your html templates, e.g. framework agnostic with [astro.build](https://astro.build/)).

## Styling and testing the login form content

This far we built a lovely template but have no idea how the form fields (input for login, pw reset, ...) can be styled. To do that, we need to test our template with the content from the Azure B2C flows (and every configuration might have different content).
For that, access your current available B2C pages and on different screens use the html elements to replace `<div id="api">...</div>` to your local en.html. This way you can preview & design those pages before deployment.
We added a set of those content HTML elements in separate [\*.html files](https://github.com/csalv22/az-b2c-parcel/tree/main/src/api-snippets_de) to quickly retest different scenarios (e.g. styling of error messages).

# Build

To get a production ready build is fairly simple: Add `build-b2c: parcel build src/*.html --dist-dir ./public` to your scripts section in the package.json and test it with `yarn build-b2c`.

But hold on, if you were to deploy that now and integrate it with Azure B2C, this wouldnt work: The Azure B2C template mechanism has a restriction, in that it can't handle relative paths from your template like `<link rel="stylesheet" href="en.6a135913.css"/>` - it requires absolute paths. So you will need to define the public-url in your build step: `build-b2c: parcel build src/*.html --dist-dir ./public --public-url 'https://mystorageaccount.blob.core.windows.net/az-b2c'`

The build output can be deployed manually to an [azure blob storage account](https://docs.microsoft.com/en-us/azure/active-directory-b2c/customize-ui-with-html?pivots=b2c-user-flow#2-create-an-azure-blob-storage-account) (or other hosting solution). We deployed it as part of our SPA in an azure static site (behind an app gateway) and integrated it with our CI/CD workflow.

## Configuration of Azure B2C

The configuration of the Azure B2C to use our templates was handled by a partner company (there are ways to configure it in the identity experience framework for all pages user flows, which is not obvious from Microsoft's documentation, so be prepared to dive into some xml configuration).

# Conclusion

Parcel.js provided us a quick and easy way to build those templates, we have now very clean and lightweight templates with neither much overhead on the development side nor on the output.
There are of course many steps we can take to improve our solution:

* sprinkle some JS to give a better result to the client (but best do so in a progressive manner)
* deliver [optimized images](https://parceljs.org/recipes/image/)
* look for some templating mechanism for developer mode to test the different form content
* add a more versatile way for managing translations (and not duplicate the HTML structure for every language)
