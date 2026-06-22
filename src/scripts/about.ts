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
      `AI engineer at [Lleverage](https://lleverage.ai). I build things with ` +
      `language models — agents, tools, eval harnesses, the kind of plumbing ` +
      `that turns "cool demo" into "ships and stays up."\n\n` +
      `I care about: **legible systems**, **tight feedback loops**, and the ` +
      `difference between something that *demos* well and something that ` +
      `*works* well.\n\n` +
      `Off the clock I write the occasional [blog post](/blog), tinker with ` +
      `generative graphics, and over-engineer my personal site (you're in it).\n\n` +
      `## Links\n\n` +
      `- [GitHub](https://github.com/tvdavies) — code, including this site\n` +
      `- [Blog](/blog) — occasional writing\n` +
      `- [tvdavies@gmail.com](mailto:tvdavies@gmail.com) — email\n`,
  );

  yield {
    type: "chips",
    items: [
      { label: "what have you built?", prompt: "/projects" },
      { label: "read the blog", prompt: "/blog" },
      { label: "how do I reach you?", prompt: "/contact" },
    ],
  };
};
