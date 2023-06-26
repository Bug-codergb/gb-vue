import { reactive, ref } from "../packages/reactivity/index.js";
import { complieToFunction} from "../packages/vue/src/index.js";
let temp = `
   <ul class="container" style="color:pink" :class="{actvie:bar}" v-bind="{style:{color:'pink'}}">
    <li @click="handler(app)">今天是个好日子</li>
    <li v-if="app">今天</li>
    <li v-else-if="bar">明天</li>
    <li v-else="foo">后天</li>
    <li :class="{actvie:flag}">{{ app }}----{{ foo }}</li>
    <li>
      {{ app }}
      <span>郭斌</span>
      {{ foo }}
    </li>
   </ul>
`
const App = {
  template:temp,
  setup() {
    const user = reactive({
      name: "app",
      age:18,
    })
    
    const app = true;
    const foo = "lina";
    const bar = false;
    const handler = () => {
      console.log("jintianshigehaoriz1")
    }
    const appProp = "linalina"
    const flag = true;
    return {
      user,
      app,
      foo,
      handler,
      bar,
      appProp,
      flag
    }
  }
}
export default App;