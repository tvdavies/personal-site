import type { Script } from "../terminal/Stream";
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
      `I'm a software engineer. I build things, lately a lot of them with ` +
      `language models, and I [write about it](/blog) now and then. This site ` +
      `is a portfolio shaped like the tools I use all day, which felt more ` +
      `honest than a landing page.\n\n` +
      `Type a question below, use the nav up top, or try \`/help\` for ` +
      `commands. _(I'm not actually an LLM. Every response here is ` +
      `hand-written. The joke is that the assistant is me.)_\n\n`,
  );

  yield {
    type: "chips",
    items: [
      { label: "/blog", prompt: "/blog" },
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
      `I'm a deterministic Tom, not a generative one. I only know the answers ` +
        `I've written ahead of time, and I don't have one for ` +
        `**${truncate(input, 60)}**.\n\n` +
        `Try one of these instead:`,
      { tokensPerSecond: 140 },
    );
    yield {
      type: "chips",
      items: [
        { label: "tell me about Tom", prompt: "tell me about Tom" },
        { label: "read the blog", prompt: "/blog" },
        { label: "how do I contact you?", prompt: "how do I contact you?" },
        { label: "/help", prompt: "/help" },
      ],
    };
  };

export const help: Script = async function* () {
  yield* streamText(
    `## Commands\n\n` +
      `- \`/help\` this list\n` +
      `- \`/whoami\` who is Tom?\n` +
      `- \`/blog\` read the blog (try \`/blog <slug>\`)\n` +
      `- \`/contact\` how to reach me\n` +
      `- \`/theme\` repaint everything\n` +
      `- \`/clear\` clear the screen\n\n` +
      `## Try asking\n\n` +
      `- "tell me about Tom"\n` +
      `- "show me the blog"\n` +
      `- "how do I contact you?"\n` +
      `- "are you available for hire?"\n` +
      `- "surprise me"\n`,
    { tokensPerSecond: 160 },
  );
};

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
