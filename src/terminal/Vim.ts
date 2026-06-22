/**
 * Tiny "vim" takeover modal.
 *
 *   - Fullscreen overlay above everything.
 *   - Renders the given content as plain text with monospace, line numbers.
 *   - Status line at the bottom; ":" enters command mode; ":q", ":wq", ":x"
 *     exit. Esc returns to normal mode.
 *   - j/k scroll. Esc-Esc or :q exits.
 *
 * Not a real vim. It's a costume.
 */

interface VimOptions {
  filename: string;
  content: string;
  onExit: () => void;
}

export function openVim(opts: VimOptions) {
  // singleton
  document.querySelectorAll(".vim-overlay").forEach((n) => n.remove());

  const overlay = document.createElement("div");
  overlay.className = "vim-overlay";
  overlay.tabIndex = 0;
  overlay.innerHTML = `
    <div class="vim-buffer" role="document"></div>
    <div class="vim-status">
      <span class="vim-status-mode">NORMAL</span>
      <span class="vim-status-file"></span>
      <span class="vim-status-spacer"></span>
      <span class="vim-status-pos">1,1</span>
    </div>
    <div class="vim-cmdline" aria-hidden="true"></div>
  `;
  document.body.appendChild(overlay);

  const buf = overlay.querySelector(".vim-buffer") as HTMLElement;
  const modeEl = overlay.querySelector(".vim-status-mode") as HTMLElement;
  const fileEl = overlay.querySelector(".vim-status-file") as HTMLElement;
  const posEl = overlay.querySelector(".vim-status-pos") as HTMLElement;
  const cmdEl = overlay.querySelector(".vim-cmdline") as HTMLElement;

  fileEl.textContent = `"${opts.filename}" — read-only`;

  const lines = opts.content.split("\n");
  const padW = String(lines.length).length;
  buf.innerHTML = lines
    .map(
      (l, i) =>
        `<div class="vim-line"><span class="vim-ln">${String(i + 1).padStart(
          padW,
          " ",
        )}</span><span class="vim-text">${escapeHtml(l) || "&nbsp;"}</span></div>`,
    )
    .join("");

  let mode: "NORMAL" | "COMMAND" = "NORMAL";
  let cmd = "";
  let cursorLine = 0;

  const setMode = (m: typeof mode) => {
    mode = m;
    modeEl.textContent = m;
    modeEl.className = "vim-status-mode" + (m === "COMMAND" ? " cmd" : "");
    cmdEl.textContent = m === "COMMAND" ? `:${cmd}` : "";
  };
  const setPos = () => {
    posEl.textContent = `${cursorLine + 1},1`;
  };
  const exit = () => {
    overlay.remove();
    document.removeEventListener("keydown", onKey, true);
    opts.onExit();
  };

  const moveCursor = (delta: number) => {
    cursorLine = Math.max(0, Math.min(lines.length - 1, cursorLine + delta));
    const lineEls = buf.querySelectorAll<HTMLElement>(".vim-line");
    lineEls.forEach((el, i) =>
      el.classList.toggle("vim-cursor", i === cursorLine),
    );
    lineEls[cursorLine]?.scrollIntoView({ block: "center" });
    setPos();
  };

  const onKey = (e: KeyboardEvent) => {
    if (mode === "NORMAL") {
      if (e.key === ":") {
        e.preventDefault();
        cmd = "";
        setMode("COMMAND");
      } else if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        moveCursor(1);
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        moveCursor(-1);
      } else if (e.key === "g") {
        e.preventDefault();
        cursorLine = 0;
        moveCursor(0);
      } else if (e.key === "G") {
        e.preventDefault();
        cursorLine = lines.length - 1;
        moveCursor(0);
      } else if (e.key === "Escape") {
        e.preventDefault();
        exit();
      } else if (e.key === "ZZ" || (e.shiftKey && e.key === "Z")) {
        // simplified; not real vim
      }
    } else if (mode === "COMMAND") {
      if (e.key === "Escape") {
        e.preventDefault();
        cmd = "";
        setMode("NORMAL");
      } else if (e.key === "Backspace") {
        e.preventDefault();
        if (cmd.length === 0) {
          setMode("NORMAL");
        } else {
          cmd = cmd.slice(0, -1);
          cmdEl.textContent = `:${cmd}`;
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        const c = cmd.trim();
        if (c === "q" || c === "q!" || c === "wq" || c === "x" || c === "quit") {
          exit();
        } else {
          cmdEl.textContent = `E492: Not an editor command: ${c}`;
          cmd = "";
          setTimeout(() => setMode("NORMAL"), 1200);
        }
      } else if (e.key.length === 1) {
        e.preventDefault();
        cmd += e.key;
        cmdEl.textContent = `:${cmd}`;
      }
    }
  };
  document.addEventListener("keydown", onKey, true);

  moveCursor(0);
  setMode("NORMAL");
  overlay.focus();
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
