// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  // Canonical site URL — used for permalinks, sitemap, and meta tags.
  site: "https://tvdavies.com",

  integrations: [
    // Exclude the 404 page from the sitemap.
    sitemap({ filter: (page) => !page.includes("/404") }),
  ],

  markdown: {
    // The blog is rendered inside the "console" — plain <pre><code> styled by
    // our terminal CSS, matching the live terminal exactly (no Shiki theme).
    syntaxHighlight: false,
  },
});
