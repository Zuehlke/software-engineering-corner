import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';

const blog = defineCollection({
	loader: glob({ base: './src/articles', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) => z.object({
		title: z.string(),
		cover: image(),
		released: z.string().datetime(),
		author: z.string(),
		tags: z.array(z.string()),
		description: z.string(),
		shortDescription: z.string()
	}),
});

export const collections = { blog };
