/**
 * Tiny streaming-safe markdown renderer.
 *
 * We re-render the full buffer on each token. It's cheap enough at our scale
 * and means we don't need to handle "partial" markdown specially — the
 * whole buffer is parsed each time and we replace the rendered HTML.
 *
 * Supported: headings (#, ##, ###), bold (**x**), italic (_x_ / *x*),
 * inline code (`x`), code blocks (```), links ([t](u)), lists (-, 1.),
 * horizontal rule (---), paragraphs, line breaks.
 */

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const escapeAttr = (s: string) => escapeHtml(s).replace(/"/g, "&quot;");

const inline = (s: string) => {
  let out = escapeHtml(s);
  // inline code first to protect content
  const codes: string[] = [];
  out = out.replace(/`([^`\n]+)`/g, (_, c) => {
    codes.push(c);
    return `\u0000${codes.length - 1}\u0000`;
  });
  // links [text](url). Allow only safe schemes — refuse javascript:/data:/etc
  // (markdown can be reached from untrusted input via ?q=), and escape the URL
  // into the attribute. External (http) links open in a new tab; internal
  // links (/blog/…, #…, mailto:) navigate in place.
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => {
    const safe = /^(https?:|mailto:)/i.test(u) || /^[/#]/.test(u);
    if (!safe) return m; // leave the literal text; never emit an unsafe href
    const external = /^https?:\/\//i.test(u);
    const attrs = external ? ` target="_blank" rel="noopener noreferrer"` : "";
    return `<a href="${escapeAttr(u)}"${attrs}>${t}</a>`;
  });
  // bold
  out = out.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  // italic (underscore or single star, avoid touching ** which is gone)
  out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  out = out.replace(/(^|\W)_([^_\n]+)_/g, "$1<em>$2</em>");
  // restore inline code
  out = out.replace(
    /\u0000(\d+)\u0000/g,
    (_, i) => `<code>${escapeHtml(codes[Number(i)] ?? "")}</code>`,
  );
  return out;
};

export function renderMarkdown(src: string): string {
  const lines = src.split("\n");
  const out: string[] = [];
  let i = 0;

  let listType: "ul" | "ol" | null = null;
  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };

  let para: string[] = [];
  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${inline(para.join(" "))}</p>`);
      para = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i]!;

    // fenced code
    if (/^```/.test(line)) {
      flushPara();
      closeList();
      const lang = line.slice(3).trim();
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i]!)) {
        code.push(lines[i]!);
        i++;
      }
      i++;
      out.push(
        `<pre><code${lang ? ` data-lang="${escapeHtml(lang)}"` : ""}>${escapeHtml(
          code.join("\n"),
        )}</code></pre>`,
      );
      continue;
    }

    // hr
    if (/^---+\s*$/.test(line)) {
      flushPara();
      closeList();
      out.push("<hr>");
      i++;
      continue;
    }

    // headings
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      flushPara();
      closeList();
      const level = h[1]!.length;
      out.push(`<h${level}>${inline(h[2]!)}</h${level}>`);
      i++;
      continue;
    }

    // unordered list
    const ul = /^[-*]\s+(.*)$/.exec(line);
    if (ul) {
      flushPara();
      if (listType !== "ul") {
        closeList();
        out.push("<ul>");
        listType = "ul";
      }
      out.push(`<li>${inline(ul[1]!)}</li>`);
      i++;
      continue;
    }

    // ordered list
    const ol = /^\d+\.\s+(.*)$/.exec(line);
    if (ol) {
      flushPara();
      if (listType !== "ol") {
        closeList();
        out.push("<ol>");
        listType = "ol";
      }
      out.push(`<li>${inline(ol[1]!)}</li>`);
      i++;
      continue;
    }

    // blank
    if (line.trim() === "") {
      flushPara();
      closeList();
      i++;
      continue;
    }

    // paragraph accumulation
    para.push(line);
    i++;
  }

  flushPara();
  closeList();
  return out.join("\n");
}
