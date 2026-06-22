/**
 * Floating slash-command completion menu.
 *
 * Behaviour:
 *   - Opens when the input value starts with "/" (or via openManual()).
 *   - Filters items live as you type.
 *   - ↑ / ↓ / Ctrl-P / Ctrl-N navigate.
 *   - Tab completes the highlighted command name into the input.
 *   - Enter selects: if input is exactly "/<name>", runs the command;
 *     otherwise completes the name and waits for args + Enter again.
 *   - Esc / clicking outside closes.
 *
 * The menu is purely a UI; it tells the host (via callbacks) what to do.
 */

import type { Command } from "../commands";
import { filterCommands } from "../commands";

export interface CommandMenuOptions {
  input: HTMLInputElement;
  /** Where to mount the floating menu (positioned absolutely). */
  anchor: HTMLElement;
  /** Called when the user selects + commits a command (e.g. presses Enter on /help). */
  onRun: (raw: string) => void;
}

export class CommandMenu {
  private input: HTMLInputElement;
  private anchor: HTMLElement;
  private onRun: (raw: string) => void;

  private el: HTMLDivElement;
  private listEl: HTMLDivElement;
  private items: Command[] = [];
  private active = 0;
  private open = false;

  constructor(opts: CommandMenuOptions) {
    this.input = opts.input;
    this.anchor = opts.anchor;
    this.onRun = opts.onRun;

    this.el = document.createElement("div");
    this.el.className = "cmd-menu";
    this.el.setAttribute("role", "listbox");
    this.el.setAttribute("aria-label", "Commands");
    this.el.innerHTML = `
      <div class="cmd-menu-header">
        <span class="cmd-menu-title">commands</span>
        <span class="cmd-menu-hint">
          <kbd>↑</kbd><kbd>↓</kbd> nav
          · <kbd>⇥</kbd> complete
          · <kbd>⏎</kbd> run
          · <kbd>esc</kbd> close
        </span>
      </div>
      <div class="cmd-menu-list"></div>
    `;
    this.listEl = this.el.querySelector(".cmd-menu-list") as HTMLDivElement;
    this.anchor.appendChild(this.el);
    this.hide();

    this.input.addEventListener("input", this.onInput);
    // capture: true so we run before other input keydown handlers
    // (e.g. Terminal's history nav) and can swallow keys when open.
    this.input.addEventListener("keydown", this.onKeyDown, { capture: true });
    this.input.addEventListener("blur", this.onBlur);
    this.listEl.addEventListener("mousedown", this.onListMouseDown);
    this.listEl.addEventListener("mousemove", this.onListMouseMove);
  }

  /** Open the menu with no filter ("/" prefix not required). */
  openManual() {
    if (!this.input.value.startsWith("/")) {
      this.input.value = "/";
    }
    this.refresh();
    this.show();
  }

  /** Public: should the host treat Enter as "run command"? */
  isOpen(): boolean {
    return this.open;
  }

  // ── internals ────────────────────────────────────────────────

  private onInput = () => {
    const v = this.input.value;
    if (v.startsWith("/")) {
      this.refresh();
      this.show();
    } else {
      this.hide();
    }
  };

  private onBlur = () => {
    // Defer so a click on a menu item can still register.
    setTimeout(() => this.hide(), 120);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (!this.open) {
      // Allow "/" at column 0 to summon explicitly even if value cleared.
      return;
    }
    if (e.key === "ArrowDown" || (e.ctrlKey && e.key === "n")) {
      e.preventDefault();
      this.move(1);
    } else if (e.key === "ArrowUp" || (e.ctrlKey && e.key === "p")) {
      e.preventDefault();
      this.move(-1);
    } else if (e.key === "Tab") {
      e.preventDefault();
      this.complete();
    } else if (e.key === "Escape") {
      e.preventDefault();
      this.hide();
    } else if (e.key === "Enter") {
      // If the input is exactly "/<name>" with no args, run it now via onRun.
      // Otherwise we let the form submit handler run the (possibly arg'd) command.
      const v = this.input.value.trim();
      const head = v.slice(1).split(/\s+/)[0] ?? "";
      const exact = this.items.find(
        (c) => c.name === head || c.aliases?.includes(head),
      );
      if (!exact && this.items.length) {
        // No exact match yet — Tab-complete first, *don't* submit.
        e.preventDefault();
        this.complete();
        return;
      }
      // exact match exists — let the normal submit handler take it,
      // but close the menu first.
      this.hide();
    }
  };

  private onListMouseDown = (e: MouseEvent) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>(".cmd-row");
    if (!row) return;
    e.preventDefault(); // don't blur input
    const i = Number(row.dataset.index);
    if (Number.isNaN(i)) return;
    this.active = i;
    this.complete({ runIfNoArgs: true });
  };

  private onListMouseMove = (e: MouseEvent) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>(".cmd-row");
    if (!row) return;
    const i = Number(row.dataset.index);
    if (Number.isNaN(i)) return;
    if (i !== this.active) {
      this.active = i;
      this.renderActive();
    }
  };

  private refresh() {
    const q = this.input.value.startsWith("/")
      ? this.input.value.slice(1)
      : this.input.value;
    this.items = filterCommands(q);
    this.active = Math.min(this.active, Math.max(0, this.items.length - 1));
    this.render();
  }

  private render() {
    if (!this.items.length) {
      this.listEl.innerHTML = `<div class="cmd-empty">no matches</div>`;
      return;
    }
    this.listEl.innerHTML = this.items
      .map((c, i) => {
        const aliases = c.aliases?.length
          ? `<span class="cmd-aliases">${c.aliases.map(escapeHtml).join(", ")}</span>`
          : "";
        return `
          <div class="cmd-row${i === this.active ? " active" : ""}"
               role="option"
               data-index="${i}"
               aria-selected="${i === this.active ? "true" : "false"}">
            <span class="cmd-cat cmd-cat-${c.category}"></span>
            <span class="cmd-name">/${escapeHtml(c.name)}</span>
            ${aliases}
            <span class="cmd-desc">${escapeHtml(c.description)}</span>
          </div>
        `;
      })
      .join("");
  }

  private renderActive() {
    const rows = this.listEl.querySelectorAll<HTMLElement>(".cmd-row");
    rows.forEach((r, i) => {
      r.classList.toggle("active", i === this.active);
      r.setAttribute("aria-selected", i === this.active ? "true" : "false");
    });
    rows[this.active]?.scrollIntoView({ block: "nearest" });
  }

  private move(delta: number) {
    if (!this.items.length) return;
    this.active = (this.active + delta + this.items.length) % this.items.length;
    this.renderActive();
  }

  private complete(opts: { runIfNoArgs?: boolean } = {}) {
    const cmd = this.items[this.active];
    if (!cmd) return;
    const v = this.input.value;
    const parts = v.startsWith("/") ? v.slice(1).split(/\s+/) : [v];
    const args = parts.slice(1).join(" ");
    this.input.value = `/${cmd.name}${args ? " " + args : ""}`;
    if (opts.runIfNoArgs && !args) {
      this.hide();
      this.onRun(this.input.value);
      this.input.value = "";
    } else {
      // place cursor at end and refresh filter
      this.input.setSelectionRange(this.input.value.length, this.input.value.length);
      this.refresh();
    }
  }

  private show() {
    this.el.classList.add("open");
    this.open = true;
  }

  private hide() {
    this.el.classList.remove("open");
    this.open = false;
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
