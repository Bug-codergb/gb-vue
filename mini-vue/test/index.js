import { createApp } from "../packages/runtime-dom/src/index.js";
import App from "./App.js";
/*const app = createApp(App);
app.mount("app");*/

import { complie } from "../packages/complier-dom/src/index.js";

let temp = `
  <div class="app" style="backgroundColor:'#bfa'">
    <p :style="{color:active === true? 'red':'pink'}">今天天气真不错</p>
    <span @click.stop='handler'>
        {{
          app
        }}
    </span>
    <ul>
        <li v-bind:class="{ active:true }"></li>
    </ul>
  </div>
`
complie(temp);