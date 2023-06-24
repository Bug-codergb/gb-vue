function json(value) {
  return JSON.parse(JSON.stringify(value));
}
window.json = json;

import App from "./App.js";
import { createApp } from "../packages/runtime-dom/src/index.js";
createApp(App).mount("app");

