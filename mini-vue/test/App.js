import {
  reactive, ref, watch, onBeforeMount, onMounted,
  parseSfc,
} from '../packages/vue/src/index.js';

// import Bar from './Bar.js';

const temp = `
  <div class="container" key="91">
    <div class="app">{{foo}}</div>
    <div class="oop">
      <span>123</span>
    </div>
    <div style="color:pink">11-{{appProp}}</div>
    <div v-if="app">
      <span>app</span>
    </div>
    <div v-else>
      <span>else</span>
    </div>
    <button @click="handlers">点击改变顺序</button>
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
    const foo = ref('lina');
    const bar = false;
    const handler = () => {
      console.log('jintianshigehaoriz1');
    };
    const appProp = ref('gblina');
    const flag = true;

    const classProp1 = 'active';
    const classProp2 = 'bar';
    const bgc = 'pink';

    const list = ref(
      [
        {
          id: 1,
          name: 'web',
        },
        {
          id: 2,
          name: 'vite',
        },
        {
          id: 3,
          name: 'app',
        },
        {
          id: 4,
          name: 'tomcat',
        },
        {
          id: 6,
          name: 'rollup',
        },
        {
          id: 5,
          name: 'vite',
        },

      ],
    );
    const handlers = () => {
      list.value = [
        {
          id: 1,
          name: 'web',
        },
        {
          id: 3,
          name: 'app',
        },
        {
          id: 4,
          name: 'tomcat',
        },
        {
          id: 2,
          name: 'vite',
        },
        {
          id: 7,
          name: 'webpack',
        },
        {
          id: 5,
          name: 'vite',
        },
      ];
    };

    const obj = {
      name: '我在查找',
    };
    const proxy = reactive([
      obj,
    ]);

    return {
      list,
      handlers,
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
      proxy,
    };
  },
};

const sfc = `
  <template>
    <div class="container">
      <div v-show="app">{{ app }}</div>
    </div>
  </template>
  <script setup>
    import { ref,reactive } from "vue";
    const app = ref(true);
    const user = reactive({
      name:"web",
      age:18
    })
  </script>
  <style scoped>
    .container{
      color:pink
    }
  </style>
`;
parseSfc(sfc, {});
export default App;
