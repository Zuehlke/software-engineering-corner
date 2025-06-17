---
title: Blazor Project Structure
description: >-
  Structuring Blazor applications by feature can improve organization and
  clarity as projects grow. Grouping related pages, components, and services
  within feature-specific folders promotes cohesion. Shared components and
  services can reside in a dedicated folder at the root of the features
  directory, allowing for reuse across the application.
released: '2023-02-20T10:10:15.112Z'
cover: images/cover.jpg
author: Steven Giesel
tags:
  - architecture
---
Did you ever wonder what is a nice way of structuring your Blazor application?

I will show you how I structure my Blazor projects. What are the upside in contrast to the "default" structuring you get with the Blazor template.

The default has basically three main folders:

```
Data/
Pages/
Shared/
```

**Pages** describe basically every Blazor component, which has the `@page` directive with a given route. **Shared** should describe **Blazor** components, which are used by the **Pages**. Last but not least we have **Data**, which in theory describes all DTO's as well as services which in some way or another load data and put them into the data.

In an ideal world, your **page** would load some data via the services in **data**. Afterwards depending on the needs your **page** then is composed out of multiple components, which live in **Shared**. If we want to go further and follow the smart-dumb components idea, then really only your pages should have the services and the components in **shared** should basically be slices of these data-holders.

**What is the problem?** Well that seems pretty nice and neat but as soon as your applications grows, these folders will get bloated. Sure you can compete against that with subfolders. The second and for me larger problem is, that you don't see what belongs together, because everything is in different places. For me it is important that everything should stay together, which belongs together.

So I propose a similar way as the .NET namespaces are organised. Have a look for example at:
`System.Collections`. There you find `System.Collections.Generic`. So the deeper you go down the namespace "tree" the more specific you get.

Bringing this now to the Blazor world. The first thing I propose: **Put everything together in one folder** and call this folder: **Features**. Yes, just that: **Features**. It is important to understand that your application consists out of multiple features. That is the reason your user are using your software, so do the mental shift as well. That is important and helps a lot.

Now a feature can consist even out of multiple **pages** (to use the old notation). Each page then consume services and consists out of components, so a typical feature would look like this:

```
Features/
+- Home/
¦  +- Components/
¦  ¦  +- Hero.razor
¦  ¦  +- ShortBlogPost.razor
¦  +- Services/
¦  ¦  +- ImageLoader.cs
¦  +- Index.razor
```

Now pretty nice because you can see that those components belong together. Another question which will directly come is: **What if I have components shared over multiple features?** Good question. And sure this is something essential in every modern website. For example the `Hero.razor`, as well as another component in a different feature can you a custom styled button. Where does this button live?

For that we introduce a Component and even Service folder directly under **Features** to indicate that they can be used by multiple features. As rule of thumb: Only upper levels in your directory can call lower levels. So a component can **never** have a **page** inside (besides that it doesn't make sense in the first place).

Another point: One feature can consist out of multiple pages. Update and Create are most common, so often times they belong together. So let's have a final example:

```
Features/
+- BlogPostEditor/
¦  +- Components/
¦  ¦  +- BlogPostForm.razor
¦  +- CreateBlogPost.razor
¦  +- UpdateBlogPost.razor
+- Components/
¦  +- OkayButton.razor
+- Home/
¦  +- Components/
¦  ¦  +- Hero.razor
¦  ¦  +- ShortBlogPost.razor
¦  +- Services/
¦  ¦  +- ImageLoader.cs
¦  +- Index.razor
```

## Resources

I hope I could give you a "better" way of structuring your Blazor project. If you want check out this "in action" [check out the source of my private blog.](https://github.com/linkdotnet/Blog/tree/master/src/LinkDotNet.Blog.Web).
