import { ElementTypes, NodeTypes } from './ast.js';

const nonIdentifierRE = /^\d|[^\$\w]/;
export const isSimpleIdentifier = (name) => !nonIdentifierRE.test(name);
export function isVSlot(p) {
  return p.type === NodeTypes.DIRECTIVE && p.name === 'slot';
}
export function advancePositionWithMutation(
  pos,
  source,
  numberOfCharacters = source.length,
) {
  let linesCount = 0;
  let lastNewLinePos = -1;
  for (let i = 0; i < numberOfCharacters; i++) {
    if (source.charCodeAt(i) === 10 /* newline char code */) {
      linesCount++;
      lastNewLinePos = i;
    }
  }

  pos.offset += numberOfCharacters;
  pos.line += linesCount;
  pos.column = lastNewLinePos === -1
    ? pos.column + numberOfCharacters
    : numberOfCharacters - lastNewLinePos;

  return pos;
}
export function isText(node) {
  return node.type === NodeTypes.INTERPOLATION || node.type === NodeTypes.TEXT;
}

// 根据名称返回对应的prop
export function findProp(node, name, dynamicOnly, allowEmpty) {
  for (let i = 0; i < node.props.length; i++) {
    const p = node.props[i];
    if (p.type === NodeTypes.ATTRIBUTE) { // 普通attribute
      if (dynamicOnly) continue;
      if (p.name === name && (p.value || allowEmpty)) { // 普通attribute 的值为value对象，value.content为名称
        return p;
      }
    } else if (p.name === 'bind' && (p.exp || allowEmpty) && isStaticArgOf(p.arg, name)) {
      return p;
    }
  }
}
export const isStaticExp = (p) => p.type === NodeTypes.SIMPLE_EXPRESSION && p.isStatic;
export function isStaticArgOf(arg, name) {
  return !!(arg && isStaticExp(arg) && arg.content === name);
}

export function toValidateId(name, type) {
  return `_${type}_${name.replace(/[^\w]/g, (searchValue, replaceValue) => (searchValue === '-' ? '_' : name.charCodeAt(replaceValue).toString()))}`;
}

export function hasDynamicKeyVBind(node) {
  return node.props.some(
    (p) => p.type === NodeTypes.DIRECTIVE
      && p.name === 'bind' && (
      !p.arg || p.arg.type !== NodeTypes.SIMPLE_EXPRESSION || !p.arg.isStatic
    ),
  );
}

const MemberExpLexState = {
  inMemberExp: 0,
  inBrackets: 1,
  inParens: 2,
  inString: 3,
};
const validFirstIdentCharRE = /[A-Za-z_$\xA0-\uFFFF]/;
const validIdentCharRE = /[\.\?\w$\xA0-\uFFFF]/;
const whitespaceRE = /\s+[.[]\s*|\s*[.[]\s+/g;
export const isMemberExpressionBrowser = (path) => {
  path = path.trim().replace(whitespaceRE, (s) => s.trim());

  let state = MemberExpLexState.inMemberExp;
  const stateStack = [];
  let currentOpenBracketCount = 0;
  let currentOpenParensCount = 0;
  let currentStringType = null;

  for (let i = 0; i < path.length; i++) {
    const char = path.charAt(i);
    switch (state) {
      case MemberExpLexState.inMemberExp:
        if (char === '[') {
          stateStack.push(state);
          state = MemberExpLexState.inBrackets;
          currentOpenBracketCount++;
        } else if (char === '(') {
          stateStack.push(state);
          state = MemberExpLexState.inParens;
          currentOpenParensCount++;
        } else if (
          !(i === 0 ? validFirstIdentCharRE : validIdentCharRE).test(char)
        ) {
          return false;
        }
        break;
      case MemberExpLexState.inBrackets:
        if (char === '\'' || char === '"' || char === '`') {
          stateStack.push(state);
          state = MemberExpLexState.inString;
          currentStringType = char;
        } else if (char === '[') {
          currentOpenBracketCount++;
        } else if (char === ']') {
          if (!--currentOpenBracketCount) {
            state = stateStack.pop();
          }
        }
        break;
      case MemberExpLexState.inParens:
        if (char === '\'' || char === '"' || char === '`') {
          stateStack.push(state);
          state = MemberExpLexState.inString;
          currentStringType = char;
        } else if (char === '(') {
          currentOpenParensCount++;
        } else if (char === ')') {
          // if the exp ends as a call then it should not be considered valid
          if (i === path.length - 1) {
            return false;
          }
          if (!--currentOpenParensCount) {
            state = stateStack.pop();
          }
        }
        break;
      case MemberExpLexState.inString:
        if (char === currentStringType) {
          state = stateStack.pop();
          currentStringType = null;
        }
        break;
      default:
    }
  }
  return !currentOpenBracketCount && !currentOpenParensCount;
};
export function isSlotOutlet(node) {
  return node.type === NodeTypes.ELEMENT && node.tagType === ElementTypes.SLOT;
}
export function isTemplateNode(node) {
  return node.type === NodeTypes.ELEMENT && node.tagType === ElementTypes.TEMPLATE;
}
