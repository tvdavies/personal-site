/**
 * Chrome bootstrap — runs on every page.
 *
 * Sets up the WebGL background and theme system (the parts of the "terminal
 * window" that are shared by the interactive home page and the static blog
 * pages). On non-interactive pages it also wires a *lite* prompt: typing a
 * command teleports you to the live REPL on the home page (theme changes are
 * handled in place, since they're purely visual).
 */

import { initScene, type SceneHandle } from "../canvas/Scene";
import { applyTheme, findTheme, initTheme, nextTheme } from "../theme";

export interface ChromeHandle {
  scene: SceneHandle;
}

const NOOP_SCENE: SceneHandle = {
  setBusy() {},
  triggerEffect() {},
  setAccent() {},
  dispose() {},
};

export function initChrome(opts: { interactive?: boolean } = {}): ChromeHandle {
  const canvas = document.getElementById("bg-canvas") as HTMLCanvasElement | null;
  const scene = canvas ? initScene(canvas) : NOOP_SCENE;

  // Apply the saved theme and keep the shader accent in sync.
  initTheme((t) => scene.setAccent(t.accentRgb));

  if (!opts.interactive) wireLitePrompt();

  return { scene };
}

/** A navigation-only prompt for the static (blog) pages. */
function wireLitePrompt() {
  const form = document.getElementById("prompt-form") as HTMLFormElement | null;
  const input = document.getElementById("prompt-input") as HTMLInputElement | null;
  if (!form || !input) return;

  // On static pages the prompt is a navigation aid, not the live REPL — say so.
  input.setAttribute("aria-label", "Type a command — runs on the home terminal");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = input.value.trim();
    if (!value) return;
    input.value = "";
    routeLite(value);
  });

  // Match the home terminal's "type anywhere to focus" affordance.
  document.addEventListener("keydown", (e) => {
    if (
      document.activeElement !== input &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.altKey &&
      e.key.length === 1
    ) {
      input.focus();
    }
  });
}

function routeLite(value: string) {
  const lower = value.toLowerCase();

  // The blog index is a real page — navigate to it.
  if (lower === "/blog" || lower === "blog") {
    location.href = "/blog";
    return;
  }

  // Theme changes are visual only; apply in place, no round-trip.
  const theme = /^\/?theme\b\s*(.*)$/i.exec(value);
  if (theme) {
    const id = theme[1]?.trim();
    const t = id ? findTheme(id) : nextTheme();
    if (t) applyTheme(t);
    return;
  }

  // Everything else is handed to the live REPL on the home page.
  location.href = "/?q=" + encodeURIComponent(value);
}
