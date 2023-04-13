let shouldTrack = false;
let activeEffect = void 0;
class ReactiveEffect{
  constructor(fn) {
    this.fn = fn;
    this.active = true;
    this.deps = [];
    this.scheduler = undefined;
  }
  run() {
    //执行fn但是不收集依赖
    if (!this.active) {
      return this.fn(); 
    }
    
    //收集依赖(执行用户传入的fn)
    shouldTrack = true;
    activeEffect = this;

    const result = this.fn();

    shouldTrack.false;
    activeEffect = undefined;
    return result;
  }
  stop() {
    
  }
}