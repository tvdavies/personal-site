---
title: How this site works
description: "A colophon — the terminal UI, the WebGL background, and why the whole thing is a static site you read inside a fake console."
date: 2026-06-22
tags: ["meta", "astro", "frontend"]
---

You're reading this inside a terminal that isn't a terminal, on a site that
pretends to be a CLI agent. Since the conceit only works if it's done well,
here's how the trick is put together — a colophon for people who like to know.

## The premise

The whole site is shaped like the tool I spend all day in. You type a question,
something that looks like a model "thinks", calls a tool or two, and streams back
an answer. None of it is a language model. **Every response is hand-written** —
the joke is that the assistant is me. I just liked the format enough to live in
it.

## The stack

- **[Astro](https://astro.build) for the bones.** Each page is static HTML,
  generated at build time, with no client framework. That's what gives blog
  posts real permalinks and makes the whole thing fast and crawlable.
- **Vanilla TypeScript for the terminal.** The REPL, the slash-command menu, the
  fake `vim`, the streaming renderer — all plain DOM, no React. The client ships
  with **zero runtime dependencies**.
- **A WebGL fragment shader for the background.** Domain-warped flow noise with a
  little CRT distortion, scanlines, and a ripple that follows your cursor. It
  quietly energises while the "model" is thinking.
- **A tiny markdown renderer** that fakes token-by-token streaming, so answers
  arrive the way they do in a real chat — with believable jitter and pauses on
  sentence breaks.

## The blog is just markdown

This post is a plain `.md` file in an Astro
[content collection](https://docs.astro.build/en/guides/content-collections/).
The file name becomes the permalink. Frontmatter carries the title, date, and
description; the body is rendered into the same console chrome you see
everywhere else — same fonts, same palette, same window. So a post reads like
something the terminal `cat`-ed out, because in spirit, it did.

```
~ ❯ cat ~/blog/how-this-site-works.md
```

Writing a new post is one file. No build config, no CMS, no ceremony.

## Why bother

Most portfolios are a résumé with a hero image. I wanted something that *was*
the work — a small, legible system with tight feedback loops, where the medium
is the message. It's also a good excuse to over-engineer my own corner of the
internet, which is its own reward.

Poke around: type `/help` for the commands, `/theme` to repaint everything,
or `/matrix` if you're feeling nostalgic. The source is on
[GitHub](https://github.com/tvdavies).
