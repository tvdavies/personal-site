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
      `AI engineer. I build things with language models — agents, tools, eval harnesses, the kind of plumbing ` +
      `that turns "cool demo" into "ships and stays up."\n\n` +
      `I care about: **legible systems**, **tight feedback loops**, and the difference between ` +
      `something that *demos* well and something that *works* well.\n\n` +
      `Off the clock I write the occasional blog post, tinker with generative graphics, ` +
      `and over-engineer my personal site.\n\n` +
      `## Links\n\n` +
      `- [LinkedIn](https://www.linkedin.com/in/) — work history\n` +
      `- [GitHub](https://github.com/) — code\n` +
      `- email — _coming soon_\n\n` +
      `_Replace the placeholders above with your real URLs in \`src/scripts/about.ts\`._`,
  );
};
