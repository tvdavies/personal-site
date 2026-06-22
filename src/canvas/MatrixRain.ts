/**
 * Matrix-style katakana rain, drawn into a transient 2D canvas that mounts
 * itself, runs for `duration` ms with a fade-in / fade-out, then removes
 * itself. Sits *above* the WebGL bg but *below* the terminal so it reads
 * through the terminal's translucent panel without blocking interaction.
 */

const GLYPHS =
  "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789<>#$%&*+";

export function runMatrixRain(durationMs = 6000) {
  // singleton: replace any in-flight rain
  document.querySelectorAll(".matrix-overlay").forEach((n) => n.remove());

  const canvas = document.createElement("canvas");
  canvas.className = "matrix-overlay";
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "0",
    opacity: "0",
    transition: "opacity 280ms ease",
    mixBlendMode: "screen",
  } as CSSStyleDeclaration);
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }

  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0;
  let h = 0;
  let cols = 0;
  let drops: number[] = [];
  const fontSize = 16;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(w / fontSize);
    drops = new Array(cols)
      .fill(0)
      .map(() => -Math.random() * h * 0.5);
  };
  resize();
  window.addEventListener("resize", resize);

  // fade in
  requestAnimationFrame(() => {
    canvas.style.opacity = "0.85";
  });

  const start = performance.now();

  const tick = () => {
    const elapsed = performance.now() - start;

    // start fading out 600ms before end
    if (elapsed > durationMs - 600 && canvas.style.opacity !== "0") {
      canvas.style.opacity = "0";
    }

    if (elapsed > durationMs) {
      window.removeEventListener("resize", resize);
      canvas.remove();
      return;
    }

    // trail
    ctx.fillStyle = "rgba(8, 12, 8, 0.10)";
    ctx.fillRect(0, 0, w, h);

    ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
    ctx.textBaseline = "top";

    for (let i = 0; i < cols; i++) {
      const ch = GLYPHS[(Math.random() * GLYPHS.length) | 0];
      const x = i * fontSize;
      const y = drops[i]!;
      // bright head
      ctx.fillStyle = "#cdfacd";
      ctx.fillText(ch ?? "0", x, y);
      // body
      ctx.fillStyle = "rgba(72, 200, 96, 0.85)";
      ctx.fillText(ch ?? "0", x, y - fontSize);

      drops[i] = y + fontSize * (0.6 + Math.random() * 0.6);
      if (drops[i]! > h && Math.random() > 0.975) {
        drops[i] = -fontSize * 4;
      }
    }

    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
