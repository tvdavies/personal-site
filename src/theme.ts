/**
 * Theme palettes. Each theme sets a handful of CSS custom properties
 * on :root (so the chrome restyles instantly) and provides a linear-ish
 * RGB triplet for the WebGL shader's accent uniform.
 */

export interface Theme {
  id: string;
  label: string;
  /** Linear-ish RGB 0..1 for the shader. */
  accentRgb: [number, number, number];
  vars: Record<string, string>;
}

export const THEMES: Theme[] = [
  {
    id: "amber",
    label: "amber (default)",
    accentRgb: [0.878, 0.627, 0.376],
    vars: {
      "--bg": "#1a1714",
      "--bg-elev": "#221d18",
      "--bg-titlebar": "#15120f",
      "--fg": "#e8e2d6",
      "--fg-dim": "#8a8275",
      "--fg-faint": "#5a5447",
      "--accent": "#e0a060",
      "--accent-dim": "#a87742",
      "--border": "#2a241e",
      "--border-strong": "#3a3128",
    },
  },
  {
    id: "phosphor",
    label: "phosphor green",
    accentRgb: [0.42, 0.95, 0.55],
    vars: {
      "--bg": "#0c130c",
      "--bg-elev": "#11181160",
      "--bg-titlebar": "#080d08",
      "--fg": "#d8f0d2",
      "--fg-dim": "#7aa478",
      "--fg-faint": "#4a6648",
      "--accent": "#6cf28d",
      "--accent-dim": "#3a9a55",
      "--border": "#1a2418",
      "--border-strong": "#2a3a28",
    },
  },
  {
    id: "midnight",
    label: "midnight cyan",
    accentRgb: [0.42, 0.78, 0.98],
    vars: {
      "--bg": "#0d1218",
      "--bg-elev": "#141b24",
      "--bg-titlebar": "#0a0f14",
      "--fg": "#dbe6ee",
      "--fg-dim": "#7892a4",
      "--fg-faint": "#4a5d6e",
      "--accent": "#6bc7fa",
      "--accent-dim": "#3a7fa8",
      "--border": "#1c2530",
      "--border-strong": "#2c384a",
    },
  },
  {
    id: "synthwave",
    label: "synthwave magenta",
    accentRgb: [0.95, 0.42, 0.85],
    vars: {
      "--bg": "#160d18",
      "--bg-elev": "#1f1424",
      "--bg-titlebar": "#100810",
      "--fg": "#eedbe8",
      "--fg-dim": "#a4789a",
      "--fg-faint": "#6e4a64",
      "--accent": "#f06bd9",
      "--accent-dim": "#a83a8a",
      "--border": "#2a1c30",
      "--border-strong": "#3a2c44",
    },
  },
];

const STORAGE_KEY = "tom.portfolio.theme";

let current = THEMES[0]!;
let onChange: ((t: Theme) => void) | null = null;

export function initTheme(cb: (t: Theme) => void) {
  onChange = cb;
  const saved = (() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  })();
  const t = THEMES.find((x) => x.id === saved) ?? THEMES[0]!;
  applyTheme(t);
}

export function applyTheme(t: Theme) {
  current = t;
  for (const [k, v] of Object.entries(t.vars)) {
    document.documentElement.style.setProperty(k, v);
  }
  try {
    localStorage.setItem(STORAGE_KEY, t.id);
  } catch {}
  onChange?.(t);
}

export function nextTheme(): Theme {
  const i = THEMES.findIndex((t) => t.id === current.id);
  return THEMES[(i + 1) % THEMES.length]!;
}

export function findTheme(id: string): Theme | undefined {
  return THEMES.find((t) => t.id === id);
}

export function currentTheme(): Theme {
  return current;
}
