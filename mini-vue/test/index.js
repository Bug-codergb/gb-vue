import { complieToFunction } from "../packages/vue/src/index.js";
function json(value) {
  return JSON.parse(JSON.stringify(value));
}
window.json = json;

let temp = `
   <ul v-bind="{app:appProp}">
    <li @click="handler(app)">今天是个好日子</li>
    <li v-if="app">今天</li>
    <li v-else-if="bar">明天</li>
    <li v-else="foo">后天</li>
    <li :class="{actvie:flag}">{{ app }}{{ foo }}</li>
    <li>
      {{ app }}
      <span>郭斌</span>
      {{ foo }}
    </li>
   </ul>
`
complieToFunction(temp);