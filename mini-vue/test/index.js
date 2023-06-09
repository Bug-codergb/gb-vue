import { createApp } from "../packages/runtime-dom/src/index.js";
import App from "./App.js";
/*const app = createApp(App);
app.mount("app");*/

import { complie } from "../packages/complier-dom/src/index.js";

let temp = `<div class="app" style="backgroundColor:'#bfa'">
              <p>今天天气真不错</p>
              <span @click='handler'>
                {{
                  app
                }}
              </span>
              <ul>
                <li v-bind:class="{ active:true }"></li>
              </ul>
            </div>`
complie(temp);