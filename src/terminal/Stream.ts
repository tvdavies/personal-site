/**
 * Stream events emitted by scripted "responses".
 * The Terminal consumes these and renders accordingly.
 */
export type StreamEvent =
  | { type: "text"; value: string }
  | { type: "newline" }
  | { type: "tool_start"; id: string; name: string; arg?: string }
  | { type: "tool_progress"; id: string; line: string }
  | { type: "tool_end"; id: string; ok?: boolean; summary?: string }
  | { type: "thinking_start" }
  | { type: "thinking_end" }
  | { type: "chips"; items: { label: string; prompt: string }[] }
  | { type: "raw_html"; html: string }
  | { type: "delay"; ms: number };

export type Script = (input: string) => AsyncGenerator<StreamEvent, void, void>;

/**
 * Turn a string into a plausible token stream with realistic jitter.
 * Tokens are roughly word/punct chunks. ~120 tokens/sec average.
 */
export async function* streamText(
  text: string,
  opts: { tokensPerSecond?: number; jitter?: number } = {},
): AsyncGenerator<StreamEvent, void, void> {
  const tps = opts.tokensPerSecond ?? 120;
  const jitter = opts.jitter ?? 0.6;
  const baseMs = 1000 / tps;

  // tokenize: words, whitespace runs, punctuation, newlines preserved
  const tokens = text.match(/(\n|\s+|[A-Za-z0-9_'-]+|[^\sA-Za-z0-9_'-])/g) ?? [];

  for (const tok of tokens) {
    yield { type: "text", value: tok };
    // longer pauses on sentence breaks
    let ms = baseMs * (1 + (Math.random() - 0.5) * 2 * jitter);
    if (/[.!?]\s*$/.test(tok)) ms *= 6;
    else if (/[,;:]\s*$/.test(tok)) ms *= 2.5;
    else if (tok === "\n") ms *= 3;
    await sleep(ms);
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, Math.max(0, ms)));
}
