// @ts-check
import {defineConfig} from "astro/config";
import tailwindcss from "@tailwindcss/vite";

import react from "@astrojs/react";

import expressiveCode from "astro-expressive-code";

import mdx from "@astrojs/mdx";

import sitemap from "@astrojs/sitemap";

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

  integrations: [react(), expressiveCode(), mdx(), sitemap()],

  trailingSlash: 'always',

  markdown: {
    rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: 'append' }],
          [rehypeToc, { 
            headings: ['h1', 'h2', 'h3'],
            cssClasses: {
              toc: 'toc-sidebar',
              link: 'toc-link',
            },
            nav: false,
            customizeTOC: (toc) => {
              // Convert ol to ul recursively
              const convertToUl = (node) => {
                if (node.tagName === 'ol') {
                  node.tagName = 'ul';
                }
                if (node.children) {
                  node.children.forEach(convertToUl);
                }
                return node;
              };
              
              const ulToc = convertToUl(toc);
              
              // Add "Table of Contents" heading
              return {
                type: 'element',
                tagName: 'nav',
                properties: { className: ['toc-container', 'mt-5'] },
                children: [
                  {
                    type: 'element',
                    tagName: 'div',
                    properties: { className: ['toc-header'] },
                    children: [{ type: 'text', value: 'Table of Contents', }]
                  },
                  ulToc
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