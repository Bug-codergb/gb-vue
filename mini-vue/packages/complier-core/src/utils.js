import { NodeTypes } from "./ast.js";
const nonIdentifierRE = /^\d|[^\$\w]/
export const isSimpleIdentifier = (name) =>
  !nonIdentifierRE.test(name)

export function advancePositionWithMutation(
  pos,
  source,
  numberOfCharacters = source.length
){
  let linesCount = 0
  let lastNewLinePos = -1
  for (let i = 0; i < numberOfCharacters; i++) {
    if (source.charCodeAt(i) === 10 /* newline char code */) {
      linesCount++
      lastNewLinePos = i
    }
  }

  pos.offset += numberOfCharacters
  pos.line += linesCount
  pos.column =
    lastNewLinePos === -1
      ? pos.column + numberOfCharacters
      : numberOfCharacters - lastNewLinePos

  return pos
}
export function isText(node) {
  return node.type === NodeTypes.INTERPOLATION || node.type === NodeTypes.TEXT;
}

// 根据名称返回对应的prop
export function findProp(node,name,dynamicOnly,allowEmpty) {
  for (let i = 0; i < node.props.length; i++){
    const p = node.props[i];
    if (p.type === NodeTypes.ATTRIBUTE) { // 普通attribute
      if (dynamicOnly) continue;
      if (p.name === name && (p.value || allowEmpty)) { // 普通attribute 的值为value对象，value.content为名称
        return p;
      }
    } else if (p.name === 'bind' && (p.exp || allowEmpty) && isStaticArgOf(p.arg,name)) {
      return p;
    }
  }
}
export const isStaticExp = (p) => {
  return p.type === NodeTypes.SIMPLE_EXPRESSION && p.isStatic;
}
export function isStaticArgOf(arg,name) {
  return !!(arg && isStaticExp(arg) && arg.content === name);
}

export function toValidateId(name,type) {
  return `_${type}_${name.replace(/[^\w]/g, (searchValue, replaceValue) => {
    return searchValue === '-' ? '_' : name.charCodeAt(replaceValue).toString()
  })}`
}

export function hasDynamicKeyVBind(node) {
  return node.props.some(
    p => p.type === NodeTypes.DIRECTIVE &&
      p.name === 'bind' && (
      !p.arg || p.arg.type !== NodeTypes.SIMPLE_EXPRESSION || !p.arg.isStatic
      )
  )
}