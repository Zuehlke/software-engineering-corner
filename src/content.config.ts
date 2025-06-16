import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	loader: glob({ base: './src/articles', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) => z.object({
		title: z.string(),
		cover: image(),
		released: z.string().datetime(),
		author: z.string(),
		tags: z.array(z.string()),
		description: z.string()
	}),
});

export const collections = { blog };
