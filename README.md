# the dev exchange

Repository for our Zuehlke dev blog: [https://thedevexchange.com](https://thedevexchange.com)

## Are you a first time contributor?

Create a PR where you add your name to the [AUTHORS.md](./AUTHORS.md) file.

## How to add a blog post

To add new blog posts, fork this repository with your GitHub user and write your blog post in your fork of this repository.
If you need help with how forking works, please refer to this guide by GitHub: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo

Please start your post in the directory `src/articles/<article-name>`.
After that, you can start working on your blog post in your repository.

## Publishing the Article

When you are ready, you can then open a pull request to this repository and set somebody from the organisation as the reviewer.
Once you have created a PR, you will see a comment from Cloudflare with a preview URL, where you can preview the deployed article.

If you're unfamiliar with this, please refer to this guide on GitHub: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request

As soon as this person has reviewed your PR and everything has been resolved, the editorial team will merge it into the main branch.
**Please note**: **Merging the PR does not mean immediate publishing**.
The editorial team creates a separate publishing timeline, ensuring consistent release cadence, topic diversity, and relevance.
Please be patient, your article will get published eventually.
Reach out to the editorial team privately if you need a time-sensitive publication.

## Local Testing

Astro powers the blog.
You will need Node (or something similar, like Deno or Bun).

1. Install Dependencies: `npm install`
2. *(optional)* To create a search index run: `npm run build`
3. Run: `npm run dev`
4. Go to http://localhost:4321

## Images

Please add all the images to your article folder.
Like this, astro can optimise them, and the readers have a better experience overall.

## Front Matter

```
---
title: <short title>
description: <description for the rss feed>
released: <date of when it will be released <- add todays date in ISO 8601 format here>
cover: <path to the cover image>
author: <Your Name>
tags: <list of tags (they don't do anything yet)>
shortDescription: <short description for sharing preview (twitter, facebook, linkedin) max 200 characters>
---
```

Please add this to the start of your article. For reference, please refer to the format of already published articles.

## Top Tip

It is helpful to write each sentence on a new line.
That can make reviews simpler for pinpointing comments.
Markdown will ignore these new lines, and the paragraph structure will look as you intend.
Take care in bullet point lists, though, and validate with a preview that it looks as you'd wish.

## Style

### Point of View: I vs. We

The use of "I" vs. "we" depends on whatever fits the context/type of article best.
If it's about patterns/technologies/methods we regularly use and apply in customer projects, go with "we".
In guides and walkthroughs, "we" could also be applied, referring to the author and reader, or a larger community (web devs, mobile engineers, technology sector, …).
In general, only use "I" when talking about personal opinions, first-hand experiences, or when explicitly referring to you as the author.

### Cover Image

Look at previous articles on the blog page to get an idea of the desired style.
Try to avoid overly complex imagery, text or diagrams, or screenshots.
[Unsplash](https://unsplash.com) is a useful source for free high-quality images.
