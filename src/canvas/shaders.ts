/**
 * GLSL for the background scene.
 *
 * Vertex: trivial fullscreen triangle.
 * Fragment: a layered effect:
 *   - domain-warped fbm noise (slow drift, "flow field" feel)
 *   - amber-on-near-black palette
 *   - mouse ripple (gravitational lens-ish warp on the noise UVs)
 *   - barrel distortion + chromatic aberration (CRT lens)
 *   - scanlines + slot-mask
 *   - vignette
 *   - blue-noise grain
 *
 * Uniforms:
 *   uTime         seconds since boot
 *   uResolution   px (logical, not device)
 *   uMouse        px (logical)
 *   uMouseEnergy  0..1 ripple energy, decays over time
 *   uBusy         0..1 eased "is the assistant thinking" signal
 */

export const VERT = /* glsl */ `#version 300 es
precision highp float;
out vec2 vUv;
void main() {
  // fullscreen triangle
  vec2 p = vec2((gl_VertexID == 1) ? 3.0 : -1.0,
                (gl_VertexID == 2) ? 3.0 : -1.0);
  vUv = (p + 1.0) * 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}
`;

export const FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;

uniform float uTime;
uniform vec2  uResolution;
uniform vec2  uMouse;
uniform float uMouseEnergy;
uniform float uBusy;
uniform float uGlitch;   // 0..1 burst, decays
uniform float uPulse;    // 0..1 short pulse
uniform vec3  uAccent;   // theme accent (linear-ish RGB)

// ── palette ──────────────────────────────────────────────────────
const vec3 BG   = vec3(0.102, 0.090, 0.078); // #1a1714
const vec3 DEEP = vec3(0.055, 0.043, 0.031);
#define AMBER uAccent

// ── hash / noise ─────────────────────────────────────────────────
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    v += a * vnoise(p);
    p = r * p * 2.0 + vec2(11.3, 7.7);
    a *= 0.5;
  }
  return v;
}

// domain-warped fbm — gives a fluid / flow-field feel
float flow(vec2 p, float t) {
  vec2 q = vec2(fbm(p + t * 0.05), fbm(p + vec2(5.2, 1.3) - t * 0.04));
  vec2 r = vec2(
    fbm(p + 1.6 * q + vec2(1.7, 9.2) + t * 0.07),
    fbm(p + 1.6 * q + vec2(8.3, 2.8) - t * 0.06)
  );
  return fbm(p + 1.8 * r);
}

// ── helpers ──────────────────────────────────────────────────────
vec2 barrel(vec2 uv, float k) {
  vec2 c = uv - 0.5;
  float r2 = dot(c, c);
  return uv + c * r2 * k;
}

float scanlines(vec2 fragPx) {
  return 0.92 + 0.08 * sin(fragPx.y * 3.14159);
}

float slotMask(vec2 fragPx) {
  float m = 0.85 + 0.15 * sin(fragPx.x * 3.14159 * 0.5);
  return m;
}

float vignette(vec2 uv) {
  vec2 c = uv - 0.5;
  return smoothstep(0.95, 0.25, dot(c, c) * 1.4);
}

void main() {
  vec2 res = uResolution;
  float aspect = res.x / max(res.y, 1.0);

  // CRT barrel distortion (subtle), amplified during glitch
  vec2 uv = barrel(vUv, 0.04 + uGlitch * 0.08);

  // glitch: horizontal block displacement on a few bands
  if (uGlitch > 0.001) {
    float band = floor(uv.y * 24.0 + uTime * 6.0);
    float r = hash21(vec2(band, floor(uTime * 18.0)));
    if (r > 0.78) {
      uv.x += (r - 0.5) * 0.18 * uGlitch;
    }
    // vertical jitter
    uv.y += (hash21(vec2(floor(uTime * 30.0), 1.0)) - 0.5) * 0.01 * uGlitch;
  }

  // mouse ripple in UV space (warps the noise lookup, not the geometry)
  vec2 mouseUv = uMouse / res;
  vec2 toMouse = vec2((uv.x - mouseUv.x) * aspect, uv.y - mouseUv.y);
  float dM = length(toMouse);
  float ripple =
    sin(dM * 28.0 - uTime * 4.0) *
    exp(-dM * 5.0) *
    uMouseEnergy * 0.015;
  vec2 nuv = uv + normalize(toMouse + 1e-6) * ripple;

  // sample flow noise at three slightly offset positions for chromatic split
  float t = uTime * (0.35 + uBusy * 0.9);
  vec2 p = vec2(nuv.x * aspect, nuv.y) * 2.6;

  float ca = 0.0035 + uBusy * 0.004 + uGlitch * 0.03;
  float nR = flow(p + vec2( ca, 0.0), t);
  float nG = flow(p,                    t);
  float nB = flow(p - vec2( ca, 0.0), t + 0.6);

  // shape the noise: lift midtones, make it feel like slow fluid
  vec3 n = vec3(nR, nG, nB);
  n = smoothstep(0.25, 0.85, n);

  // base gradient: deep at edges, slight lift toward centre
  vec3 base = mix(DEEP, BG, vignette(uv));

  // amber glow modulated by noise — the personality
  float energy = 0.18 + 0.55 * uBusy + 0.5 * uPulse + 0.4 * uGlitch;
  vec3 glow = AMBER * n * energy;

  // colour comp: base + amber glow, then a faint chromatic split
  vec3 col = base + glow;
  // bias channels using the per-channel noise samples for a soft RGB shift
  col.r += (nR - nG) * 0.04;
  col.b += (nB - nG) * 0.05;

  // mouse hot-spot — subtle amber bloom near cursor
  col += AMBER * exp(-dM * 4.0) * uMouseEnergy * 0.18;

  // CRT scanlines + slot-mask in screen pixels
  vec2 fragPx = vUv * res;
  col *= scanlines(fragPx);
  col *= slotMask(fragPx);

  // vignette
  col *= vignette(uv);

  // grain
  float g = hash21(fragPx + uTime * 60.0) - 0.5;
  col += g * 0.018;

  // gentle filmic-ish toe so blacks stay warm not crushed
  col = max(col, vec3(0.0));
  col = col / (col + vec3(0.9)) * 1.05;

  outColor = vec4(col, 1.0);
}
`;
