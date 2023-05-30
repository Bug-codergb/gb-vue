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
export const isString = (value) => {
  return typeof value === "string";
}
export const isIntegerKey = (key) => {
  return isString(key) && key !== NaN && '' + parseInt(key, 10) === key;
}