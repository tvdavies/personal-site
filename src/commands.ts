/**
 * Slash-command registry.
 *
 * Adding a command = appending one entry below. The completion menu picks
 * them up automatically (filtering by name/description), and the router
 * dispatches `/<name> <args>` here.
 */

import type { Script } from "./terminal/Stream";
import { sleep, streamText } from "./terminal/Stream";
import { help } from "./scripts/intro";
import { about } from "./scripts/about";
import { projects } from "./scripts/projects";
import { blog } from "./scripts/blog";
import { contact, hire } from "./scripts/contact";
import { surprise } from "./scripts/surprise";

export interface CommandContext {
  /** Shader effect trigger — see canvas/Scene.ts. */
  effect: (name: "glitch" | "pulse", ms?: number) => void;
  /** Imperative log clear (handled by main.ts). */
  clearLog: () => void;
  /** Apply a named theme by id; if no id, cycle. Returns applied id. */
  applyTheme: (id?: string) => string;
  /** Run matrix rain overlay for ms. */
  matrixRain: (ms?: number) => void;
  /** Open the vim takeover with a filename + plain text content. */
  vim: (filename: string, content: string) => void;
}

export interface Command {
  name: string;
  aliases?: string[];
  description: string;
  category: "info" | "fun" | "system";
  /** Hidden from the completion menu but still runnable. */
  hidden?: boolean;
  run: (args: string, ctx: CommandContext) => Script;
}

export const COMMANDS: Command[] = [
  // ── info ──────────────────────────────────────────────────────
  {
    name: "help",
    aliases: ["?"],
    description: "list available commands",
    category: "info",
    run: () => help,
  },
  {
    name: "whoami",
    aliases: ["about", "bio"],
    description: "who is Tom Davies?",
    category: "info",
    run: () => about,
  },
  {
    name: "projects",
    aliases: ["ls", "portfolio"],
    description: "selected projects",
    category: "info",
    run: () => projects,
  },
  {
    name: "blog",
    aliases: ["posts", "writing"],
    description: "read the blog",
    category: "info",
    run: (args) => blog(args),
  },
  {
    name: "contact",
    aliases: ["reach"],
    description: "how to reach me",
    category: "info",
    run: () => contact,
  },
  {
    name: "hire",
    description: "are you available?",
    category: "info",
    run: () => hire,
  },

  // ── fun ───────────────────────────────────────────────────────
  {
    name: "surprise",
    description: "show me something cool",
    category: "fun",
    run: () => surprise,
  },
  {
    name: "glitch",
    description: "break the simulation for a moment",
    category: "fun",
    run: (_args, ctx) =>
      async function* () {
        ctx.effect("glitch", 1800);
        yield* streamText(
          `\`\`\`\nE_REALITY_CHECK: signal lost\n  retrying...\n  retrying...\n  ok.\n\`\`\`\n_It's fine. Everything is fine._\n`,
          { tokensPerSecond: 80 },
        );
      },
  },
  {
    name: "coffee",
    description: "brew a cup",
    category: "fun",
    run: () =>
      async function* () {
        yield {
          type: "tool_start",
          id: "brew",
          name: "Brew",
          arg: "espresso",
        };
        await sleep(900);
        yield {
          type: "tool_progress",
          id: "brew",
          line: "  grinding...\n  tamping...\n  pulling shot...\n",
        };
        await sleep(500);
        yield { type: "tool_end", id: "brew", summary: "double, 28s" };
        await sleep(150);
        yield {
          type: "raw_html",
          html:
            `<pre style="color:var(--fg-dim);line-height:1.1;margin:6px 0 12px">` +
            [
              "      ( (",
              "       ) )",
              "    ........",
              "    |      |]",
              "    \\      /",
              "     `----'",
            ]
              .join("\n")
              .replace(/</g, "&lt;") +
            `</pre>`,
        };
        yield* streamText(`☕ Done. _What were we talking about?_\n`);
      },
  },
  {
    name: "sudo",
    description: "elevate privileges",
    category: "fun",
    run: (args) =>
      async function* () {
        const target = args.trim() || "(nothing)";
        yield* streamText(
          `\`[sudo] password for visitor:\` `,
          { tokensPerSecond: 200 },
        );
        await sleep(700);
        yield { type: "text", value: "•••••••\n\n" };
        await sleep(400);
        if (/hire[-\s]?me/i.test(target)) {
          yield* streamText(
            `Permission granted. The real answer is \`/hire\` — but the short ` +
              `version: happily at Lleverage, open to interesting side projects. ` +
              `Mail [tvdavies@gmail.com](mailto:tvdavies@gmail.com).\n`,
          );
          return;
        }
        yield* streamText(
          `\`visitor is not in the sudoers file. This incident will be reported.\`\n\n` +
            `_(but if you meant \`sudo hire-me\`, try that.)_\n`,
        );
      },
  },
  {
    name: "matrix",
    description: "follow the white rabbit",
    category: "fun",
    run: (_args, ctx) =>
      async function* () {
        ctx.matrixRain(6500);
        yield* streamText(
          `_Wake up, Tom…_\n\n` +
            "```\nthe matrix has you\nfollow the white rabbit\n```\n",
          { tokensPerSecond: 60 },
        );
      },
  },
  {
    name: "vim",
    description: "open a file in vim (try /vim about)",
    category: "fun",
    run: (args, ctx) =>
      async function* () {
        const target = (args.trim() || "about")
          .toLowerCase()
          .replace(/\.[^.]+$/, "");
        const file = VIM_FILES[target];
        if (!file) {
          yield* streamText(
            `\`vim: ${args.trim() || "about"}: No such file. Try one of:\` ` +
              Object.keys(VIM_FILES)
                .map((f) => `\`${f}\``)
                .join(", ") +
              `\n`,
          );
          return;
        }
        ctx.vim(file.filename, file.content);
        yield* streamText(
          `_(opened \`${file.filename}\` in vim. Press \`:q\` to quit.)_\n`,
          { tokensPerSecond: 200 },
        );
      },
  },
  {
    name: "theme",
    description: "cycle or set the colour theme",
    category: "system",
    run: (args, ctx) =>
      async function* () {
        const id = ctx.applyTheme(args.trim() || undefined);
        yield* streamText(
          `Theme → **${id}**. ` +
            `_Try \`/theme\` again to cycle, or \`/theme phosphor\` / \`midnight\` / \`synthwave\` / \`amber\`._\n`,
          { tokensPerSecond: 200 },
        );
      },
  },

  // ── system ────────────────────────────────────────────────────
  {
    name: "clear",
    aliases: ["cls"],
    description: "clear the screen",
    category: "system",
    run: (_args, ctx) =>
      async function* () {
        ctx.clearLog();
      },
  },
  {
    name: "model",
    description: "switch personality",
    category: "system",
    run: (args) =>
      async function* () {
        const m = args.trim();
        if (!m) {
          yield* streamText(
            `## Models\n\n` +
              `- **tom-4-opus** _(current)_ — verbose, the long answer\n` +
              `- **tom-4-haiku** — terse, the short answer\n` +
              `- **tom-1-classic** — circa 2014, plays guitar\n\n` +
              `Usage: \`/model tom-4-haiku\`\n`,
          );
          return;
        }
        const pill = document.querySelector(".status-pill");
        if (pill) pill.textContent = m;
        yield* streamText(`Switched to **${m}**.\n`, { tokensPerSecond: 200 });
      },
  },
];

/** Resolve a slash-command input like "/glitch" or "model tom-4-haiku". */
export function findCommand(query: string): Command | undefined {
  const name = query.toLowerCase().split(/\s+/)[0] ?? "";
  return COMMANDS.find(
    (c) => c.name === name || c.aliases?.includes(name),
  );
}

/** Filter commands for the completion menu. */
export function filterCommands(query: string): Command[] {
  const q = query.toLowerCase().trim();
  const visible = COMMANDS.filter((c) => !c.hidden);
  if (!q) return visible;
  // simple subseq + startsWith ranking
  const score = (c: Command) => {
    const hay = [c.name, ...(c.aliases ?? []), c.description].join(" ");
    if (c.name.startsWith(q)) return 0;
    if (c.aliases?.some((a) => a.startsWith(q))) return 1;
    if (hay.includes(q)) return 2;
    if (subseq(c.name, q)) return 3;
    return 99;
  };
  return visible
    .map((c) => [c, score(c)] as const)
    .filter(([, s]) => s < 99)
    .sort((a, b) => a[1] - b[1])
    .map(([c]) => c);
}

function subseq(hay: string, needle: string): boolean {
  let i = 0;
  for (const ch of hay.toLowerCase()) {
    if (ch === needle[i]) i++;
    if (i === needle.length) return true;
  }
  return false;
}

// ── vim file table ────────────────────────────────────────────────
// Plain-text "files" the /vim command can open. Edit freely.
export const VIM_FILES: Record<string, { filename: string; content: string }> =
  {
    about: {
      filename: "~/about/bio.md",
      content: `# Tom Davies

AI engineer. I build things with language models — agents, tools,
eval harnesses, the kind of plumbing that turns "cool demo" into
"ships and stays up."

I care about legible systems, tight feedback loops, and the
difference between something that demos well and something that
works well.

— end of file —
`,
    },
    readme: {
      filename: "~/README.md",
      content: `# this site

A personal site that pretends to be a CLI agent.
Static Astro + vanilla TypeScript. WebGL shader behind the chrome.

  /help     list commands
  /blog     read the blog
  /matrix   follow the white rabbit
  /theme    cycle palettes
  /vim      open a file (about | readme)

— end of file —
`,
    },
  };
