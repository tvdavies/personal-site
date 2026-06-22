import { Terminal } from "./terminal/Terminal";
import { CommandMenu } from "./terminal/CommandMenu";
import { openVim } from "./terminal/Vim";
import { makeRouter } from "./router";
import { intro } from "./scripts/intro";
import { initScene } from "./canvas/Scene";
import { runMatrixRain } from "./canvas/MatrixRain";
import { applyTheme, findTheme, initTheme, nextTheme } from "./theme";

const log = document.getElementById("log") as HTMLElement;
const form = document.getElementById("prompt-form") as HTMLFormElement;
const input = document.getElementById("prompt-input") as HTMLInputElement;
const canvas = document.getElementById("bg-canvas") as HTMLCanvasElement;

const scene = initScene(canvas);

// Theme: load saved preference (or default), and keep the shader accent
// in sync whenever the theme changes.
initTheme((t) => scene.setAccent(t.accentRgb));

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
    openVim({
      filename,
      content,
      onExit: () => input.focus(),
    }),
});

const terminal = new Terminal({
  log,
  form,
  input,
  router,
  onBusyChange: (busy) => scene.setBusy(busy),
});

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

queueMicrotask(() => {
  void terminal.run("tell me about Tom Davies", {
    showUserLine: true,
    script: intro,
    pushHistory: false,
  });
});

input.focus();
