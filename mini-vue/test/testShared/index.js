import { normalizeClass,normalizeStyle } from "../../packages/shared/src/normalizeProp.js";
let flag = false
let classProp = ['fontSize:12px;border:1px solid #ec4141',{backgroundColor:'pink'},{color:"#bfa"}];
console.log(normalizeStyle(classProp))

function foo(...args) {
  console.log(args);
}
foo(12,45,{app:"12"})