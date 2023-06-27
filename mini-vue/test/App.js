import { reactive, ref } from "../packages/vue/src/index.js";
import { complieToFunction} from "../packages/vue/src/index.js";
let temp = `
   <ul class="container" style="color:#bfa" :class="[{classProp1:flag},{classProps2:flag}]">
    今天是个好日子
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

    const classProp1 = "active";
    const classProp2 = "bar";
    return {
      user,
      app,
      foo,
      handler,
      bar,
      appProp,
      flag,
      classProp1,
      classProp2
    }
  }
}
export default App;