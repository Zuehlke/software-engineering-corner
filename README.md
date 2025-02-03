# software-engineering-corner

Repository for our Zuehlke dev blog: [https://software-engineering-corner.zuehlke.com](https://software-engineering-corner.zuehlke.com)

## How to add a blog post

To add new blog posts without having to ask for being added to the Zuhlke organization, the easiest way is forking this repository with your github user and write your blog post in your fork of this repository. If you need help with how forking works, please refer to this guide by github: https://docs.github.com/en/get-started/quickstart/fork-a-repo.

Please start your post in the directory `drafts`. It will be moved to published as soon as it is actually published.
After that, you can start working on your blog post in your repository. For information about the metadata in your blog post and specific markdown of Hashnode please refer to their template repository: https://github.com/Hashnode/Hashnode-source-from-github-template

When you are ready you can then open a pull request to this repository and set somebody from the organization as the reviewer. As soon as this person has reviewed your PR and everything has been resolved, it can be merged into the main branch. If you're unfamiliar with this, please refer to this guide by github: https://docs.github.com/en/get-started/quickstart/github-flow

### Top Tip

It is helpful to write each sentence on a new line. That can make reviews simpler for pinpointing comments. Markdown will ignore these new lines, and the paragraph structure will look as you intend. Take care in bullet point lists though, and validate with preview that it looks as you'd wish. 

## Frontmatter

We recognized that there are some things which are important in the frontmatter of the articles:

1. Please add a `saveAsDraft: true` to the frontmatter. We will remove this when we publish the article.
2. Please add a `hideFromHashnodeCommunity: false` to the frontmatter. This makes the blog post searchable from within Hashnode.
3. Use your **Hashnode** username for `publishAs`. You can see it in the [Hashnode user settings](https://hashnode.com/settings).
4. Use tags which are listed here [https://github.com/Hashnode/support/blob/main/misc/tags.json](https://github.com/Hashnode/support/blob/main/misc/tags.json) (use the **slug**) or ensure they exist via the Hashnode search (select "tags"). If you do it wrong, Hashnode may fail to import the article.

If you like to have a table of contents shown, you can add `enableToc: true`.
Only use it for longer articles.

## Upload and use pictures

To use pictures you can upload them with the Hashnode [uploader tool](https://hashnode.com/uploader). This will output a URL that you can include in your blog post.

## Style

### Point of View: I vs. We

The use of "I" vs. "we" depends on whatever fits the context / type of article best.
If it's about patterns/technologies/methods we regularly use and apply in customer projects, go with "we".
In guides and walkthroughs "we" could also be applied, referring to author and reader, or a larger community (web devs, mobile engineers, technology sector, …).
In general, only use "I" when talking about personal opinions, first-hand experiences, or when explicitly refering to you as the author.

### Cover Image

Look at previous articles on the blog page to get an idea of the desired style.
Try to avoid overly complex imagery, text or diagrams, or screenshots.
[Unsplash](https://unsplash.com) is a useful source for free high-quality images.

## Links

It seems that Hashnode adds backslashes when using an underscore in a URL. So encode underscores with "%5F".
