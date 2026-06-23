import type { Script } from "./terminal/Stream";
import { unknown } from "./scripts/intro";
import { about } from "./scripts/about";
import { blog } from "./scripts/blog";
import { contact, hire } from "./scripts/contact";
import { surprise } from "./scripts/surprise";
import { findCommand, type CommandContext } from "./commands";

interface NaturalRoute {
  match: RegExp;
  script: Script;
}

const NATURAL_ROUTES: NaturalRoute[] = [
  {
    match: /(who are you|about|tell me about|whoami|introduce)/i,
    script: about,
  },
  {
    match: /\b(blog|posts?|writing|articles?|read)\b/i,
    script: blog(""),
  },
  {
    match: /\b(hire|hiring|available|consult|freelance|contract)\b/i,
    script: hire,
  },
  {
    match: /\b(contact|reach|email|github|find you)\b/i,
    script: contact,
  },
  { match: /\b(surprise|random|something cool)\b/i, script: surprise },
];

export function makeRouter(ctx: CommandContext) {
  return function route(input: string): Script {
    const trimmed = input.trim();

    // slash command: dispatch to registry
    if (trimmed.startsWith("/")) {
      const body = trimmed.slice(1);
      const cmd = findCommand(body);
      if (cmd) {
        const args = body.slice(cmd.name.length).trim();
        return cmd.run(args, ctx);
      }
      return unknownCommand(trimmed);
    }

    // natural language matchers
    for (const r of NATURAL_ROUTES) {
      if (r.match.test(trimmed)) return r.script;
    }
    return unknown(trimmed);
  };
}

function unknownCommand(input: string): Script {
  return async function* () {
    yield {
      type: "text",
      value: `command not found: \`${input}\`. Try \`/help\`.\n`,
    };
  };
}
