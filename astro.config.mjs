// @ts-check
import {defineConfig} from "astro/config";
import tailwindcss from "@tailwindcss/vite";

import react from "@astrojs/react";

import expressiveCode from "astro-expressive-code";

import mdx from "@astrojs/mdx";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: 'https://thedevexchange.com',
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [react(), expressiveCode(), mdx(), sitemap()],

  trailingSlash: 'always',

  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: false
      }
    }
  },
});