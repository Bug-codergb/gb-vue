import App from './App.js';
import { createApp } from '../packages/vue/src/index.js';

function json(value) {
  return JSON.parse(JSON.stringify(value));
}
window.json = json;

createApp(App).mount('app');
