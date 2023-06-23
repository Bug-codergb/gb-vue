import { createApp } from "../packages/runtime-dom/src/index.js";
import App from "./App.js";
/*const app = createApp(App);
app.mount("app");*/

import { complie } from "../packages/complier-dom/src/index.js";
function json(value) {
  return JSON.parse(JSON.stringify(value));
}
window.json = json;

let temp = `
   <ul>
    <li @click="handler(app)">今天是个好日子</li>
   </ul>
`
complie(temp);