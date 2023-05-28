export const isReservedProps = (key) => {
  let map = new Map([
    ['key', true],
    ['ref',true]
  ])
  return !!map.get(key);
}
export const hasChanged = (newValue,oldValue) => {
  return !Object.is(newValue, oldValue);
}