import type { Script } from "../terminal/Stream";
import { sleep, streamText } from "../terminal/Stream";

export const about: Script = async function* () {
  yield { type: "thinking_start" };
  await sleep(600);
  yield { type: "thinking_end" };

  yield {
    type: "tool_start",
    id: "read-bio",
    name: "Read",
    arg: "~/about/bio.md",
  };
  await sleep(280);
  yield { type: "tool_end", id: "read-bio", summary: "ok" };
  await sleep(120);

  yield* streamText(
    `# Tom Davies\n\n` +
      `I'm a software engineer based in Sheffield. I've been doing this ` +
      `commercially for over a decade, a long stretch of it on critical ` +
      `infrastructure at Ovarro, then Tes and Storyteq. These days I'm at ` +
      `[Lleverage](https://lleverage.ai), building AI agents for a living.\n\n` +
      `I care about legible systems and tight feedback loops. I like leaving a ` +
      `file simpler than I found it, and I'm wary of tools that let me skip the ` +
      `parts of the work that made me good at it.\n\n` +
      `Off the clock I write the occasional [blog post](/blog), play a bit of ` +
      `guitar, and over-engineer ` +
      `[this site](https://github.com/tvdavies/personal-site).\n\n` +
      `## Links\n\n` +
      `- [GitHub](https://github.com/tvdavies) for code\n` +
      `- [Blog](/blog) for the occasional post\n` +
      `- [tvdavies@gmail.com](mailto:tvdavies@gmail.com)\n`,
  );

  yield {
    type: "chips",
    items: [
      { label: "read the blog", prompt: "/blog" },
      { label: "how do I reach you?", prompt: "/contact" },
      { label: "are you for hire?", prompt: "/hire" },
    ],
  };
};
