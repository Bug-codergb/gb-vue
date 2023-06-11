import { NO } from "../../shared/src/general.js";
import {
  Namespaces, createRoot, NodeTypes, ElementTypes, ConstantTypes
} from "./ast.js";
import { advancePositionWithMutation } from "./utils.js";
function last(xs) {
  return xs[xs.length - 1]
}
export const TextModes= {
  DATA:0, // element component
  RCDATA:1, // textarea ,title  
  RAWTEXT:2, // style,iframe,script,noscript
  CDATA:3,
  ATTRIBUTE_VALUE:4
}
const TagType =  {
  Start:0,
  End:1
}
const decodeRE = /&(gt|lt|amp|apos|quot);/g;
const decodeMap = {
  gt: '>',
  lt: '<',
  amp: '&',
  apos: "'",
  quot:'"'
}

export const defaultParserOptions = {
  delimiters: ["{{", "}}"],
  decodeEntities: (rawText) => {
    return rawText.replace(decodeRE,(_,p1)=>decodeMap[p1])
  },
  isVoidTag:NO, // <img/> <link/>
  isPreTag: NO, // <pre>
  getNamespace: () => Namespaces.HTML,
  getTextMode: () => TextModes.DATA,
}

export function baseParser(content,options) {
  const context = createParserContext(content, options);
  const start = getCursor(context);
  return createRoot(
    parseChildren(context, TextModes.DATA, []),
    getSelection(context,start)
  );
}
//创建编译上下文
function createParserContext(content,rawOptions) {
  const options = Object.assign({}, defaultParserOptions);
  for (let key in rawOptions) {
    options[key] = rawOptions[key] === undefined ? defaultParserOptions[key] : rawOptions[key];
  }
  return {
    options,
    column: 1,
    line: 0,
    offset: 0,
    originalSource: content,
    source: content,
    inPre: false,//是否为pre标签
    inVPrev:false//是否为 v-pre
  }
}
//核心
function parseChildren(context, mode, ancestors) {
  const parent = last(ancestors);
  const ns = parent ? parent.ns : Namespaces.HTML;
  const nodes = [];
  while (!isEnd(context, mode, ancestors)) {
    const s = context.source;
    let node;
    if (mode === TextModes.DATA || mode === TextModes.RCDATA) {
      if (!context.inVPrev && s.startsWith(context.options.delimiters[0])) {

        node = parseInterpolation(context, mode); // 解析大括号语法
        
      } else if (mode === TextModes.DATA && s[0] === '<') {
        if (s.length === 1) {
          console.error('error');
        } else if (s[1] === "!") { //注释以及文档声明暂不实现
          
        } else if (s[1] === "/") {
          if (s.length === 2) {
            console.error("error");
          } else if (s[2] === '>') {
            advanceBy(context, 3);
            continue;
          } else if (/[a-z]/i.test(s[2])) {
            parseTag(context, TagType.End, parent);
            continue;
          } else {
            
          }
        } else if (/[a-z]/i.test(s[1])){
          node = parseElement(context,ancestors);
        }
      }
    }
    if (!node) {
      node = parseText(context, mode);
    }
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++){
        pushNode(nodes, node[i]);
      }
    } else {
      pushNode(nodes, node);
    }
  }
  
  let removedWhitespace = false;
  if (mode!==TextModes.RAWTEXT && mode!== TextModes.RCDATA) {
    const shouldCondense = context.options.whitespace !== 'preserve'; //是否应该压缩
    for (let i = 0; i < nodes.length; i++){
      const node = nodes[i];
      if (node.type === NodeTypes.TEXT) {
        if (!context.inPre) {
          if (!/[^\t\r\n\f ]/.test(node.content)) {
            const prev = nodes[i - 1];
            const next = nodes[i + 1];
            if (!prev || !next ||(
              shouldCondense && (
                (prev.type === NodeTypes.COMMENT && next.type === NodeTypes.COMMENT) ||
                (prev.type === NodeTypes.COMMENT && next.type === NodeTypes.ELEMENT) ||
                (prev.type === NodeTypes.ELEMENT && next.type === NodeTypes.COMMENT) ||
                (prev.type === NodeTypes.ELEMENT && next.type === NodeTypes.ELEMENT && /[\r\n]/.test(node.content))
              )
            )) {
              removedWhitespace = true;
              nodes[i] = null;
            } else {
              node.content = "";
            }  
          } else if (shouldCondense) {
            node.content = node.content.replace(/[\t\r\n\f ]+/g, ' ');
          }
        } else {
          node.content = node.content.reaplce(/\r\n/g,'\n');
        }
      }
      else if (node.type === NodeTypes.COMMENT && !context.options.comments) {
        removedWhitespace = true
        nodes[i] = null 
      }
    }
  }
  return removedWhitespace ? nodes.filter(Boolean) : nodes;
}

function parseInterpolation(context,mode) {
  const [open, close] = context.options.delimiters;
  const closeIndex = context.source.indexOf(close, open.length);
  if (closeIndex === -1) {
    return undefined;
  }
  const start = getCursor(context);

  advanceBy(context, open.length);
  
  const innerStart = getCursor(context);
  const innerEnd = getCursor(context);

  const rawContentLength = closeIndex - open.length;

  const rawContent = context.source.slice(0, rawContentLength);

  const preTrimContent = parseTextData(context, rawContentLength, mode);
  
  const content = preTrimContent.trim();
  const startOffset = preTrimContent.indexOf(content); 
  if (startOffset >0) {
    advancePositionWithMutation(innerStart, rawContent, startOffset);
  }
  const endOffset = rawContentLength - (preTrimContent.length - content.length - startOffset);
  advancePositionWithMutation(innerEnd, rawContent, endOffset);
  advanceBy(context, close.length);
  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      isStatic: false,
      constType: ConstantTypes.NOT_CONSTANT,
      content,
      loc: getSelection(context, innerStart, innerEnd)
    },
    loc: getSelection(context, start)
  }

}
function parseElement(context, ancestors) {
  
  const wasInPre = context.inPre;
  const wasInVPre = context.inVPrev;
  const parent = last(ancestors);
  const element = parseTag(context, TagType.Start, parent);
  const isPreBoundary = context.inPre && !wasInPre;
  const isVPreBoundary = context.inVPre && !wasInVPre;

  if (element.isSelfClosing || context.options.isVoidTag(element.tag)) {
    if (isPreBoundary) {
      context.inPre = false;
    }
    if (isVPreBoundary) {
      context.inVPre = false;
    }
    return element;
  }

  ancestors.push(element);
  let mode = context.options.getTextMode(element, parent);
  const children = parseChildren(context, mode, ancestors);
  ancestors.pop();

  element.children = children;

  if (startsWidthEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End, parent);
  }

  element.loc = getSelection(context, element.loc.start);
  
  if (isPreBoundary) {
    context.inPre = false
  }
  if (isVPreBoundary) {
    context.inVPre = false
  }
  return element
}
function parseTag(context,type,parent) {
  const start = getCursor(context);
  const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source);
  const tag = match[1];
  const ns = ""; // 待修改
  advanceBy(context, match[0].length);
  advanceSpaces(context);
  const cursor = getCursor(context);
  const currentSource = context.source;
  if (context.options.isPreTag(tag)) {
    context.inPre = true;
  }
  let props = parseAttributes(context, type);

  if (type == TagType.Start && !context.inVPre) {
    
  }

  let isSelfClosing = false;

  isSelfClosing = context.source.startsWith('/>');

  advanceBy(context, isSelfClosing ? 2 : 1);
  if (type === TagType.End) {
    return
  }

  let tagType = ElementTypes.ELEMENT  

  if (!context.inVPre) {
    
  }
  return {
    type: NodeTypes.ELEMENT,
    ns,
    tag,
    tagType,
    props,
    isSelfClosing,
    children: [],
    loc: getSelection(context, start),
    codegenNode: undefined // to be created during transform phase
  }
}
function parseAttributes(context,type) {
  const props = [];
  const attributeNames = new Set();
  while (
    context.source.length > 0 && !context.source.startsWith('>') &&
    !context.source.startsWith('/>')) {
    if (context.source.startsWith('/')) {
      advanceBy(context, 1);
      advanceSpaces(context);
      continue;
    }
    const attr = parseAttribute(context, attributeNames);
    
    if (
      attr.type === NodeTypes.ATTRIBUTE &&
      attr.value &&
      attr.name === 'class'
    ) {
      attr.value.content = attr.value.content.replace(/\s+/g, ' ').trim()
    }

    if (type === TagType.Start) {
      props.push(attr)
    }

    if (/^[^\t\r\n\f />]/.test(context.source)) {
      emitError(context, ErrorCodes.MISSING_WHITESPACE_BETWEEN_ATTRIBUTES)
    }
    advanceSpaces(context)
  }
  return props;
}
function parseAttribute(context,nameSet) {
  const start = getCursor(context);
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source);
  const name = match[0];
  if (nameSet.has(name)) {
    console.error("属性已经存在");
  }
  nameSet.add(name);
  advanceBy(context, name.length);
  let value;
  
  //处理value
  if (/^[\t\r\n\f ]*=/.test(context.source)) {
    advanceSpaces(context)
    advanceBy(context, 1)
    advanceSpaces(context)
    value = parseAttributeValue(context)
    if (!value) {
      console.error("error");
    }
  }

  const loc = getSelection(context,start);

  //处理name
  if (!context.inVPre && /^(v-[A-Za-z0-9-]|:|\.|@|#)/.test(name)) { 
    const match =
      /(?:^v-([a-z0-9-]+))?(?:(?::|^\.|^@|^#)(\[[^\]]+\]|[^\.]+))?(.+)?$/i.exec(
        name
      );
    let isPropShorthand = name.startsWith('.');
    let dirName = match[1] || (isPropShorthand || name.startsWith(':') ? 'bind' : name.startsWith('@') ? 'on' : 'slot');
    let arg;
    if (match[2]) {
      const isSlot = dirName === 'slot';
      const content = match[2];
      let isStatic = true;
      if (content.startsWith('[')) {
        isStatic = false;

        if (!content.endsWith(']')) {
          console.error("error");
          content = content.slice(1)
        } else {
          content = content.slice(1, content.length - 1)
        }
      }else if (isSlot) {
        content += match[3] || ''
      }
      arg = {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content,
        isStatic,
        constType: isStatic
        ? ConstantTypes.CAN_STRINGIFY
        : ConstantTypes.NOT_CONSTANT,
        loc
      }
    }
    if (value && value.isQuoted) {
      const valueLoc = value.loc;
      valueLoc.start.offset++;
      valueLoc.start.column++;

    }
    const modifiers = match[3] ? match[3].slice(1).split('.'):[];
    return {
      type: NodeTypes.DIRECTIVE,
      name: dirName,
      exp: value && {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: value.content,
        isStatic: false,
        // Treat as non-constant by default. This can be potentially set to
        // other values by `transformExpression` to make it eligible for hoisting.
        constType: ConstantTypes.NOT_CONSTANT,
        loc: value.loc
      },
      arg,
      modifiers,
      loc
    }
  }
  if (!context.inVPre && name.startsWith('v-')) {
    //emitError(context, ErrorCodes.X_MISSING_DIRECTIVE_NAME)
  }
  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value: value && {
      type: NodeTypes.TEXT,
      content: value.content,
      loc: value.loc
    },
    loc
  }
}
function parseAttributeValue(context) {
  const start = getCursor(context);
  let content;
  const quote = context.source[0];
  const isQuoted = quote === `"` || quote === `'`;
  if (isQuoted) {
    advanceBy(context, 1);
    const endIndex = context.source.indexOf(quote);
    if (endIndex === -1) {
      content = parseTextData(
        context,
        context.source.length,
        TextModes.ATTRIBUTE_VALUE
      )
    } else {
      content = parseTextData(
        context,
        endIndex,
        TextModes.ATTRIBUTE_VALUE
      )
      advanceBy(context, 1);
    }
  }
  return {
    content,
    isQuoted,
    loc:getSelection(context,start)
  }
}
function parseTextData(context, length, mode) {

  const rawText = context.source.slice(0, length);
  advanceBy(context, length);
  if (mode === TextModes.RAWTEXT || mode === TextModes.CDATA || !rawText.includes("&")) {
    return rawText;
  } else {
    //文本节点需要处理特殊字符<,>,
    return context.options.decodeEntities(
      rawText,
      mode === TextModes.ATTRIBUTE_VALUE
    ) 
  }
}
function getCursor(context) {
  const { column, line, offset } = context;
  return {
    column,
    line,
    offset
  }
}
function isEnd(context, mode, ancestors) {
  const s = context.source;
  switch (mode) {
    case TextModes.DATA:
      if (s.startsWith('</')) {
        for (let i = ancestors.length - 1; i >= 0; i--) {
          if (startsWidthEndTagOpen(s, ancestors[i].tag)) {
            return true;
          }
        }
      }
      break;
    case TextModes.RCDATA:
    case TextModes.RAWTEXT: {
      const parent = last(ancestors);
      if (parent && startsWidthEndTagOpen(s, parent.tag)) {
        return true;
      }
      break; 
    }
  }
  return !s;
}
//存储当前位置信息
function getSelection(context,start,end) {
  end = end || getCursor(context);
  return {
    start,
    end,
    source:context.originalSource.slice(start.offset,end.offset)
  }
}
function startsWidthEndTagOpen(source,tag) {
  return (
    source.startsWith('</') &&
    source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase() &&
    /[\t\r\n\f />]/.test(source[2+tag.length] || '>'));
}
function advanceBy(context,numberOfChar) {
  const { source } = context;
  advancePositionWithMutation(context, source, numberOfChar);
  context.source = source.slice(numberOfChar);
}
function advanceSpaces(context) {
  const match = /^[\t\r\n\f ]+/.exec(context.source)
  if (match) {
    advanceBy(context, match[0].length)
  }
}
function pushNode(nodes, node) {
  if (node.type === NodeTypes.TEXT) {
    const prev = last(nodes)
    // Merge if both this and the previous node are text and those are
    // consecutive. This happens for cases like "a < b".
    if (
      prev &&
      prev.type === NodeTypes.TEXT &&
      prev.loc.end.offset === node.loc.start.offset
    ) {
      prev.content += node.content
      prev.loc.end = node.loc.end
      prev.loc.source += node.loc.source
      return
    }
  }

  nodes.push(node)
}

function parseText(context, mode) {
  
  const endTokens =
    mode === TextModes.CDATA ? [']]>'] : ['<', context.options.delimiters[0]]
  //如果是element则文本节点的结束应该是<或者是{{
  let endIndex = context.source.length
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i], 1)
    if (index !== -1 && endIndex > index) {
      endIndex = index
    }
  }


  const start = getCursor(context)
  const content = parseTextData(context, endIndex, mode)

  return {
    type: NodeTypes.TEXT,
    content,
    loc: getSelection(context, start)
  }
}