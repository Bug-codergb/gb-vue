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
    <li v-bind="{app,bar,app}" v-on="{click:clickHandler}"></li>
    <li v-on="{click:clickHandler,mouseup:mouseupHandler}"></li>
    <li :style="{ color:flag ? '#bfa' : 'pink' }"></li>
    <li :class="{active:bar}"></li>
    <li> {{ app }} </li>
    <li style="width:100px,backgroundColor:#bfa"  :class="{active:inner}">123</li>
   </ul>
`
complie(temp);