import index from "./index.html";

const server = Bun.serve({
  port: Number(process.env.PORT ?? 3000),
  hostname: process.env.HOST ?? "0.0.0.0",
  routes: {
    "/": index,
  },
  development: {
    hmr: true,
    console: true,
  },
  fetch() {
    return new Response("Not found", { status: 404 });
  },
});

console.log(
  `▸ tom@portfolio listening on http://${server.hostname}:${server.port}`,
);
