import type { Script } from "../terminal/Stream";
import { sleep, streamText } from "../terminal/Stream";

export const cv: Script = async function* () {
  yield { type: "thinking_start" };
  await sleep(450);
  yield { type: "thinking_end" };

  yield { type: "tool_start", id: "ls", name: "Bash", arg: "ls ~/cv" };
  await sleep(200);
  yield {
    type: "tool_progress",
    id: "ls",
    line: "cv.md  cv.pdf  references.txt\n",
  };
  yield { type: "tool_end", id: "ls", summary: "3 files" };
  await sleep(120);

  yield { type: "tool_start", id: "read-cv", name: "Read", arg: "cv.md" };
  await sleep(280);
  yield { type: "tool_end", id: "read-cv", summary: "read" };
  await sleep(120);

  yield* streamText(
    `## Experience\n\n` +
      `**[Current Company]** — Senior AI Engineer · _2023 – present_\n\n` +
      `Building [thing] with [stack]. Led [project], shipped [outcome].\n\n` +
      `**[Previous Company]** — Software Engineer · _2020 – 2023_\n\n` +
      `Worked on [thing]. Notable: [outcome].\n\n` +
      `## Skills\n\n` +
      `- **Languages:** TypeScript, Python, Go\n` +
      `- **AI / ML:** LLM orchestration, agents, RAG, evals, fine-tuning\n` +
      `- **Infra:** Bun, Node, Postgres, Redis, Docker, AWS\n` +
      `- **Frontend:** React, vanilla DOM, Three.js, WebGL\n\n` +
      `## Education\n\n` +
      `**[University]** — [Degree] · _[Year]_\n\n` +
      `---\n\n` +
      `_Edit \`src/scripts/cv.ts\` to fill in the real details. ` +
      `A "Download PDF" button is on the way._\n`,
  );

  yield {
    type: "chips",
    items: [
      { label: "what have you built?", prompt: "what have you built?" },
      { label: "how do I contact you?", prompt: "how do I contact you?" },
    ],
  };
};
