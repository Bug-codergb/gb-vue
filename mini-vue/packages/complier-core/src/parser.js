import { NO } from "../../shared/src/general.js";
import { Namespaces, createRoot ,NodeTypes,ElementTypes} from "./ast.js";
import { advancePositionWithMutation } from "./utils.js";
function last(xs) {
  return xs[xs.length - 1]
}
export const TextModes= {
  DATA:0, 
  RCDATA:1,   
  RAWTEXT:2, 
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
  isVoidTag:NO,
  isPreTag: NO,
}


export function baseParser(content,options) {
  const context = createParserContext(content, options);
  const start = getCursor(context);
  return createRoot(
    parseChildren(context, TextModes.DATA, []),
    getSelection(context,start)
  );
}
function parseChildren(context, mode, ancestors) {
  console.log(context.source);
  const parent = last(ancestors);
  const ns = parent ? parent.ns : Namespaces.HTML;
  const nodes = [];
  while (!isEnd(context, mode, ancestors)) {
    const s = context.source;
    let node;
    if (mode === TextModes.DATA) {
      console.log(s)
      if (!context.inVPrev && s.startsWith(context.options.delimiters[0])) {
        node = parseInterpolation(context,mode);
      } else if (mode === TextModes.DATA && s[0] === '<') {
        if (s.length === 1) {
          
        } else if (s[1] === "!") {
          
        } else if (s[1] === "/") {
          if (s.length === 2) {
            
          } else if (s[2] === '>') {
            advanceBy(context, 3);
          } else if (/[a-z]/i.test(s[2])) {
            parseTag(context, TagType.End, parent);
            continue;
          }
        } else if (/[a-z]/i.test(s[1])){
          node = parseElement(context,ancestors);
        }
      }
    }
    if (!node) {
      node = parseText(context, mode);
      //console.log(node);
    }
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++){
        //pushNode(nodes, node[i]);
        nodes.push(node[i])
      }
    } else {
      nodes.push(node);
      //pushNode(nodes, node);
    }
  }
  return nodes;
}
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
      // Set `isConstant` to false by default and will decide in transformExpression
      constType: ConstantTypes.NOT_CONSTANT,
      content,
      loc: getSelection(context, innerStart, innerEnd)
    },
    loc: getSelection(context, start)
  }

}
function parseElement(context,ancestors) {
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
  let mode = {}
  console.log(context.source);
  const children = parseChildren(context, mode, ancestors);
  ancestors.pop();

  element.children = children;

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
  const ns = "";
  advanceBy(context, match[0].length);
  advanceSpaces(context);
  const cursor = getCursor(context);
  const currentSource = context.source;
  if (context.options.isPreTag(tag)) {
    context.inPre = true;
  }
  let props = parseAttributes(context, type);

  let isSelfClosing = false;
  advanceBy(context, isSelfClosing ? 2 : 1);
  if (type === TagType.End) {
    return
  }

  let tagType = ElementTypes.ELEMENT  
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
  //处理name
  if (!context.inVPre && /^(v-[A-Za-z0-9-]|:|\.|@|#)/.test(name)) { 
    const match =
      /(?:^v-([a-z0-9-]+))?(?:(?::|^\.|^@|^#)(\[[^\]]+\]|[^\.]+))?(.+)?$/i.exec(
        name
      );
    let isPropShorthand = name.startsWith('.');
    let dirName = match[1] || (isPropShorthand || name.startsWith(':') ? 'bind' : name.startsWidth('@') ? 'on' : 'slot');
    let arg;
    if (match[2]) {
      const isSlot = dirName === 'slot';
      const content = match[2];
      let isStatic = true;
      if (content.startsWith('[')) {
        isStatic = true;

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
        type: '',
        content,
        isStatic,
        constType: '',
        loc:{}
      }
    }
    if (value && value.isQuoted) {
      
    }
    return {
      type: '',
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
      modifiers:[],
      loc:{}
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
    loc:{}
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
    loc:{}
  }
}
function parseTextData(context, length, mode) {

  const rawText = context.source.slice(0, length);
  advanceBy(context, length);
  if (mode === TextModes.RAWTEXT || mode === TextModes.CDATA || !rawText.includes("&")) {
    return rawText;
  } else {
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
        for (let i = ancestors.length - 1; i >= 0; i--){
          if (startsWidthEndTagOpen(s,ancestors[i].tag)) {
            return true;
          }
        }
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
    source.startWidths('</') &&
    source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase());
}
function advanceBy(context,numberOfChar) {
  const { source } = context;
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