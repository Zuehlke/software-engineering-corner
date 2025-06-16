import rss, { type RSSFeedItem } from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async (context) => {
  const posts = await getCollection('blog');

  const items: RSSFeedItem[] = posts.map((post): RSSFeedItem => {
    return {
      ...post.data,
      pubDate: new Date(post.data.released),
      categories: post.data.tags,
      link: post.id,
    };
  });


  return rss({
    title: 'The Dev Exchange Blog',
    // `<description>` field in output xml
    description: 'In this blog, we discuss some of the unique challenges we meet whilst working for a service provider on enterprise customer projects. Who is "we?" Software engineers working at Zühlke.',
    // Pull in your project "site" from the endpoint context
    // https://docs.astro.build/en/reference/api-reference/#site
    site: context.site!,
    // Array of `<item>`s in output xml
    // See "Generating items" section for examples using content collections and glob imports
    items,
    // (optional) inject custom xml
    customData: `<language>en-us</language>`,
  });
};
