import type { Script } from "../terminal/Stream";
import { sleep, streamText } from "../terminal/Stream";

/**
 * `/blog` — lists posts inline (streamed) with links to their permalinks.
 * `/blog <slug>` — jumps straight to a post's permalink page.
 *
 * Posts come from `window.__POSTS`, a slim manifest injected by the layout.
 */
export const blog: (args: string) => Script = (args) =>
  async function* () {
    const query = args.trim().toLowerCase();
    const posts = (typeof window !== "undefined" && window.__POSTS) || [];

    // Direct open: `/blog <slug>` jumps to the permalink.
    if (query) {
      const match =
        posts.find((p) => p.slug.toLowerCase() === query) ??
        posts.find((p) => p.slug.toLowerCase().includes(query));
      if (match) {
        yield* streamText(`Opening **${match.title}**…\n`, {
          tokensPerSecond: 220,
        });
        await sleep(250);
        location.href = `/blog/${match.slug}`;
        return;
      }
      yield* streamText(
        `No post matches \`${args.trim()}\`. Here's everything:\n\n`,
        { tokensPerSecond: 200 },
      );
    }

    yield { type: "tool_start", id: "ls-blog", name: "Bash", arg: "ls ~/blog" };
    await sleep(220);
    yield {
      type: "tool_progress",
      id: "ls-blog",
      line: posts.length
        ? posts.map((p) => `${p.date.slice(0, 10)}  ${p.slug}.md`).join("\n") +
          "\n"
        : "(empty)\n",
    };
    yield {
      type: "tool_end",
      id: "ls-blog",
      summary: `${posts.length} ${posts.length === 1 ? "post" : "posts"}`,
    };
    await sleep(140);

    if (!posts.length) {
      yield* streamText(`Nothing published yet — check back soon.\n`);
      return;
    }

    let md = `## ~/blog\n\n`;
    for (const p of posts) {
      md += `### [${p.title}](/blog/${p.slug})\n`;
      md += `_${p.date.slice(0, 10)}_ — ${p.description}\n\n`;
    }
    yield* streamText(md);

    yield {
      type: "chips",
      items: posts.slice(0, 5).map((p) => ({
        label: p.title,
        prompt: `/blog ${p.slug}`,
      })),
    };
  };
