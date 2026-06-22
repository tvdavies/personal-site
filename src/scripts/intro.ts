import type { Script, StreamEvent } from "../terminal/Stream";
import { sleep, streamText } from "../terminal/Stream";

export const intro: Script = async function* () {
  yield { type: "thinking_start" };
  await sleep(550);
  yield { type: "thinking_end" };

  yield {
    type: "tool_start",
    id: "read-about",
    name: "Read",
    arg: "about.md",
  };
  await sleep(220);
  yield {
    type: "tool_progress",
    id: "read-about",
    line: "→ 1 file, 412 bytes\n",
  };
  await sleep(180);
  yield { type: "tool_end", id: "read-about", summary: "read 412 bytes" };
  await sleep(160);

  yield* streamText(
    `# Hi, I'm Tom Davies\n\n` +
      `I'm an **AI engineer** — I build things with language models, and occasionally write about them. ` +
      `This site is, somewhat on the nose, a portfolio shaped like the tools I use every day.\n\n` +
      `Type a question below, pick one of the chips, or try \`/help\` to see slash commands. ` +
      `_(I'm not actually an LLM — every response is hand-written. The joke is that the assistant is me.)_\n\n`,
  );

  yield {
    type: "chips",
    items: [
      { label: "/cv", prompt: "/cv" },
      { label: "/projects", prompt: "/projects" },
      { label: "/contact", prompt: "/contact" },
      { label: "/glitch", prompt: "/glitch" },
      { label: "/help", prompt: "/help" },
    ],
  };
};

/** Fallback for unknown prompts. */
export const unknown: (input: string) => Script = (input) =>
  async function* () {
    yield* streamText(
      `I'm a deterministic Tom, not a generative one — I only know answers I've written ahead of time. ` +
        `I don't have a scripted answer for **${truncate(input, 60)}**.\n\n` +
        `Try one of these instead:`,
      { tokensPerSecond: 140 },
    );
    yield {
      type: "chips",
      items: [
        { label: "tell me about Tom", prompt: "tell me about Tom" },
        { label: "show me your CV", prompt: "show me your CV" },
        { label: "what have you built?", prompt: "what have you built?" },
        { label: "how do I contact you?", prompt: "how do I contact you?" },
        { label: "/help", prompt: "/help" },
      ],
    };
  };

export const help: Script = async function* () {
  yield* streamText(
    `## Commands\n\n` +
      `- \`/help\` — this list\n` +
      `- \`/clear\` — clear the screen\n` +
      `- \`/model\` — switch personality (coming soon)\n\n` +
      `## Try asking\n\n` +
      `- "tell me about Tom"\n` +
      `- "show me your CV"\n` +
      `- "what have you built?"\n` +
      `- "how do I contact you?"\n` +
      `- "are you available for hire?"\n` +
      `- "surprise me"\n`,
    { tokensPerSecond: 160 },
  );
};

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
