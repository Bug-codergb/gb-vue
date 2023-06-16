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
    <li v-bind:app="app">
     {{ app }}
    </li>
    <li>
      {{ foo }}
      <span>床前明月光</span>
      {{ bar }}
    </li>
   </ul>
`
complie(temp);