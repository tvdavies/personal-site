import type { Script } from "../terminal/Stream";
import { sleep, streamText } from "../terminal/Stream";

export const projects: Script = async function* () {
  yield { type: "thinking_start" };
  await sleep(400);
  yield { type: "thinking_end" };

  yield { type: "tool_start", id: "ls-p", name: "Bash", arg: "ls ~/projects" };
  await sleep(220);
  yield {
    type: "tool_progress",
    id: "ls-p",
    line: "drwxr-xr-x  this-site/\n",
  };
  yield { type: "tool_end", id: "ls-p", summary: "1 dir" };
  await sleep(140);

  yield* streamText(
    `## Selected projects\n\n` +
      `### this-site\n` +
      `The thing you're looking at. A personal site that pretends to be a CLI ` +
      `agent — static [Astro](https://astro.build) under the hood, a hand-rolled ` +
      `terminal UI in vanilla TypeScript, and a WebGL shader for the background. ` +
      `Zero client dependencies. Source on ` +
      `[GitHub](https://github.com/tvdavies).\n\n` +
      `---\n\n` +
      `_More to come. I mostly build at work these days; the side projects ` +
      `worth sharing will land [on the blog](/blog)._\n`,
  );

  yield {
    type: "chips",
    items: [
      { label: "how it's built", prompt: "/blog how-this-site-works" },
      { label: "read the blog", prompt: "/blog" },
      { label: "how do I reach you?", prompt: "/contact" },
    ],
  };
};
