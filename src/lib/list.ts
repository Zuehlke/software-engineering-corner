import { type CollectionEntry, getCollection } from 'astro:content';

export const articles: CollectionEntry<"blog">[] =
  (await getCollection('blog')).sort((a, b) => {
    const dateA = new Date(a.data.released);
    const dateB = new Date(b.data.released);
    return dateB.getTime() - dateA.getTime();
  });

export const [featuredArticle, ...otherArticles] = articles;