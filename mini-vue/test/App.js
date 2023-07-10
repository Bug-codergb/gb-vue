import { reactive, ref, complieToFunction } from '../packages/vue/src/index.js';

const temp = `
   <div @click="handler" :class="{foo:app}">
    <div v-if="app">{{app}}</div>
    <div v-else>appProp</div>
    <div :style="{color:bgc}">我是真的</div>
    <div>
      <span>锄禾日当午</span>
      <span>{{ appProp }}</span>
    </div>
   </div>
`;
const App = {
  template: temp,
  props: {
    app: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const user = reactive({
      name: 'app',
      age: 18,
    });

    const app = ref(true);
    const foo = 'lina';
    const bar = false;
    const handler = () => {
      console.log('jintianshigehaoriz1');
    };
    const appProp = 'linalina';
    const flag = true;

    const classProp1 = 'active';
    const classProp2 = 'bar';
    const bgc = 'pink';
    return {
      user,
      app,
      foo,
      handler,
      bar,
      appProp,
      flag,
      classProp1,
      classProp2,
      bgc,
    };
  },
};
export default App;
