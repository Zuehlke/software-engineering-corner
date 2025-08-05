import type { CollectionEntry } from 'astro:content';

/**
 * Estimates the time it takes to read a post in minutes based on:
 * - A reading speed of 200 words per minute
 * - 10 seconds per image
 * - 20 seconds per code block
 *
 * @param post The post to estimate the reading time for
 */
export function timeToRead(post: CollectionEntry<'blog'>): number {
  const numWords = (post.body || "")
    .replace(/.*\[(.*?)].*/gm, "$1")
    .replace(/```.*?```/gms, "")
    .split(/\s+/).length;

  const numImages = post.body?.match(/!\[/g)?.length || 0;
  const numCodeblocks = post.body?.match(/```/g)?.length || 0;
  return Math.ceil(numWords / 200) + Math.ceil(numImages / 6) + Math.ceil(numCodeblocks / 3);
}