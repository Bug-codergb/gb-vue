import { createApp } from "../packages/runtime-dom/src/index.js";
import App from "./App.js";
/*const app = createApp(App);
app.mount("app");*/

import { complie } from "../packages/complier-dom/src/index.js";

let temp = `
   <ul>
    <li v-if="app"></li>
     <li v-if="foo">
       <span>123</span>
       <span>456</span>
       <span>789</span>
     </li>
     <li v-else-if="memo">
      <span>111</span>
      <span>222</span>
      <span>333</span>
      <div v-if="aaa">
        <p>窗前明月光</p>
      </div>
      <div v-else-if="bbb">
        <p>疑似地上霜</p>
      </div>
      <div v-else>
        <p>举头望明月</p>
      </div>
     </li>
     <li v-else>
      <span>444</span>
      <span>555</span>
      <span>666</span>
     </li>
   </ul>
`
complie(temp);