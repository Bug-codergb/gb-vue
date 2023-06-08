import { NO } from "../../shared/src/general.js";
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

export const defaultParserOptions = {
  delimiters: ["{{", "}}"],
  isVoidTag:NO,
  isPreTag: NO,
}
export function baseParser(content,options) {
  const context = createParserContext(content, options);
  const start = getCursor(context);
  return;
}
function parseChildren(context,mode,ancestors) {
  const parent = last(ancestors);
  const ns = parent ? parent.ns : '';
  const nodes = [];
  while (!isEnd(context,mode,ancestors)) {
    const s = context.source;
    let node;
    if (mode === TextModes.DATA) {
      if (!context.inVPrev && s.startsWidth(conext.options.delimiters[0])) {
        
      } else if (mode === TextModes.DATA && s[0] === '<') {
        if (s.length === 1) {
          
        } else if (s[1] === "!") {
          
        } else if (s[1] === "/") {
          
        } else if (/[a-z]/i.text()){
          node = parseElement(context,ancestors);
        }
      }
    }
    if (!node) {
      
    }
  }
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
    inPre: false,//未知
    inVPrev:false//未知
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
  advancBy(context, match[0].length);
  advanceSpaces(context);
  const cursor = getCursor(context);
  const currentSource = context.source;
  if (context.options.isPreTag(tag)) {
    context.inPre = true;
  }
  let props = parseAttributes(context, type);
}
function parseAttributes(context,type) {
  const props = [];
  const attributeNames = new Set();
  while (
    context.source.length > 0 && !context.source.startsWidth('>') &&
    !context.source.startsWidth('/>')) {
    if (context.source.startsWidth('/')) {
      advancBy(context, 1);
      advanceSpaces(context);
      continue;
    }
    const attr = parseAttribute(context,attributeNames);
  }
}
function parseAttribute(context,nameSet) {
  const start = getCursor(context);
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source);
  const name = match[0];
  if (nameSet.has(name)) {
    console.error("属性已经存在");
  }
  nameSet.add(name);
  advancBy(context, name.length);
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
  if (!context.inVPre && startsWith(name, 'v-')) {
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
    advancBy(context, 1);
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
      advancBy(context, 1);
    }
  }
  return {
    content,
    isQuoted,
    loc:{}
  }
}
function parseTextData(context,length,mode) {
  const rawText = context.source.slice(0, length);
  advancBy(context, length);
  return rawText;
}
function getCursor(context) {
  const { column, line, offset } = context;
  return {
    column,
    line,
    offset
  }
}
function isEnd(context,mode,ancestors) {
  const s = context.source;
  switch (mode) {
    case TextModes.DATA:
      if (s.startWidths('</')) {
        for (let i = ancestors.length - 1; i >= 0; i--){
          if (startsWidthEndTagOpen(s,ancestors[i].tag)) {
            return true;
          }
        }
      }
  }
  return !s;
}
function startsWidthEndTagOpen(source,tag) {
  return (
    source.startWidths('</') &&
    source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase());
}
function advancBy(context,numberOfChar) {
  const { source } = context;
  context.source = source.slice(numberOfChar);
}
function advanceSpaces(context) {
  const match = /^[\t\r\n\f ]+/.exec(context.source)
  if (match) {
    advanceBy(context, match[0].length)
  }
}