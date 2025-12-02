---
title: Leveraging React Context Across Render Boundaries in Next.js - Lessons from Building a Locale Switcher
description: >-
  In Next.js applications, layouts often need access to data that only becomes available after a nested page has rendered - for example, localized slugs from a headless CMS that are required to build SEO-friendly, localized URLs. This article explores how to bridge that gap with React Context, why global stores and "server contexts" are usually not a good idea, and how a context-based pattern can help manage your state safely across render client/server boundaries.
released: "2025-11-12T20:46:09.861Z"
cover: images/cover.jpg
author: Tim Grünewald
tags:
  - React
  - Next.js
  - Context
shortDescription: >-
  Implement smooth fade page transitions in React apps using react-router v6 and
  framer motion. Learn to handle component lifecycle for seamless animations.
---

# Introduction

On the project I am currently working on, we are building a Next.js powered web application for a health care provider. Some content we show in the web app such as product data or user specific information such as active subscriptions to services is curated via a admin UI, though the main part of the content comes from pages and blog articles as well as images that are fully driven by [Dato, a headless CMS.](https://www.datocms.com/) Consequentially, navigation elements and footer content are curated in the CMS as well, with links representing references to other CMS-driven data records.

In order to pave the way for a fully localized user experience, we had to implement a locale resp. language switcher component located in the header of the web application. This dropdown component should always be able to serve the correct, localized URL to the currently viewed page in the other languages the content is available in. Now, this would be trivial if the task at hand would be to just switch the locale with the rest of the URL staying the same, e.g. linking from a German article located under `/de/blog/gesund-essen` to the English version of it `/en/blog/gesund-essen`. But as [Google documents on "Google Search Central"](developers.google.com/search/docs/crawling-indexing/url-structure#use-your-audiences-language), the best practice when it comes to localized URLs is to use human-readable, descriptive URLs in your audience's language (e.g. in our example `/en/healthy-eating`).

In the following article I will talk about the challenges of building such a locale switcher component if it requires CMS-driven data might only be only available after the component itself has already finished rendering, a problem touching a lot of different aspects and pitfalls of building projects with Next.js, and how our solution to this both leverages the inner workings of React context and integrates well with SSR (server side rendering) and the "Network Boundary"

# The Challenge

Further building upon our example in the introduction, consider the following folder structure in a Next.js project with folders corresponding to the text on the arrows in the diagram and the page and layout files corresponding to the boxes connected:

[![](https://mermaid.ink/img/pako:eNo9jctuwjAQRX_FmnWgcUoe9qJSVZaRGqldlbBwk8Gx6tjIcaAU-PealHRWvnd8zpyhsS0Ch522x6YTzpP3dW1ImAeyWJCNto3QuCUhPJFyU4qTHf3270d5Ky-f2soLqejm2XnVaBxIqQZPKiExOF4P6A4Kj1O-cxWd1IMe5XbyVskMkzV6ofRMvykjQzkv747aQATSqRa4dyNG0KPrxS3C-XahBt9hjzXw8GyF-6qhNtfA7IX5sLafMWdH2QHfCT2ENO5b4XGthHSi_28dmhbdix2NB05jlk4W4Gf4Bp7k2TLP4pzSLGMsoSyCE_A0WWZFviqKNE1ZXCTXCH6mq_Ey1CwMpUm2yh9Tdv0FyTV1Hw?type=png)](https://mermaid.live/edit#pako:eNo9jctuwjAQRX_FmnWgcUoe9qJSVZaRGqldlbBwk8Gx6tjIcaAU-PealHRWvnd8zpyhsS0Ch522x6YTzpP3dW1ImAeyWJCNto3QuCUhPJFyU4qTHf3270d5Ky-f2soLqejm2XnVaBxIqQZPKiExOF4P6A4Kj1O-cxWd1IMe5XbyVskMkzV6ofRMvykjQzkv747aQATSqRa4dyNG0KPrxS3C-XahBt9hjzXw8GyF-6qhNtfA7IX5sLafMWdH2QHfCT2ENO5b4XGthHSi_28dmhbdix2NB05jlk4W4Gf4Bp7k2TLP4pzSLGMsoSyCE_A0WWZFviqKNE1ZXCTXCH6mq_Ey1CwMpUm2yh9Tdv0FyTV1Hw)

Now, for those not familiar with Next.js, the folder structure in a Next.js project corresponds to the URL segments. Layouts and pages are placed correspondingly inside of this folder hierarchy to build compositional patterns that allow for subroutes and their pages being rendered inside of a shared layout that only gets rendered once and is then being reused for as long as navigation happens between pages that are also placed under that layout:

```
/
└── [locale]
    ├── layout.tsx
    └── blog
        ├── page.tsx       ← Articles List Page / Overview Page
        └── [slug]
            └── page.tsx    ← Article Detail Page / Single Article Page
```

`[locale]` and `[slug]` represent dynamic URL segments, telling Next.js that those are named placeholders holding space for data that is being filled in either during build time (in the case of statically generating pages) or run time (in case of rendering pages as they are requested). For example, within our `page.tsx` files, `locale` and `slug` will be made available to us by the framework via component props:

```tsx
export default async function ArticleListPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const articles = await getAllArticles(locale);

  if (articles.length === 0) {
    return "Sorry, no blog articles.";
  }

  return (
    <ul>
      {articles.map((article) => (
        <li>
          <Link href={`/${locale}/blog/${slug}`}>{article.title}</Link>
        </li>
      ))}
    </ul>
  );
}
```

and respectively:

```tsx
export default async function ArticleDetailsPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const article = await getArticle(locale, slug);

  if (!article) {
    return notFound(); // Built-in Next.js function that redirects to the nearest not-found.tsx file in our folder structure
  }

  return (
    <div>
      <h2>{article.title}</h2>
      <p>{article.description}</p>
      {article.sections.map((section) => (
        <p>{section}</p>
      ))}
    </div>
  );
}
```

Note that this component is an asynchronous function, as it is a [React server component](https://react.dev/reference/rsc/server-components#async-components-with-server-components), suspending server side rendering until the data is loaded.

Let's work our way up in the folder structure to the shared Layout defined in `layout.tsx`:

```tsx
import { NextIntlClientProvider } from "next-intl";

type BlogLayoutProps = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

export default async function LocaleLayout({ params, children }: BlogLayoutProps) {
  const { locale } = await params;

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
          <Navigation />
          <LocaleSwitcher />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

A layout is shared UI that wraps multiple pages. The key benefit of layouts is that they preserve state, remain interactive, and don’t re-render when a user navigates between pages that share the layout.

The handling of the locale and internationalization, including routing, correctly switching localized strings stored in resource files as well as providing us with several useful hooks is handled by [next-intl](https://next-intl.dev/). You don't have to worry about the details, just note here that we are wrapping our pages in a `NextIntlClientProvider`, a context provider that comes with the plugin and enables the beforementioned hooks to access the current locale, regardless of where they are located in the render tree, as long as they are a child component of this provider and a client-side component. You can also see that we are rendering a `Navigation` and a `LocaleSwitcher` component in the layout here.

Let's recap the setup so far: We have two pages, an overview page where we show a list of blog articles, a blog article page where we show a single blog article and finally a layout containing shared code between the two pages containing our locale switcher.

Regardless of what our locale switcher component looks like, it will need at least two key pieces of information to correctly resolve the URLs of our article page for other languages if we want to give users a fully localized experience:

1. The current pathname resp. article page we are on, e.g. `/blog/healthy-eating`
2. The slug of the article in the other languages it is available in, e.g. `gesund-essen` for the German version or `une-alimentation-saine` for the French version

And here is where our problem(s) presents itself:

1. **We can't access the pathname in the layout and pass it to the locale switcher as a prop:**

   The key benefit of Layouts in Next.js is that they don't rerender during navigation between pages that are located "under" them, which allows for shared UI, Scripts etc. To achieve that, they are cached client-side. Logically, as a consequence, they can't access the current pathname of the page they are rendering "inside" of themselves, as it could become stale. So how do we get the current pathname into the locale switcher component?

2. **We can't pass the information about the article's slugs in other languages from the layout into the locale switcher because we can't get it up into the layout to begin with**

   If you remember our article detail page, we are fetching a single article using the following code:

   ```tsx
   const article = await getArticle(locale, slug);
   ```

   The information about the article's slugs in other languages is contained here in the `article` object. But how do we get this information up into the layout and into the layout?

# First Attempt: Global (Server-Side) Stores

Our first real attempt at solving the locale-switcher problem was to introduce a global store using [Nanostores](https://nanostores.github.io/nanostores/)

1. The article page could fetch the localized slugs inside the page from CMS data
2. write the data into a Nanostore server-side
3. the layout (and therefore the locale switcher inside it) could read that state from the shared store

At first glance, this looked promising. Nanostores supports server-side usage, and because layouts don’t re-render across navigations, having a shared store felt like a clean way to “lift” state up without needing to prop-drill.

But in practice, several fundamental problems emerged:

1. **The Store Initializes on the Server, but the Locale Switcher Needs Client-Side State**

The locale switcher itself was a client component, because it used hooks like `usePathname()` and `useParams()`.

This meant:

The Nanostore was initialized on the server, but the locale switcher needed to read a hydrated version of that store on the client, so we had to “hydrate” the store by passing initial values from the server.

This led to patterns like:

```tsx
<ClientProviders localizedParams={localizedParams}>
  <Header>
    <LocaleSwitcher />
  </Header>
</ClientProviders>
```

And inside the provider, we would manually sync:

```tsx
$localizedParams.set(initialValuesFromServer);
```

An obvious solution to this would be to make the locale switcher a server component as well, but even that that wouldn't solve the problem, because:

2. **Layouts and pages render independently and in parallel**

React Server Components are parallelized and streamed, so a page cannot send data “upward” after the layout tree has already been serialized.

Even withing a single request / render cycle, Next.js doesn't necessarily guarantee an order of execution when it comes to rendering layouts and pages.

The normal order of execution that people would expect is:

1. The outer layout renders first
2. The page renders afterwards

But in reality:

1. The layout (server component) _may_ render first
2. The page (server component) _may_ render later, but not in a way that lets you "patch" data upwards into a parent that is already rendered.
3. React 18+ and Next.js app route renders segments concurrently, you can't rely on sequential execution

In fact, several people realized in the context of localization or in an attempt to block the rendering of page content early on by implementing "blockers" in a shared layout that [nested layouts or pages render before their parent layouts](https://github.com/vercel/next.js/discussions/53026).

In the context of our problem, this "unexpected" order of rendering might solve the problem at first glance again, because the layout could read from an already populated store (set by the page), but we quickly realize that this approach falls apart on the first navigation between two pages that share the same layout. Because the layout is shared, it won't be rerendered and it won't repopulate the locale switcher with information about slug translations fetched by the new page we navigated to through an updated store value.

So, to summarize:

- There is no guaranteed order of rendering
- If the layout would render first, the store it passes to the locale switcher will stay empty, because it won't rerender after the page renders and sets the value in the store
- Even if the layout would render after the page, it won't rerender on a navigation to a page sharing the same layout, so data will get stale

3. **Server components have no reactive mechanism**

Server components run once per request. They don’t subscribe to updates, and they don’t react to mutations the way React client state does. Even more strict: Once a server component has rendered, it’s immutable for the duration of that navigation.

4. **Nanostores stores are not scoped to a single render cycle**

This was a small caveat in the face of the other, more fundamental problems we ran into with trying to solve this with server side stores, but it was still a core problem: Nanostores stores are not isolated to a single render cycle by default. They are global in the sense of that they are tied to the life cycle of the node process running the Next.js server, so you definitely run the risk of leaking data between different render cycles and requests, but also between different users. A problem when trying to store localized data, definitely a problem when trying to store user data globally on the server.

Now you may ask yourself:

# What about React Server Context

React originally experimented with Server Contexts as a mechanism for sharing request-scoped values across server components without prop drilling. However, the feature was ultimately removed before leaving the experimental stage.

The concept sounded great:

- You can define a context on the server.
- Any server component in the same render tree can read from it.
- It is scoped to the current request, so no cross-request leaks occur.

In theory, this could help a layout consume data computed deeper in the tree. But in practice, it has severe limitations. It resembled the React context we all know from classic client components, but:

1. It's read only
2. It's non-reactive
3. Only available during a single server render pass

The team quickly realized that server contexts implied a world where:

- You could “update” a context mid-render
- Other parts of the tree would then re-render with new data

Logically, this simply isn't compatible with how server rendering works.

# React's cache()

Facing the problem with React server context, React introduced react.cache() as a safer, more predictable primitive for (some of) its use cases. In short:

- `react.cache()` is a React API that memoizes the result of an async function **per request** on the server.
- It ensures that when multiple Server Components call the same data-fetching function during a single render, React only runs it once and reuses the result.
- This avoids duplicate network/database calls and provides a stable, shared value _without creating global state_.
- Frameworks like Next.js and libraries like `next-intl` use `cache()` internally to:

  - Provide consistent request-scoped data (e.g., locale, messages, configuration)
  - Avoid passing the same props through large component hierarchies
  - Allow multiple parts of the tree to access the same data safely

**`cache()` gives you “shared per-request data” without the pitfalls of server context or global stores, and without pretending that server state is reactive.**

So, `cache()` is a modern, widely used and really useful React feature, but unfortunately it still doesn’t fix the core issue behind the locale switcher: layouts and pages don’t render together, and layouts can’t receive data that pages load later:

- Layouts and pages render separately. `cache()` only shares values within the same render pass. A layout can’t see data fetched by a page rendered later or in a different request.

- Server Components render top-down. A layout can’t “wait” for the page’s localized slugs.

- Client Components can’t read server cache. `cache()` is reserved for server components.

In short: `cache()` is memoization, not shared state. It eliminates redundant fetches but does not create a reactive or global data layer across server/client boundaries.

# Moving away from the idea of "server context"

To summarize the last sections about different approaches, attempts and their pitfalls: Server context is generally a bad idea, at least in the context of React and Next.js for several reasons:

- **Contexts can’t span layouts and pages:**
  Layouts and pages may render at different times with different data, so they cannot share a single server context instance.

- **No re-rendering on the server:**
  Server Components render once per request. Already-rendered parts of the tree (like layouts) are immutable, so downstream updates can’t propagate back up.

- **Encourages sharing state on the server (an anti-pattern):**
  It couples components to hidden global state, reduces reusability outside that context, and makes debugging harder.

- **Essentially introduces side effects:**
  Server Context turns server rendering into a stateful environment, which breaks the mental model of React Server Components and leads to unpredictable behavior.

# The Solution : A Context Hydrator Pattern

So, finally, after exploring global stores, Server Context, and other dead ends, the real solution turned out to be much simpler: let the page that actually fetches the CMS data push that data upward into React Context, and let the layout (and the locale switcher inside it) consume that context on the client.

In other words:

- The page already knows the translated slugs, because it fetched the article from the CMS.

- The layout needs those slugs, but can’t access them during its own render.

- The locale switcher must be a client component anyway, because it uses navigation hooks.

- So we give the layout a client-side context provider that receives CMS data after the page has rendered.

This is where the pattern we'd like to call "Context Hydrator" comes in, it works like this:

1. Define a client-side context (e.g. `LocalizedSlugsContext`) that will hold the translated slugs and exposes state getter and setter methods.

2. Render an empty provider in the layout, wrapping the locale switcher.

3. In the page after fetching the CMS data, render a small client component (the hydrator) whose only job is to use the context client-side, get the getter method and use it to "hydrate" the context with the localized slugs.

4. The layout never rerenders, but the client-side context provider does update, and the locale switcher, using the context as well, sees the updated values and can render the correct links.

This avoids all the pitfalls:

- No need for Server Context.

- No need to work around, hack or break Next.js’s render boundaries.

- No need for global state that persists across requests.

- No risk of leaking server data automatically to the client.

- No round-trip or forced re-rendering of server layouts.

Instead, the page simply hands the data to the browser, and the browser hands it to the layout subtree through context.

At a first glance, this solution might seem counter-intuitive and I'd argue it even is, because most tutorials and even the React documentation focus mostly on how to use Context as a way to move state upwards the component tree and avoid prop-drilling. The pattern described here where Context is a solution to the problem of having to update state shared by components or the entire page way down in the component tree.

Let's look at some code snippets:

In the layout, we are rendering the provider that wraps the `LocaleSwitcher` component and the `children`:

```tsx
type BlogLayoutProps = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

export default async function BlogLayout({ params, children }: BlogLayoutProps) {
  const { locale } = await params;

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
          <Navigation />
          <LocalizedSlugsProvider>
            <LocaleSwitcher />
            {children}
          </LocalizedSlugsProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

Wrapping the `children` in the provider is important because the client "hydrator" component we use on the page has to have access to the context.

Now let's look at the Context and its provider:

```ts
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { SiteLocale } from "@/app/types/SiteLocale";

type SlugMap = Record<SiteLocale, string>>;

interface LocalizedSlugsContextValue {
  getSlugs: (locale: SiteLocale) => Record<string, string> | undefined;
  setSlugs: (locale: SiteLocale, slugs: Record<string, string>) => void;
}

const LocalizedSlugsContext = createContext<LocalizedSlugsContextValue | undefined>(undefined);

export function LocalizedSlugsProvider({ children }: { children: React.ReactNode }) {
  const [slugs, setSlugsState] = useState<SlugMap>({} as SlugMap);

  const setSlugs = (locale: SiteLocale, newSlugs: Record<string, string>) => {
    setSlugsState((prev) => ({
      ...prev,
      [locale]: {
        ...(prev[locale] || {}),
        ...newSlugs,
      },
    }));
  };

  const getSlugs = (locale: SiteLocale) => slugs[locale];

  return <LocalizedSlugsContext.Provider value={{ getSlugs, setSlugs }}>{children}</LocalizedSlugsContext.Provider>;
}

export function useLocalizedSlugs() {
  const ctx = useContext(LocalizedSlugsContext);
  if (!ctx) throw new Error("useLocalizedSlugs must be used inside a LocalizedSlugsProvider");
  return ctx;
}

/**
 * Hydrator component that accepts an object mapping locales to slug values
 * Example: { de: 'gesund-essen', fr: 'une-alimentation-saine' }
 */
export function LocalizedSlugsHydrator({ paramKey, values }: { paramKey: string; values: Record<SiteLocale, string> }) {
  const { getSlugs, setSlugs } = useLocalizedSlugs();

  useEffect(() => {
    Object.entries(values).forEach(([locale, value]) => {
      const existing = getSlugs(locale as SiteLocale);
      if (existing?.[paramKey] === value) return;

      setSlugs(locale as SiteLocale, { [paramKey]: value });
    });
  }, [values, paramKey, getSlugs, setSlugs]);

  return null;
}
```

The `LocalizedSlugsProvider` creates a simple React Context that stores all localized slugs, grouped by locale. It exposes setter functions so the client can update this data later. The layout initializes the provider with whatever slug information is available during the server render.

The `LocalizedSlugsHydrator` is a minimal client component that runs inside each page. After the page fetches localized slugs from the CMS, the hydrator injects those slugs into the React Context. It doesn’t render anything visually; its only role is to synchronize page-level data upwards into the global state.

And finally, we can use this hydrator component on the page like this:

```ts
// app/[locale]/blog/[slug]/page.tsx
import { LocalizedSlugsHydrator } from "../../components/LocalizedSlugsHydrator";

export default async function ProductPage({ params }) {
  const { locale, slug } = await params;
  const article = await fetchArticle({ locale, slug });

  // Example: { de: 'gesund-essen', fr: 'une-alimentation-saine' }
  const localizedSlugs = article.localizedSlugs;

  return (
    <>
      <LocalizedSlugsHydrator paramKey={"slug"} values={localizedSlugs} />
      <h1>Product Page</h1>
    </>
  );
}
```

And finally, the locale switcher can read the slugs and compose the correct links

```tsx
"use client";

import { useLocalizedSlugs } from "@/context/LocalizedSlugsContext";

const LOCALES: SiteLocale[] = ["de", "fr", "it"];

export function LocaleSwitcher() {
  const pathname = usePathname();
  const { getSlugs } = useLocalizedSlugs();

  if (!pathname) return null;

  // Extract current slug from URL (last segment)
  const currentSlug = pathname.split("/").pop();

  return (
    <div className="flex gap-2">
      {LOCALES.map((locale) => {
        const slugs = getSlugs(locale);
        const localizedSlug = slugs?.slug ?? currentSlug;

        const href = `/${locale}/articles/${localizedSlug}`;

        return (
          <Link key={locale} href={href} className="underline">
            {locale.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}
```

This component

- reads localized slugs using getSlugs(locale).

- If a localized slug exists for the locale it uses it.

- If not it falls back to the URL’s current slug.

- It builds the localized URL format based on the route structure.

# Key Lessons

- Server and client state are fundamentally separate. Syncing them requires intentional bridging.

- In Next.js, Layouts and pages can render at different times with different data, so a shared server-side context between them is impossible by design.

- Localized slugs originate on the server, but the UI needs them on the client — requiring explicit hydration.

- A simple client context + hydrator pattern provides a stable solution without relying on experimental or removed React features.

# Conclusion

What looked like a simple feature on the surface ("just switch the locale and update the slug") quickly exposed gaps between server-rendered data and client-side UI logic

The fix came from stepping back and asking what was truly needed: a stable, predictable bridge that carries server-provided slug data into the client where the locale switcher lives.

The final solution does exactly that. No hacks, no unstable APIs, no workarounds. And most importantly: it works with how React and Next.js are designed today.
