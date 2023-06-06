import { createApp } from "../packages/runtime-dom/src/index.js";
import App from "./App.js";
const app = createApp(App);
app.mount("app");