/**
 * Single client entry, included once by the Terminal layout. Dispatches on the
 * `data-page` flag the layout writes onto <body>: the home page gets the full
 * interactive REPL; every other page gets the shared chrome + lite prompt.
 */
import { initChrome } from "./chrome";
import { initHome } from "./home";

export function boot() {
  if (document.body.dataset.page === "home") {
    initHome();
  } else {
    initChrome({ interactive: false });
  }
}
