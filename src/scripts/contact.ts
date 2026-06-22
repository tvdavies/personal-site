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
    line: "→ email:  ok\n→ github: ok\n",
  };
  yield { type: "tool_end", id: "resolve", summary: "2 channels" };
  await sleep(140);

  yield* streamText(
    `## Contact\n\n` +
      `- [tvdavies@gmail.com](mailto:tvdavies@gmail.com) — email, best for ` +
      `anything substantial\n` +
      `- [GitHub](https://github.com/tvdavies) — code\n` +
      `- [Blog](/blog) — what I'm thinking about\n\n` +
      `I'm not job-hunting — happily at [Lleverage](https://lleverage.ai) — but ` +
      `I read everything, and a genuinely interesting side project will always ` +
      `get my attention. Try \`/hire\` for the longer version.\n`,
  );
};

export const hire: Script = async function* () {
  yield { type: "thinking_start" };
  await sleep(700);
  yield { type: "thinking_end" };

  yield* streamText(
    `_Reading the room…_\n\n` +
      `**Happily employed.** I'm an AI engineer at ` +
      `[Lleverage](https://lleverage.ai), so I'm not looking for a new role or ` +
      `contract work right now.\n\n` +
      `That said — I'm always up for a good *side* project. If you've got ` +
      `something genuinely novel (agents, evals, developer tooling, the strange ` +
      `edges of LLM engineering) and you want a collaborator or just a sounding ` +
      `board, I'd love to hear about it. I can't promise bandwidth, but the ` +
      `right problem is hard to resist.\n\n` +
      `Email me: [tvdavies@gmail.com](mailto:tvdavies@gmail.com).\n`,
  );
};
