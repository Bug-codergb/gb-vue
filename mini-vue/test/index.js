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
    <li v-bind="{app,bar}"></li>
    <li v-on="{click:clickHandler,mouseup:mouseupHandler}"></li>
    <li :style="{ color:flag ? '#bfa' : 'pink' }"></li>
    <li :class="{active:bar}"></li>
    <li> {{ app }} </li>
   </ul>
`
complie(temp);