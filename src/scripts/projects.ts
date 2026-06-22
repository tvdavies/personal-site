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
    line:
      "drwxr-xr-x  this-site/\n" +
      "drwxr-xr-x  project-alpha/\n" +
      "drwxr-xr-x  project-beta/\n" +
      "drwxr-xr-x  project-gamma/\n",
  };
  yield { type: "tool_end", id: "ls-p", summary: "4 dirs" };
  await sleep(140);

  yield* streamText(
    `## Selected projects\n\n` +
      `### this-site\n` +
      `The thing you're looking at. A personal site that pretends to be a CLI agent. ` +
      `Vanilla TypeScript + Bun, with a WebGL canvas underneath for shader effects.\n\n` +
      `### project-alpha\n` +
      `_Short description._ What it does, what's interesting about it, what you learned.\n\n` +
      `### project-beta\n` +
      `_Short description._ Replace me.\n\n` +
      `### project-gamma\n` +
      `_Short description._ Replace me.\n\n` +
      `---\n\n` +
      `_Edit \`src/scripts/projects.ts\` to fill these in._\n`,
  );
};
