/**
 * Background WebGL scene.
 *
 * Renders a single fullscreen fragment shader (see ./shaders.ts) that
 * does the heavy lifting: domain-warped flow noise, CRT distortion,
 * scanlines, chromatic aberration, vignette, grain, and a mouse ripple.
 *
 * Exposed control:
 *   setBusy(busy: boolean) — eased transition into/out of the
 *   "thinking" state, which energises the shader.
 */

import { FRAG, VERT } from "./shaders";

export type EffectName = "glitch" | "pulse";

export interface SceneHandle {
  setBusy(busy: boolean): void;
  triggerEffect(name: EffectName, ms?: number): void;
  /** rgb in 0..1; the shader's amber accent. */
  setAccent(rgb: [number, number, number]): void;
  dispose(): void;
}

export function initScene(canvas: HTMLCanvasElement): SceneHandle {
  const gl = canvas.getContext("webgl2", {
    antialias: false,
    premultipliedAlpha: false,
    powerPreference: "high-performance",
  });

  if (!gl) {
    console.warn("WebGL2 not available — falling back to flat background.");
    canvas.style.background = "#1a1714";
    return {
      setBusy: () => {},
      triggerEffect: () => {},
      setAccent: () => {},
      dispose: () => {},
    };
  }

  // ── compile + link ──────────────────────────────────────────────
  const program = link(gl, compile(gl, gl.VERTEX_SHADER, VERT), compile(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.useProgram(program);

  // VAO with no attributes; vertex shader uses gl_VertexID.
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const u = {
    time: gl.getUniformLocation(program, "uTime"),
    res: gl.getUniformLocation(program, "uResolution"),
    mouse: gl.getUniformLocation(program, "uMouse"),
    energy: gl.getUniformLocation(program, "uMouseEnergy"),
    busy: gl.getUniformLocation(program, "uBusy"),
    glitch: gl.getUniformLocation(program, "uGlitch"),
    pulse: gl.getUniformLocation(program, "uPulse"),
    accent: gl.getUniformLocation(program, "uAccent"),
  };

  let accent: [number, number, number] = [0.878, 0.627, 0.376]; // amber

  // ── state ───────────────────────────────────────────────────────
  let dpr = clamp(window.devicePixelRatio || 1, 1, 2);
  let cssW = 0;
  let cssH = 0;

  const mouse = { x: 0, y: 0, energy: 0 };
  let busyTarget = 0;
  let busyEased = 0;

  // ── effects: each has an end-time; uniform value computed from remaining time
  const effects = {
    glitch: { until: 0, duration: 0 },
    pulse: { until: 0, duration: 0 },
  };
  const effectValue = (e: { until: number; duration: number }, now: number) => {
    if (now >= e.until || e.duration === 0) return 0;
    return Math.max(0, Math.min(1, (e.until - now) / e.duration));
  };

  const resize = () => {
    dpr = clamp(window.devicePixelRatio || 1, 1, 2);
    cssW = canvas.clientWidth || window.innerWidth;
    cssH = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();
  window.addEventListener("resize", resize);

  // mouse — listen on window so it tracks even over the terminal HTML
  const onMove = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) * dpr;
    mouse.y = (rect.height - (e.clientY - rect.top)) * dpr; // flip Y for GL
    mouse.energy = Math.min(1, mouse.energy + 0.18);
  };
  const onLeave = () => {
    // keep last position, just stop pumping energy
  };
  window.addEventListener("mousemove", onMove, { passive: true });
  window.addEventListener("mouseleave", onLeave, { passive: true });

  // click = ripple kick
  const onClick = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) * dpr;
    mouse.y = (rect.height - (e.clientY - rect.top)) * dpr;
    mouse.energy = 1;
  };
  window.addEventListener("click", onClick, { passive: true });

  // ── render loop ─────────────────────────────────────────────────
  const start = performance.now();
  let raf = 0;
  let last = start;

  const tick = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    // ease busy → smooth ramp
    busyEased += (busyTarget - busyEased) * Math.min(1, dt * 4);
    // mouse energy decays
    mouse.energy *= Math.exp(-dt * 1.6);

    gl.useProgram(program);
    gl.uniform1f(u.time, (now - start) / 1000);
    gl.uniform2f(u.res, canvas.width, canvas.height);
    gl.uniform2f(u.mouse, mouse.x, mouse.y);
    gl.uniform1f(u.energy, mouse.energy);
    gl.uniform1f(u.busy, busyEased);
    gl.uniform1f(u.glitch, effectValue(effects.glitch, now));
    gl.uniform1f(u.pulse, effectValue(effects.pulse, now));
    gl.uniform3f(u.accent, accent[0], accent[1], accent[2]);

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  // pause when tab is hidden
  const onVis = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
    } else {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
  };
  document.addEventListener("visibilitychange", onVis);

  return {
    setBusy(busy: boolean) {
      busyTarget = busy ? 1 : 0;
    },
    triggerEffect(name, ms = 1500) {
      const now = performance.now();
      effects[name] = { until: now + ms, duration: ms };
    },
    setAccent(rgb) {
      accent = rgb;
    },
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("click", onClick);
      document.removeEventListener("visibilitychange", onVis);
      gl.deleteProgram(program);
      gl.deleteVertexArray(vao);
    },
  };
}

// ── gl helpers ───────────────────────────────────────────────────

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) throw new Error("createShader failed");
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh) ?? "(no log)";
    gl.deleteShader(sh);
    throw new Error(`shader compile failed: ${log}`);
  }
  return sh;
}

function link(
  gl: WebGL2RenderingContext,
  vs: WebGLShader,
  fs: WebGLShader,
): WebGLProgram {
  const p = gl.createProgram();
  if (!p) throw new Error("createProgram failed");
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(p) ?? "(no log)";
    throw new Error(`program link failed: ${log}`);
  }
  return p;
}

function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, x));
}
