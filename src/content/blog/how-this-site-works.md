---
title: How this site works
description: "A quick colophon. The terminal UI, the WebGL background, and why the whole thing is a static site you read inside a fake console."
date: 2026-06-22
tags: ["meta", "astro", "frontend"]
---

You're reading this inside a terminal that isn't a terminal, on a site that pretends to be a CLI. The trick only works if it's done properly, so here's how it's put together.

## The idea

The whole site is shaped like the tool I spend all day in. You type a question, something that looks like a model thinks for a second, calls a tool or two, and streams back an answer. None of it is a language model. Every response is hand-written. The joke is that the assistant is me. I just like the format enough to live in it.

## The stack

It's a static [Astro](https://astro.build) site. Every page is plain HTML, built ahead of time, with nothing from a framework running in the browser. That's what gives the blog real permalinks and keeps the whole thing quick.

The terminal itself is vanilla TypeScript. The prompt, the slash commands, the fake vim, the streaming, it's all plain DOM with no dependencies shipped to your browser. Behind the glass there's a WebGL shader doing some quiet flow noise and a bit of CRT distortion, which picks up while the "model" is thinking.

## The blog is just markdown

This post is a plain markdown file in an Astro content collection. The file name becomes the URL. The body gets rendered into the same console you see everywhere else, same font, same colours, same window. So a post reads like something the terminal printed out, because more or less, it did.

Writing a new one is a single file. No CMS, no config, no fuss.

## Why bother

Most portfolios are a CV with a hero image. I wanted something closer to the actual work. A small, legible system you can poke at, where the medium is part of the point. It was also a good excuse to over-engineer my own corner of the internet, which is its own reward.

Have a look around. Type `/help` for the commands, `/theme` to repaint it, or `/matrix` if you're feeling nostalgic. The source is on [GitHub](https://github.com/tvdavies/personal-site).
