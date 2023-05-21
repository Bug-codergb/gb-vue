const createVode = (type,props,children) => {
  return {
    el: null,
    type,
    props,
    children,
    key: props?.key,
    component:null
  }
}
export {
  createVode
}