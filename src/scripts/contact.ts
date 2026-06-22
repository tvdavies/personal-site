import type { Script } from "../terminal/Stream";
import { sleep, streamText } from "../terminal/Stream";

export const contact: Script = async function* () {
  yield {
    type: "tool_start",
    id: "resolve",
    name: "Resolve",
    arg: "contact methods",
  };
  await sleep(320);
  yield {
    type: "tool_progress",
    id: "resolve",
    line: "→ linkedin: ok\n→ github:   ok\n→ email:    ok\n",
  };
  yield { type: "tool_end", id: "resolve", summary: "3 channels" };
  await sleep(140);

  yield* streamText(
    `## Contact\n\n` +
      `- [LinkedIn](https://www.linkedin.com/in/) — best for work-related things\n` +
      `- [GitHub](https://github.com/) — code\n` +
      `- email — _replace in \`src/scripts/contact.ts\`_\n\n` +
      `Open to interesting AI engineering work, especially around agents, evals, and ` +
      `tooling. Reach out — I read everything.\n`,
  );
};

export const hire: Script = async function* () {
  yield { type: "thinking_start" };
  await sleep(700);
  yield { type: "thinking_end" };

  yield* streamText(
    `_Reading the room…_\n\n` +
      `**Yes — selectively.** I'm interested in roles or contracts where the work involves real ` +
      `language-model engineering, not just "wrap GPT in a UI." Bonus points for problems where ` +
      `evals, agent design, or developer tooling are first-class concerns.\n\n` +
      `The fastest path is [LinkedIn](https://www.linkedin.com/in/) — message with a sentence ` +
      `or two about the problem you're solving and I'll get back to you.\n`,
  );
};
