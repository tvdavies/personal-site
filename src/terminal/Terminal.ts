import { renderMarkdown } from "./Markdown";
import type { Script, StreamEvent } from "./Stream";
import { sleep } from "./Stream";

const BRAILLE_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export interface TerminalOptions {
  log: HTMLElement;
  form: HTMLFormElement;
  input: HTMLInputElement;
  /** Resolves a free-text prompt (or slash command) to a Script. */
  router: (input: string) => Script;
  /** Optional: called on script start/end to drive shader states. */
  onBusyChange?: (busy: boolean) => void;
}

const HISTORY_KEY = "tom.portfolio.history";
const HISTORY_MAX = 100;

export class Terminal {
  private log: HTMLElement;
  private form: HTMLFormElement;
  private input: HTMLInputElement;
  private router: (input: string) => Script;
  private onBusyChange?: (busy: boolean) => void;
  private busy = false;
  private spinnerTimers = new Map<string, number>();

  // shell-style prompt history (persisted to localStorage).
  // history[0] is the OLDEST entry; cursor === history.length means "new line".
  private history: string[] = [];
  private historyCursor = 0;
  private historyDraft = "";

  constructor(opts: TerminalOptions) {
    this.log = opts.log;
    this.form = opts.form;
    this.input = opts.input;
    this.router = opts.router;
    this.onBusyChange = opts.onBusyChange;

    this.form.addEventListener("submit", this.onSubmit);
    this.log.addEventListener("click", this.onLogClick);
    this.log.addEventListener("keydown", this.onLogKey);
    document.addEventListener("keydown", this.onKey);
    this.input.addEventListener("keydown", this.onInputKey);

    this.loadHistory();
  }

  // ── history persistence ─────────────────────────────
  private loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) this.history = JSON.parse(raw);
    } catch {}
    this.historyCursor = this.history.length;
  }
  private saveHistory() {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history));
    } catch {}
  }
  private pushHistory(entry: string) {
    if (!entry.trim()) return;
    // dedupe consecutive
    if (this.history[this.history.length - 1] === entry) {
      this.historyCursor = this.history.length;
      return;
    }
    this.history.push(entry);
    if (this.history.length > HISTORY_MAX) {
      this.history.splice(0, this.history.length - HISTORY_MAX);
    }
    this.historyCursor = this.history.length;
    this.saveHistory();
  }

  /** Run a scripted response without user input (e.g. autoplay intro). */
  async run(
    prompt: string,
    opts: {
      showUserLine?: boolean;
      script?: Script;
      pushHistory?: boolean;
    } = {},
  ) {
    if (this.busy) return;
    if (opts.showUserLine !== false) this.appendUserLine(prompt);
    if (opts.pushHistory !== false) this.pushHistory(prompt);
    await this.execute(prompt, opts.script);
  }

  // ── private ──────────────────────────────────────────────────────

  private onSubmit = async (e: Event) => {
    e.preventDefault();
    if (this.busy) return;
    const value = this.input.value.trim();
    if (!value) return;
    this.pushHistory(value);
    this.input.value = "";
    this.historyDraft = "";
    this.appendUserLine(value);
    await this.execute(value);
  };

  private onInputKey = (e: KeyboardEvent) => {
    // shell-style history nav. Only when there is no completion menu open
    // (the menu also handles ArrowUp/Down). The menu binds keydown first
    // and calls preventDefault when active, so if e.defaultPrevented is
    // already set we skip.
    if (e.defaultPrevented) return;
    if (e.key === "ArrowUp") {
      if (this.history.length === 0) return;
      e.preventDefault();
      if (this.historyCursor === this.history.length) {
        this.historyDraft = this.input.value;
      }
      this.historyCursor = Math.max(0, this.historyCursor - 1);
      this.input.value = this.history[this.historyCursor] ?? "";
      this.input.setSelectionRange(
        this.input.value.length,
        this.input.value.length,
      );
    } else if (e.key === "ArrowDown") {
      if (this.historyCursor >= this.history.length) return;
      e.preventDefault();
      this.historyCursor++;
      this.input.value =
        this.historyCursor === this.history.length
          ? this.historyDraft
          : this.history[this.historyCursor] ?? "";
      this.input.setSelectionRange(
        this.input.value.length,
        this.input.value.length,
      );
    } else if (
      e.key !== "Enter" &&
      e.key !== "Shift" &&
      e.key !== "Meta" &&
      e.key !== "Control" &&
      e.key !== "Alt"
    ) {
      // any other typing resets the cursor to "new line"
      this.historyCursor = this.history.length;
    }
  };

  private onLogClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const chip = target.closest<HTMLElement>(".chip");
    if (chip && chip.dataset.prompt && !this.busy) {
      const p = chip.dataset.prompt;
      this.input.value = "";
      this.appendUserLine(p);
      void this.execute(p);
      return;
    }
    const toolHeader = target.closest<HTMLElement>(".tool-header");
    if (toolHeader) {
      this.toggleTool(toolHeader);
    }
  };

  // Keyboard support for the collapsible tool panels (they're role="button").
  private onLogKey = (e: KeyboardEvent) => {
    const header = (e.target as HTMLElement).closest<HTMLElement>(
      ".tool-header",
    );
    if (header && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      this.toggleTool(header);
    }
  };

  private toggleTool(header: HTMLElement) {
    const tool = header.parentElement;
    if (!tool) return;
    const collapsed = tool.classList.toggle("collapsed");
    header.setAttribute("aria-expanded", String(!collapsed));
  }

  // Announce a completed response once (avoids per-token screen-reader spam).
  private announce(msg: HTMLElement) {
    const region = document.getElementById("sr-status");
    if (!region) return;
    const text = Array.from(msg.querySelectorAll(".md"))
      .map((e) => e.textContent ?? "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) region.textContent = text;
  }

  private onKey = (e: KeyboardEvent) => {
    // focus input on any printable key when not focused
    if (
      document.activeElement !== this.input &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.altKey &&
      e.key.length === 1
    ) {
      this.input.focus();
    }
  };

  private setBusy(busy: boolean) {
    this.busy = busy;
    this.form.classList.toggle("disabled", busy);
    this.onBusyChange?.(busy);
  }

  private appendUserLine(text: string) {
    const el = document.createElement("div");
    el.className = "msg msg-user";
    el.innerHTML = `<span class="sigil" aria-hidden="true">❯</span><span class="text"></span>`;
    el.querySelector(".text")!.textContent = text;
    this.log.appendChild(el);
    this.scrollToBottom();
  }

  private async execute(prompt: string, override?: Script) {
    this.setBusy(true);
    const script = override ?? this.router(prompt);
    const msg = document.createElement("div");
    msg.className = "msg msg-assistant";
    this.log.appendChild(msg);

    // Streaming content is broken into ordered segments. Each text run
    // gets its own .md element; tool calls / chips / raw_html become
    // their own siblings. This way the visual order matches the order
    // events were emitted, instead of all text rendering above all tools.
    let currentMd: HTMLElement | null = null;
    let currentBuffer = "";

    const startNewTextSegment = () => {
      const el = document.createElement("div");
      el.className = "md";
      msg.appendChild(el);
      currentMd = el;
      currentBuffer = "";
    };

    const closeCurrentSegment = () => {
      if (currentMd) {
        currentMd.querySelectorAll(".caret").forEach((c) => c.remove());
        currentMd = null;
        currentBuffer = "";
      }
    };

    const appendText = (t: string) => {
      if (!currentMd) startNewTextSegment();
      currentBuffer += t;
      currentMd!.innerHTML = renderMarkdown(currentBuffer);
      const caret = document.createElement("span");
      caret.className = "caret";
      caret.textContent = "\u00a0";
      const last = currentMd!.lastElementChild;
      if (last && last.tagName === "P") last.appendChild(caret);
      else currentMd!.appendChild(caret);
      this.scrollToBottom();
    };

    try {
      for await (const ev of script(prompt)) {
        await this.handleEvent(ev, msg, appendText, closeCurrentSegment);
      }
    } catch (err) {
      console.error(err);
      appendText(`\n\n_error: ${(err as Error).message}_`);
    }

    closeCurrentSegment();
    this.announce(msg);
    this.setBusy(false);
    this.input.focus();
    this.scrollToBottom();
  }

  private async handleEvent(
    ev: StreamEvent,
    msg: HTMLElement,
    appendText: (t: string) => void,
    closeSegment: () => void,
  ) {
    switch (ev.type) {
      case "text":
        appendText(ev.value);
        break;
      case "newline":
        appendText("\n");
        break;
      case "delay":
        await sleep(ev.ms);
        break;
      case "thinking_start": {
        closeSegment();
        const t = document.createElement("div");
        t.className = "msg-thinking";
        t.dataset.role = "thinking";
        t.innerHTML = `<span class="spinner" aria-hidden="true"></span> <span class="thinking-label" style="color:var(--fg-dim)">Thinking…</span>`;
        msg.appendChild(t);
        this.startSpinner("thinking", t.querySelector(".spinner")!);
        break;
      }
      case "thinking_end": {
        const t = msg.querySelector('[data-role="thinking"]');
        this.stopSpinner("thinking");
        t?.remove();
        break;
      }
      case "tool_start": {
        closeSegment();
        const tool = document.createElement("div");
        tool.className = "tool";
        tool.dataset.toolId = ev.id;
        tool.innerHTML = `
          <div class="tool-header" role="button" tabindex="0" aria-expanded="true">
            <span class="tool-icon" aria-hidden="true">▸</span>
            <span class="tool-name">${escapeHtml(ev.name)}</span>${
              ev.arg
                ? `<span class="tool-paren" aria-hidden="true">(</span><span class="tool-arg">${escapeHtml(
                    ev.arg,
                  )}</span><span class="tool-paren" aria-hidden="true">)</span>`
                : ""
            }
            <span class="tool-status"><span class="spinner" aria-hidden="true"></span> running</span>
          </div>
          <div class="tool-body"></div>
        `;
        msg.appendChild(tool);
        this.startSpinner(
          `tool-${ev.id}`,
          tool.querySelector(".spinner")!,
        );
        break;
      }
      case "tool_progress": {
        const tool = msg.querySelector(
          `.tool[data-tool-id="${cssEscape(ev.id)}"] .tool-body`,
        );
        if (tool) {
          tool.textContent = (tool.textContent ?? "") + ev.line;
          this.scrollToBottom();
        }
        break;
      }
      case "tool_end": {
        this.stopSpinner(`tool-${ev.id}`);
        const tool = msg.querySelector<HTMLElement>(
          `.tool[data-tool-id="${cssEscape(ev.id)}"]`,
        );
        if (tool) {
          const status = tool.querySelector(".tool-status")!;
          status.classList.add("done");
          status.innerHTML = `✓ ${escapeHtml(ev.summary ?? "done")}`;
        }
        break;
      }
      case "chips": {
        closeSegment();
        const wrap = document.createElement("div");
        wrap.className = "chips";
        wrap.innerHTML = ev.items
          .map(
            (c) =>
              `<button class="chip" data-prompt="${escapeAttr(
                c.prompt,
              )}">${escapeHtml(c.label)}</button>`,
          )
          .join("");
        msg.appendChild(wrap);
        break;
      }
      case "raw_html": {
        closeSegment();
        const wrap = document.createElement("div");
        wrap.className = "raw";
        wrap.innerHTML = ev.html;
        msg.appendChild(wrap);
        break;
      }
    }
  }

  private startSpinner(id: string, el: Element) {
    let i = 0;
    const tick = () => {
      el.textContent = BRAILLE_FRAMES[i++ % BRAILLE_FRAMES.length]!;
    };
    tick();
    const t = window.setInterval(tick, 80);
    this.spinnerTimers.set(id, t);
  }

  private stopSpinner(id: string) {
    const t = this.spinnerTimers.get(id);
    if (t) {
      clearInterval(t);
      this.spinnerTimers.delete(id);
    }
  }

  private scrollToBottom() {
    this.log.scrollTop = this.log.scrollHeight;
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(s: string) {
  return escapeHtml(s).replace(/"/g, "&quot;");
}

function cssEscape(s: string) {
  return s.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}
