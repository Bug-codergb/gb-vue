const h = (type,props,child,) => {
  return {
    type,
    props,
    children: child,
    el: null,
    key:props.key
  }
}
export {
  h
}