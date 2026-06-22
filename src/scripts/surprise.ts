import type { Script } from "../terminal/Stream";
import { sleep, streamText } from "../terminal/Stream";

const SURPRISES: string[] = [
  `## A small belief\n\nMost "AI products" are still websites. The interesting ones are operating systems.\n`,
  `## A poem (kind of)\n\n\`\`\`\nthe model said: i don't know.\nthe engineer said: good, then we can ship.\n\`\`\`\n`,
  `## A confession\n\nI rewrote this site three times before keeping the first version.\n`,
  `## A hot take\n\nEvals are the hardest part of LLM engineering, and the part everyone skips.\n`,
];

export const surprise: Script = async function* () {
  yield { type: "thinking_start" };
  await sleep(500);
  yield { type: "thinking_end" };

  const pick = SURPRISES[Math.floor(Math.random() * SURPRISES.length)]!;
  yield* streamText(pick);
};
