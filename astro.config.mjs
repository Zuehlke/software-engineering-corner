// @ts-check
import {defineConfig} from "astro/config";
import tailwindcss from "@tailwindcss/vite";

import react from "@astrojs/react";

import expressiveCode from "astro-expressive-code";

import mdx from "@astrojs/mdx";

import sitemap from "@astrojs/sitemap";
import mermaid from "astro-mermaid";

import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeToc from "rehype-toc";

// https://astro.build/config
export default defineConfig({
  site: 'https://thedevexchange.com',
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [react(), expressiveCode({
    themes: ['github-dark', 'github-light'],
    themeCssSelector: (theme) => theme.name === 'github-dark' ? '.dark' : ':root:not(.dark)',
  }), mdx(), sitemap(), mermaid({theme: 'neutral', autoTheme: true})],

  trailingSlash: 'always',


  markdown: {
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: 'append' }],
      // @ts-ignore
      [rehypeToc, { 
        headings: ['h1', 'h2', 'h3'],
        cssClasses: {
          toc: 'toc-sidebar',
          link: 'toc-link',
        },
        nav: false,
        customizeTOC: (toc) => {
          // Add "Table of Contents" heading
          return {
            type: 'element',
            tagName: 'nav',
            properties: { className: ['toc-container', 'mt-5'], ariaLabel: 'Table of Contents' },
            children: [
              {
                type: 'element',
                tagName: 'div',
                properties: { className: ['toc-header'] },
                children: [{ type: 'text', value: 'Table of Contents', }]
              },
              toc
            ]
          };
        }
      }],
    ],
  },

  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: false
      }
    }
  },
});