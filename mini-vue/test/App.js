import {
  reactive, ref, watch, onBeforeMount, onMounted,
  parseSfc,
} from '../packages/vue/src/index.js';

// import Bar from './Bar.js';

const temp = `
   <ul>
    <li v-for="(item,index,arr) in list" :key="item.id">
      {{item.id}}-{{item.name}}
    </li>
   </ul>
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
    const appProp = 'linalina';
    const flag = true;

    const classProp1 = 'active';
    const classProp2 = 'bar';
    const bgc = 'pink';

    const handlers = () => {
      user.name = user.name === 'app' ? 'web' : 'app';
      user.age++;

      foo.value = foo.value === 'lina' ? 'gb' : 'lina';
    };
    const list = [
      {
        id: 1001,
        name: 'web',
      },
      {
        id: 1002,
        name: 'app',
      },
      {
        id: 1003,
        name: 'tomcat',
      },
      {
        id: 1004,
        name: 'vite',
      },
    ];
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
