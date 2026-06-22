/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

// Slim blog manifest injected into the page by the Terminal layout so the
// live terminal's `/blog` command can list posts without a round-trip.
interface BlogPostMeta {
  slug: string;
  title: string;
  date: string; // ISO
  description: string;
}

interface Window {
  __POSTS?: BlogPostMeta[];
}
