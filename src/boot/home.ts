/**
 * Home bootstrap — the full interactive terminal REPL.
 *
 * Builds on initChrome() (WebGL + theme) and adds the command engine, the
 * slash-command menu, the fake-vim takeover, and deep-link handling:
 *
 *   /?q=<prompt>   runs an arbitrary prompt on load (used by the lite prompt
 *                  on blog pages to hand a command back to the REPL)
 *   /#about        runs a section command on load, and again on `hashchange`
 *                  (this is what the nav strip triggers without a reload)
 */

import { Terminal } from "../terminal/Terminal";
import { CommandMenu } from "../terminal/CommandMenu";
import { openVim } from "../terminal/Vim";
import { makeRouter } from "../router";
import { intro } from "../scripts/intro";
import { applyTheme, findTheme, nextTheme } from "../theme";
import { runMatrixRain } from "../canvas/MatrixRain";
import { initChrome } from "./chrome";

export function initHome() {
  const { scene } = initChrome({ interactive: true });

  const log = document.getElementById("log") as HTMLElement;
  const form = document.getElementById("prompt-form") as HTMLFormElement;
  const input = document.getElementById("prompt-input") as HTMLInputElement;

  const router = makeRouter({
    effect: (name, ms) => scene.triggerEffect(name, ms),
    clearLog: () => {
      log.innerHTML = "";
    },
    applyTheme: (id) => {
      const t = id ? findTheme(id) : nextTheme();
      if (!t) return id ?? "?";
      applyTheme(t);
      return t.id;
    },
    matrixRain: (ms) => runMatrixRain(ms),
    vim: (filename, content) =>
      openVim({ filename, content, onExit: () => input.focus() }),
  });

  // Track busy so nav clicks can queue a section instead of being dropped.
  let busy = false;
  let pendingSection: string | null = null;

  const terminal = new Terminal({
    log,
    form,
    input,
    router,
    onBusyChange: (b) => {
      busy = b;
      scene.setBusy(b);
      if (!b && pendingSection) {
        const cmd = pendingSection;
        pendingSection = null;
        void terminal.run(cmd, { showUserLine: true });
      }
    },
  });

  // Run an in-page section robustly: works even when the URL hash didn't
  // change (re-clicking the active nav item) and queues instead of being
  // silently dropped if a response is still streaming.
  const runSection = (cmd: string) => {
    if (busy) pendingSection = cmd;
    else void terminal.run(cmd, { showUserLine: true });
  };

  const menu = new CommandMenu({
    input,
    anchor: form,
    onRun: (raw) => {
      void terminal.run(raw, { showUserLine: true });
    },
  });

  // Global "/" hotkey to summon the menu when not focused on the input.
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "/" &&
      document.activeElement !== input &&
      !e.metaKey &&
      !e.ctrlKey
    ) {
      e.preventDefault();
      input.focus();
      menu.openManual();
    }
  });

  // ── deep links ────────────────────────────────────────────────
  const runHash = () => {
    const key = location.hash.replace(/^#/, "").toLowerCase().trim();
    setNavActive(key);
    const p = hashToPrompt(location.hash);
    if (p) runSection(p);
  };

  const params = new URLSearchParams(location.search);
  const q = params.get("q");

  if (q) {
    // Clean the URL so a refresh/share doesn't re-run the query.
    history.replaceState(null, "", location.pathname + location.hash);
    void terminal.run(q, { showUserLine: true });
  } else if (hashToPrompt(location.hash)) {
    runHash();
  } else {
    void terminal.run("tell me about Tom Davies", {
      showUserLine: true,
      script: intro,
      pushHistory: false,
    });
  }

  // Intercept nav-strip clicks for in-page sections so they always run — even
  // on re-click (no hashchange fires) or while a response is still streaming.
  // The blog link is a real route, so it's left to navigate normally.
  document.querySelectorAll<HTMLAnchorElement>(".nav-link").forEach((a) => {
    const href = a.getAttribute("href") ?? "";
    if (!href.startsWith("/#")) return;
    const key = href.slice(2).toLowerCase();
    const prompt = hashToPrompt("#" + key);
    if (!prompt) return;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      if (location.hash !== "#" + key) {
        history.replaceState(null, "", "/#" + key);
      }
      setNavActive(key);
      runSection(prompt);
      input.focus();
    });
  });

  // Back/forward or a manually edited hash still works.
  window.addEventListener("hashchange", runHash);

  input.focus();
}

const HASH_COMMANDS = new Set([
  "about",
  "whoami",
  "bio",
  "contact",
  "reach",
  "hire",
  "help",
  "surprise",
]);

/** Map a URL hash like "#about" to a slash command, or null. */
function hashToPrompt(hash: string): string | null {
  const key = hash.replace(/^#/, "").toLowerCase().trim();
  if (!key) return null;
  return HASH_COMMANDS.has(key) ? `/${key}` : null;
}

// Which nav item (if any) a hash maps to, for aria-current / active styling.
const NAV_FOR_HASH: Record<string, string> = {
  about: "about",
  whoami: "about",
  bio: "about",
  contact: "contact",
  reach: "contact",
};

function setNavActive(key: string) {
  const id = NAV_FOR_HASH[key];
  document.querySelectorAll<HTMLAnchorElement>(".nav-link").forEach((a) => {
    const active = !!id && a.getAttribute("href") === `/#${id}`;
    a.classList.toggle("active", active);
    if (active) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}
