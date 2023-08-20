function render(proxy) {
  console.log(proxy.user);
  with (proxy) {
    console.log(user.name);
  }
}
let demo = {
  _: {
    user: {
      name:"app"
    }
  }
}
let proxy = new Proxy(demo, {
  get({_:target}, key, receiver) {
    return target[key];
  },
  set() {
    
  }
})

render.call(proxy,proxy);