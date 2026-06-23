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
      `- [tvdavies@gmail.com](mailto:tvdavies@gmail.com), best for anything ` +
      `that needs a proper reply\n` +
      `- [GitHub](https://github.com/tvdavies)\n` +
      `- [Blog](/blog)\n\n` +
      `I'm not job hunting. I'm happily at [Lleverage](https://lleverage.ai). ` +
      `But I read everything, and a genuinely interesting side project will ` +
      `always get my attention. Try \`/hire\` for the longer version.\n`,
  );
};

export const hire: Script = async function* () {
  yield { type: "thinking_start" };
  await sleep(700);
  yield { type: "thinking_end" };

  yield* streamText(
    `_Reading the room..._\n\n` +
      `I'm happily employed. I build AI agents at ` +
      `[Lleverage](https://lleverage.ai), so I'm not after a job or contract ` +
      `work right now.\n\n` +
      `That said, I'm always up for a good side project. If you've got ` +
      `something genuinely interesting (agents, evals, developer tooling, the ` +
      `odd corners of LLM engineering) and you want a hand, or just someone to ` +
      `think it through with, I'd like to hear about it. I can't promise much ` +
      `time, but a good problem is hard to leave alone.\n\n` +
      `Email me at [tvdavies@gmail.com](mailto:tvdavies@gmail.com).\n`,
  );
};
