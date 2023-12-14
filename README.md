# engineering-posts

Repository for our Zuehlke dev blog: [https://software-engineering-corner.zuehlke.com](https://software-engineering-corner.zuehlke.com)

## How to add a blog post

To add new blog posts without having to ask for being added to the Zuhlke organization, the easiest way is forking this repository with your github user and write your blog post in your fork of this repository. If you need help with how forking works, please refer to this guide by github: https://docs.github.com/en/get-started/quickstart/fork-a-repo.

Please start your post in the directory `drafts`. It will be moved to published as soon as it is actually published.
After that, you can start working on your blog post in your repository. For information about the metadata in your blog post and specific markdown of Hashnode please refer to their template repository: https://github.com/Hashnode/Hashnode-source-from-github-template

When you are ready you can then open a pull request to this repository and set somebody from the organization as the reviewer. As soon as this person has reviewed your PR and everything has been resolved, it can be merged into the main branch. If you're unfamiliar with this, please refer to this guide by github: https://docs.github.com/en/get-started/quickstart/github-flow

## Frontmatter

We recognized that there are some things which are important in the frontmatter of the articles:

1. Please add a `saveAsDraft: true` to the frontmatter. We will remove this when we publish the article.
2. Please add a `hideFromHashnodeCommunity: false` to the frontmatter. This makes the blog post searchable from within Hashnode.
3. Use your **Hashnode** username for `publishAs`. You can see it in the [Hashnode user settings](https://hashnode.com/settings).
4. Use tags which are listed here [https://github.com/Hashnode/support/blob/main/misc/tags.json](https://github.com/Hashnode/support/blob/main/misc/tags.json) (use the **slug**) or ensure they exist via the Hashnode search (select "tags"). If you do it wrong, Hashnode may fail to import the article.


## Upload and use pictures

To use pictures you can upload them with the Hashnode [uploader tool](https://hashnode.com/uploader). This will output a URL that you can include in your blog post.

## Links

It seems that Hashnode adds backslashes when using an underscore in a URL. So encode underscores with "%5F".
