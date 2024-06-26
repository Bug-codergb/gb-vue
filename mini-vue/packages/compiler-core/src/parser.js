import { NO } from '../../shared/src/general.js';
import { makeMap } from '../../shared/src/index.js';
import {
  Namespaces, createRoot, NodeTypes, ElementTypes, ConstantTypes,
} from './ast.js';
import { advancePositionWithMutation } from './utils.js';

function last(xs) {
  return xs[xs.length - 1];
}
export const TextModes = {
  DATA: 0, // element component
  RCDATA: 1, // textarea ,title
  RAWTEXT: 2, // style,iframe,script,noscript
  CDATA: 3,
  ATTRIBUTE_VALUE: 4,
};
const TagType = {
  Start: 0,
  End: 1,
};
const decodeRE = /&(gt|lt|amp|apos|quot);/g;
const decodeMap = {
  gt: '>',
  lt: '<',
  amp: '&',
  apos: "'",
  quot: '"',
};

export const defaultParserOptions = {
  delimiters: ['{{', '}}'],
  decodeEntities: (rawText) => rawText.replace(decodeRE, (_, p1) => decodeMap[p1]),
  isVoidTag: NO, // <img/> <link/>
  isPreTag: NO, // <pre>
  getNamespace: () => Namespaces.HTML,
  getTextMode: () => TextModes.DATA,
  isCustomElement: NO,
};

export function baseParser(content, options) {
  // console.log(options);
  // vue 在转换时都会创建一个context,贯穿整个过程（在transform,codegen）都是如此
  const context = createParserContext(content, options);
  const start = getCursor(context);// 获取当前编译位置
  return createRoot( // 使用根节点对其进行包裹，跟节点中还要存储编译过程中形成的数据
    parseChildren(context, TextModes.DATA, []),
    getSelection(context, start),
  );
}
// 创建编译上下文
function createParserContext(content, rawOptions) {
  // 如果用户传入options则替换defaultOptions中的相关项
  const options = { ...defaultParserOptions };
  for (const key in rawOptions) {
    options[key] = rawOptions[key] === undefined ? defaultParserOptions[key] : rawOptions[key];
  }
  return {
    options,
    column: 1,
    line: 0,
    offset: 0,
    originalSource: content,
    source: content,
    inPre: false, // 是否为pre标签
    inVPrev: false, // 是否为 v-pre
  };
}
// 核心转换
function parseChildren(context, mode, ancestors) {
  const parent = last(ancestors); // 获取父节点
  const ns = parent ? parent.ns : Namespaces.HTML;
  const nodes = [];
  while (!isEnd(context, mode, ancestors)) { // 是否解析至末尾，如何判断是否解析至末尾》isEnd
    const s = context.source;
    let node;
    if (mode === TextModes.DATA || mode === TextModes.RCDATA) {
      // 如果元素上不存在v-prev指令，且开头为{{, v-pre需要原样渲染
      if (!context.inVPrev && s.startsWith(context.options.delimiters[0])) {
        node = parseInterpolation(context, mode); // 解析大括号语法
      } else if (mode === TextModes.DATA && s[0] === '<') {
        if (s.length === 1) {
          console.error('error');
        } else if (s[1] === '!') { // 注释以及文档声明暂不实现

        } else if (s[1] === '/') { // 解析结束标签
          if (s.length === 2) {
            console.error('error');
          } else if (s[2] === '>') {
            advanceBy(context, 3);
            continue;
          } else if (/[a-z]/i.test(s[2])) {
            parseTag(context, TagType.End, parent);
            continue;
          } else {

          }
        } else if (/[a-z]/i.test(s[1])) { // 解析开始标签
          node = parseElement(context, ancestors);
        }
      }
    }
    if (!node) {
      node = parseText(context, mode);
    }
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        pushNode(nodes, node[i]);
      }
    } else {
      pushNode(nodes, node);
    }
  }

  // 是否去除空格，换行节点等
  let removedWhitespace = false;
  if (mode !== TextModes.RAWTEXT && mode !== TextModes.RCDATA) {
    const shouldCondense = context.options.whitespace !== 'preserve'; // 是否应该压缩
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.type === NodeTypes.TEXT) {
        if (!context.inPre) {
          if (!/[^\t\r\n\f ]/.test(node.content)) {
            const prev = nodes[i - 1];
            const next = nodes[i + 1];
            if (!prev || !next || (
              shouldCondense && (
                (prev.type === NodeTypes.COMMENT && next.type === NodeTypes.COMMENT)
                || (prev.type === NodeTypes.COMMENT && next.type === NodeTypes.ELEMENT)
                || (prev.type === NodeTypes.ELEMENT && next.type === NodeTypes.COMMENT)
                || (prev.type === NodeTypes.ELEMENT && next.type === NodeTypes.ELEMENT && /[\r\n]/.test(node.content))
              )
            )) {
              removedWhitespace = true;
              nodes[i] = null;
            } else {
              node.content = '';
            }
          } else if (shouldCondense) {
            node.content = node.content.replace(/[\t\r\n\f ]+/g, ' ');
          }
        } else {
          node.content = node.content.replace(/\r\n/g, '\n');
        }
      } else if (node.type === NodeTypes.COMMENT && !context.options.comments) {
        removedWhitespace = true;
        nodes[i] = null;
      }
    }
  }
  return removedWhitespace ? nodes.filter(Boolean) : nodes;
}

function parseInterpolation(context, mode) {
  const [open, close] = context.options.delimiters;// 获取插值语法的语法形式,{{}}用户也可以自定义
  const closeIndex = context.source.indexOf(close, open.length); // 获取 }} 的索引
  if (closeIndex === -1) {
    return undefined;
  }
  const start = getCursor(context);

  advanceBy(context, open.length); // 继续推进

  const innerStart = getCursor(context);
  const innerEnd = getCursor(context);

  const rawContentLength = closeIndex - open.length; // 虽然推进了，索引的终-起得到原始内容长度（如果存在空格或者换行）

  const rawContent = context.source.slice(0, rawContentLength); // 获取原始内容（如果存在空格换行）

  const preTrimContent = parseTextData(context, rawContentLength, mode);

  const content = preTrimContent.trim();
  const startOffset = preTrimContent.indexOf(content);
  if (startOffset > 0) {
    advancePositionWithMutation(innerStart, rawContent, startOffset);
  }
  const endOffset = rawContentLength - (preTrimContent.length - content.length - startOffset);
  advancePositionWithMutation(innerEnd, rawContent, endOffset);

  advanceBy(context, close.length);// 继续推进

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      isStatic: false,
      constType: ConstantTypes.NOT_CONSTANT, // 不可以静态提升至全局变量
      content,
      loc: getSelection(context, innerStart, innerEnd),
    },
    loc: getSelection(context, start),
  };
}
function parseElement(context, ancestors) {
  const wasInPre = context.inPre;// 是否为pre标签
  const wasInVPre = context.inVPrev;// 是否为v-pre标签

  const parent = last(ancestors);// 获取父元素，初始化则为[],当树节点层级嵌套时，ancestors会一直保存其父节点（父节点的父节点）；

  const element = parseTag(context, TagType.Start, parent);// 处理标签
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

  ancestors.push(element);// 将当前解析完毕的元素节点添加至祖先节点里面
  const mode = context.options.getTextMode(element, parent);
  const children = parseChildren(context, mode, ancestors);
  ancestors.pop();// 类似于回溯的思想

  element.children = children;

  if (startsWidthEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End, parent);
  }

  element.loc = getSelection(context, element.loc.start);

  if (isPreBoundary) {
    context.inPre = false;
  }
  if (isVPreBoundary) {
    context.inVPre = false;
  }
  return element;
}

const isSpecialTemplateDirective = makeMap('if,else,else-if,for,slot');

function parseTag(context, type, parent) {
  const start = getCursor(context);
  const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source);// 匹配开始标签或者结束标签

  const tag = match[1]; // 匹配到标签名称
  const ns = context.options.getNamespace(tag, parent);
  advanceBy(context, match[0].length);// 推进<div
  advanceSpaces(context);// 推进空格

  const cursor = getCursor(context);
  const currentSource = context.source;
  if (context.options.isPreTag(tag)) {
    context.inPre = true;
  }
  // 向后推进后去解析标签上的属性
  const props = parseAttributes(context, type);

  if (
    type === TagType.Start
    && !context.inVPre
    && props.some((p) => p.type === NodeTypes.DIRECTIVE && p.name === 'pre')) {
    context.inPre = true;
    props.parseAttributes(context, type).filter(((p) => p.name !== 'v-prev'));
  }

  let isSelfClosing = false;

  isSelfClosing = context.source.startsWith('/>');

  advanceBy(context, isSelfClosing ? 2 : 1);
  if (type === TagType.End) {
    return;
  }

  // 表示元素的类型
  let tagType = ElementTypes.ELEMENT;

  if (!context.inVPre) {
    if (tag === 'slot') {
      tagType = ElementTypes.SLOT;
    } else if (tag === 'template') {
      if (props.some((p) => p.type === NodeTypes.DIRECTIVE && isSpecialTemplateDirective(p.name))) {
        tagType = ElementTypes.TEMPLATE;
      }
    } else if (isComponent(tag, props, context)) {
      tagType = ElementTypes.COMPONENT;
    }
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
    codegenNode: undefined, // to be created during transform phase
  };
}

function isComponent(tag, props, context) {
  // console.log(tag);
  const { options } = context;
  if (options.isCustomElement(tag)) {
    return false;
  }
  if (
    tag === 'component'
    || /^[A-Z]/.test(tag)
    || (options.isNativeTag && !options.isNativeTag(tag))
  ) {
    return true;
  }
}

function parseAttributes(context, type) {
  const props = [];
  const attributeNames = new Set();// 防止属性名称重复
  // 匹配标签上的属性直至标签结束 div> 或者自结束标签 div/>
  while (
    context.source.length > 0 && !context.source.startsWith('>')
    && !context.source.startsWith('/>')) {
    if (context.source.startsWith('/')) {
      advanceBy(context, 1);
      advanceSpaces(context);
      continue;
    }
    const attr = parseAttribute(context, attributeNames);
    if (
      attr.type === NodeTypes.ATTRIBUTE
      && attr.value
      && attr.name === 'class'
    ) {
      attr.value.content = attr.value.content.replace(/\s+/g, ' ').trim();
    }

    if (type === TagType.Start) {
      props.push(attr);
    }

    if (/^[^\t\r\n\f />]/.test(context.source)) {
      console.error('不明确的语法');
    }
    advanceSpaces(context);
  }
  return props;
}
function parseAttribute(context, nameSet) {
  const start = getCursor(context);
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source);
  const name = match[0];
  if (nameSet.has(name)) {
    console.error('属性已经存在');
  }
  nameSet.add(name);
  advanceBy(context, name.length);
  let value;

  // 处理value
  if (/^[\t\r\n\f ]*=/.test(context.source)) {
    advanceSpaces(context);
    advanceBy(context, 1);
    advanceSpaces(context);
    value = parseAttributeValue(context);
    if (!value) {
      console.error('error');
    }
  }

  const loc = getSelection(context, start);

  // 处理name
  if (!context.inVPre && /^(v-[A-Za-z0-9-]|:|\.|@|#)/.test(name)) {
    const match = /(?:^v-([a-z0-9-]+))?(?:(?::|^\.|^@|^#)(\[[^\]]+\]|[^\.]+))?(.+)?$/i.exec(
      name,
    );
    const isPropShorthand = name.startsWith('.');
    const dirName = match[1] || (isPropShorthand || name.startsWith(':') ? 'bind' : name.startsWith('@') ? 'on' : 'slot');
    let arg;
    if (match[2]) {
      const isSlot = dirName === 'slot';
      let content = match[2];
      let isStatic = true;
      if (content.startsWith('[')) { // 这种情况说明属性名称为动态类型 :[app]="foo"
        isStatic = false;
        if (!content.endsWith(']')) {
          console.error('error');
          content = content.slice(1);
        } else {
          content = content.slice(1, content.length - 1);
        }
      } else if (isSlot) {
        content += match[3] || '';
      }
      arg = {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content,
        isStatic,
        constType: isStatic
          ? ConstantTypes.CAN_STRINGIFY
          : ConstantTypes.NOT_CONSTANT,
        loc,
      };
    }
    if (value && value.isQuoted) {
      const valueLoc = value.loc;
      valueLoc.start.offset++;
      valueLoc.start.column++;
    }
    const modifiers = match[3] ? match[3].slice(1).split('.') : [];
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
        loc: value.loc,
      },
      arg,
      modifiers,
      loc,
    };
  }
  if (!context.inVPre && name.startsWith('v-')) {
    // emitError(context, ErrorCodes.X_MISSING_DIRECTIVE_NAME)
  }
  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value: value && {
      type: NodeTypes.TEXT,
      content: value.content,
      loc: value.loc,
    },
    loc,
  };
}
function parseAttributeValue(context) {
  const start = getCursor(context);
  let content;
  const quote = context.source[0];
  const isQuoted = quote === '"' || quote === '\'';
  if (isQuoted) {
    advanceBy(context, 1);
    const endIndex = context.source.indexOf(quote);
    if (endIndex === -1) {
      content = parseTextData(
        context,
        context.source.length,
        TextModes.ATTRIBUTE_VALUE,
      );
    } else {
      content = parseTextData(
        context,
        endIndex,
        TextModes.ATTRIBUTE_VALUE,
      );
      advanceBy(context, 1);
    }
  }
  return {
    content,
    isQuoted,
    loc: getSelection(context, start),
  };
}
function parseTextData(context, length, mode) {
  const rawText = context.source.slice(0, length);
  advanceBy(context, length);
  if (mode === TextModes.RAWTEXT || mode === TextModes.CDATA || !rawText.includes('&')) {
    return rawText;
  }
  // 文本节点需要处理特殊字符<,>,
  return context.options.decodeEntities(
    rawText,
    mode === TextModes.ATTRIBUTE_VALUE,
  );
}
function getCursor(context) {
  const { column, line, offset } = context;
  return {
    column,
    line,
    offset,
  };
}
// 判断是否为结束标签，当前template以</开头，获取ancestors的最后一个节点
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
    default:
  }
  return !s;
}
// 存储当前位置信息
function getSelection(context, start, end) {
  end = end || getCursor(context);
  return {
    start,
    end,
    source: context.originalSource.slice(start.offset, end.offset),
  };
}
function startsWidthEndTagOpen(source, tag) {
  return (
    source.startsWith('</')
    && source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase()
    && /[\t\r\n\f />]/.test(source[2 + tag.length] || '>'));
}
function advanceBy(context, numberOfChar) {
  const { source } = context;
  advancePositionWithMutation(context, source, numberOfChar);
  context.source = source.slice(numberOfChar);
}
function advanceSpaces(context) {
  const match = /^[\t\r\n\f ]+/.exec(context.source);
  if (match) {
    advanceBy(context, match[0].length);
  }
}
function pushNode(nodes, node) {
  if (node.type === NodeTypes.TEXT) {
    const prev = last(nodes);
    // Merge if both this and the previous node are text and those are
    // consecutive. This happens for cases like "a < b".
    if (
      prev
      && prev.type === NodeTypes.TEXT
      && prev.loc.end.offset === node.loc.start.offset
    ) {
      prev.content += node.content;
      prev.loc.end = node.loc.end;
      prev.loc.source += node.loc.source;
      return;
    }
  }

  nodes.push(node);
}

function parseText(context, mode) {
  const endTokens = mode === TextModes.CDATA ? [']]>'] : ['<', context.options.delimiters[0]];
  // 如果是element则文本节点的结束应该是<或者是{{
  let endIndex = context.source.length;
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i], 1);
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }

  const start = getCursor(context);
  const content = parseTextData(context, endIndex, mode);

  return {
    type: NodeTypes.TEXT,
    content,
    loc: getSelection(context, start),
  };
}
