---
title: Instant page navigations with speculation rules
description: >-
  The Speculation Rules API is an experimental browser feature designed to
  improve navigation speed by pre-rendering or pre-fetching resources based on
  defined rules. This can benefit both multi-page and single-page applications,
  but developers should consider potential downsides like increased resource
  consumption and security risks. The API offers an "eagerness" setting to
  control when speculation rules are triggered, balancing performance with
  resource usage.
released: '2025-01-14T10:07:21.973Z'
cover: images/cover.jpg
author: Benny Joe Villiger
tags:
  - Browsers
  - Google Chrome
  - Developer Tools
  - performance
  - web
  - Web Development
shortDescription: >-
  The Speculation Rules API enhances web navigation by pre-rendering or
  pre-fetching content, speeding up MPAs. It offers instant page loads but
  consumes resources and poses security risks.
---
## What are Speculation Rules?

As of the time of writing (October 2024),
the [Speculation Rules API](https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API)
is an experimental
feature [available in all Chromium-based browsers](https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API#browser_compatibility).
It replaces
the [now-deprecated](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/prerender) `<link rel="prerender">`
and `<link rel="prefetch">`.

The Speculation Rules API is designed to enhance navigation performance by pre-rendering or
pre-fetching specific resources. It primarily relies on `href` matching rules to identify which
pages can be pre-rendered in the background or which resources can be pre-fetched.

This feature benefits Multi-Page Applications (MPAs) by speeding up future navigations, while
Single-Page Applications (SPAs) mainly benefit during initial page loads. Speculation rules can be
implemented either within an HTML `<script>` tag or via a "speculation-rules" response header.

**Pre-rendering** allows browsers to pre-fetch, render, and load a page in an invisible tab,
including
all subresources and JavaScript. This makes future navigations to the pre-rendered page nearly
instantaneous since the browser activates the hidden tab rather than reloading the page from
scratch.

**Pre-fetching**, on the other hand allows browsers to download the response body of referenced pages
without fetching subresources, improving load times when users navigate to those pages. This method
is more efficient than older approaches like `<link rel="prefetch">` or `fetch()` with low priority,
as it supports cross-site navigation and avoids being blocked by `Cache-Control` headers.

In this article, we won't cover all the features, and since the API is still experimental, there may
be updates and improvements in the near future. I recommend checking
the [MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API)
for the latest information.

## Example

The simplest way to define speculation rules is in a script tag within the current document. For
example:

```js
<script type="speculationrules">
    {
        "prerender": [
    {
        "where": {
        "and": [
    {"href_matches": "/*"},
    {"not": {"href_matches": "/logout"}},
    {"not": {"href_matches": "/*\\?*(^|&)add-to-cart=*"}},
    {"not": {"selector_matches": ".no-prerender"}},
    {"not": {"selector_matches": "[rel~=nofollow]"}}
        ]
    },
        "eagerness": "moderate"
    }
        ],
        "prefetch": [
    {
        "urls": ["next.html", "next2.html"],
        "requires": ["anonymous-client-ip-when-cross-origin"],
        "referrer_policy": "no-referrer"
    }
        ]
    }
</script>
```

# Use Cases

The first example that came to me when writing this post and thinking about use cases for
speculative pre-rendering was **blogs**. For instance, if a blog provides a *next* button to load
the following article, pre-rendering the next page could make navigation simple for the reader.

**Wiki** pages would be an excellent application as well. Because wikis commonly contain links that
lead to related articles, speculative pre-rendering could improve user experience by preloading
popular links.

Generally speaking, implementing speculative rules into any **multi-page application (MPA)** could
increase user happiness.

# Downsides

Having instant page navigations and near-zero milliseconds loading times sounds ideal, but there are
some clear downsides to consider.

First, both pre-rendering and pre-fetching consume resources. Background requests increase the load
on servers and also use up the client’s bandwidth. Rendering a page in the background consumes
processing power, which can be especially taxing on mobile devices, potentially leading to increased
battery drain.

Second, there are potential security concerns with pre-rendering documents, particularly when
JavaScript executes automatically. This can open up risks where simply navigating to a page that
contains a malicious link could trigger harmful scripts, eliminating the need for a user to actively
click on the link. This makes pre-rendering a potential vector for exploitation.

# Demonstration

I’ve created
a [demo blog site](https://speculation-rules-demo.deno.dev/) ([GitHub](https://github.com/vilben/speculation-rules-demo))
that includes a *landing* page, an *about* page, and a *blog* page where all the posts are
displayed. The site also uses simple speculation rules to demonstrate how pre-rendering works:

```js
<script id="speculationrules" type="speculationrules">
    {
        "prerender": [{
        "source": "document",
        "where": {
        "and": [
    {"href_matches": "/*"},
    {"not": {"href_matches": "*-no-prerender*"}}
        ]},
        "eagerness": "eager"
    }]
    }
</script>
```

**Note**:
Currently, the blog page pre-renders all posts that match the speculation rules when it loads. In a
real-world scenario, you'd likely want to adjust the **eagerness** setting to balance resource usage
and performance.

## Eagerness

The **eagerness** setting determines when speculation rules are triggered.

* An eagerness of **"eager"** means that as soon as the page loads, it pre-renders every page that
  matches the speculation rules.
* An eagerness of **"moderate"** delays pre-rendering until a user interacts with the
  page—specifically, when hovering over a link that meets the speculation rules criteria.

This setting helps balance resource usage and performance based on user interaction.
[More about eagerness](https://developer.chrome.com/docs/web-platform/prerender-pages#eagerness)

To see this in action, ensure you're using a supported browser and that your browser's "Preload
pages" setting is not turned off (unfortunately some extensions interfere with this setting), or
just use an incognito tab.

## Steps to test:

1. Navigate to the [demonstration blog site](https://speculation-rules-demo.deno.dev/)
2. Open dev tools (F12)

Open the **Application** tab and find the *Background services* section ⇾ *Speculative Loads* ⇾
*Rules*, where you can view the active speculation rules.

Right next to *Rules* there's the *Speculations* section, you’ll see all the pages that have been
pre-rendered or what state they are in. As they are in "Ready" state, when navigating, the page will
load instantly.
![Dev tools Application](images/1749947496509-03i8ecncgb9k.png)

You can also observe background activity in the **Network** tab, where you’ll notice the
pre-rendering process at
work.![Dev tools Network](images/1749947496511-0i8k77u9xb8r.png)

## Excluded Links

Some links are intentionally excluded from pre-rendering. These are identified by URLs ending with "
-no-prerender" and are also labelled with *"NO PRERENDER:"* in the link text for easy identification.

## Performance Stats

In the top-left corner of each page, you'll find a *"Predictive Pre-rendering Stats"* box displaying
the page's load time (measured by Largest Contentful Paint, or LCP). While not 100% accurate, it’s
close enough for demonstration purposes.

By clicking through blog posts and checking the LCP time, you may not notice a speed improvement if
you're on a fast network. If that’s the case, I recommend throttling the network speed in DevTools:

1. In the **Network** tab, change the dropdown from *No throttling* to *Slow 4G* or even slower.
2. Test the pages again and compare load times.

If the performance boost isn’t immediately obvious, it might be because the pre-rendering wasn't
completed when the link was clicked. You can confirm the pre-render status in the **Speculations**
section under the **Application** tab.

In my tests, switching to *Slow 4G* resulted in about 2000ms for non-pre-rendered pages versus 100ms
for pre-rendered ones.

![Comparison "many images" slow 4G](images/1749947496513-870uw0wd56i.gif)

# Conclusion

In summary, the **Speculation Rules API** offers exciting opportunities to enhance the performance
of Multi-Page Applications (MPAs) by intelligently pre-rendering or pre-fetching content, making
future navigations feel nearly instantaneous. With proper implementation, this API can significantly
improve user experience.

However, developers should be cautious about the downsides, such as increased resource consumption
and security risks. Balancing these trade-offs with appropriate usage of the **eagerness** setting
and carefully defined speculation rules can ensure a smoother, faster, and safer browsing
experience.

Unfortunately **speculation rules** are currently only available in
Chromium-based browsers and even there an *experimental* feature, therefore subject to change.
I would not recommend to use it outside hobby-projects yet.

Sources:

* [MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API)
* [Fosdem24 Presentation](https://archive.fosdem.org/2024/schedule/event/fosdem-2024-2003-better-than-loading-fast-is-loading-instantly-/)
* [prerender-pages](https://developer.chrome.com/docs/web-platform/prerender-pages)
* [speculation-rules-improvements](https://developer.chrome.com/blog/speculation-rules-improvements)
* [W3C Draft Community Group Report](https://wicg.github.io/nav-speculation/speculation-rules.html)
