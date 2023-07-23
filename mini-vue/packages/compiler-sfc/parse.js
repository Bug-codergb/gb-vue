import { NodeTypes } from '../compiler-core/src/ast.js';
import { TextModes } from '../compiler-core/src/index.js';
import * as CompilerDOM from '../compiler-dom/src/index.js';

export const DEFAULT_FILENAME = 'anonymous.vue';

function hasSrc(node) {
  return node.props.some((p) => {
    if (p.type !== NodeTypes.ATTRIBUTE) {
      return false;
    }
    return p.name === 'src';
  });
}
function isEmpty(node) {
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (child.type !== NodeTypes.TEXT || child.content.trim() !== '') {
      return false;
    }
  }
  return true;
}

function createBlock(node, source, pad) {
  const type = node.tag;
  let { start, end } = node.loc;
  let content = '';
  if (node.children.length) {
    start = node.children[0].loc.start;
    end = node.children[node.children.length - 1].loc.end;
    content = source.slice(start.offset, end.offset);
  } else {
    const offset = node.loc.source.indexOf('</');
    if (offset > -1) {
      start = {
        line: start.line,
        column: start.column + offset,
        offset: start.offset + offset,
      };
    }
    end = { ...start };
  }
  const loc = {
    source: content,
    start,
    end,
  };
  const attrs = {};
  const block = {
    type,
    content,
    loc,
    attrs,
  };
  node.props.forEach(((p) => {
    if (p.type === NodeTypes.ATTRIBUTE) {
      attrs[p.name] = p.value ? p.value.content || true : true;
      if (p.name === 'lang') {
        block.lang = p.value && p.value.content;
      } else if (p.name === 'src') {
        block.src = p.value && p.value.content;
      } else if (type === 'style') {
        if (p.name === 'scoped') {
          block.scoped = true;
        } else if (p.name === 'module') {
          block.module = attrs[p.name];
        }
      } else if (type === 'script' && p.name === 'setup') {
        block.setup = attrs.setup;
      }
    }
  }));

  return block;
}

export function parse(
  source,
  {
    sourceMap = true,
    filename = DEFAULT_FILENAME,
    sourceRoot = '',
    pad = false,
    ignoreEmpty = true,
    compiler = CompilerDOM,
  },
) {
  const sourceKey = source + sourceMap + filename + sourceRoot + pad + compiler.parse;
  const cache = undefined;
  if (cache) {
    console.log(sourceKey);
    return cache;
  }
  const descriptor = {
    filename,
    source,
    template: null,
    script: null,
    scriptSetup: null,
    styles: [],
    customBlocks: [],
    cssVars: [],
    slotted: false,
  };
  const errors = [];
  const ast = compiler.parse(source, {
    isNativeTag: () => true,
    isPreTag: () => true,
    getTextMode: ({ tag, props }, parent) => {
      if (
        (!parent && tag !== 'template')
        || (tag === 'template'
          && props.some(
            (p) => p.type === NodeTypes.ATTRIBUTE
              && p.name === 'lang'
              && p.value
              && p.value.content
              && p.value.content !== 'html',
          )
        )
      ) {
        return TextModes.RAWTEXT;
      }
      return TextModes.DATA;
    },
    onError: (e) => {
      errors.push(e);
    },
  });
  ast.children.forEach((node) => {
    if (node.type !== NodeTypes.ELEMENT) {
      return;
    }
    if (ignoreEmpty && node.tag !== 'template' && isEmpty(node) && !hasSrc(node)) {
      return;
    }
    switch (node.tag) {
      case 'template':
        if (!descriptor.template) {
          const templateBlock = (descriptor.template = createBlock(
            node,
            source,
            false,
          ));
          templateBlock.ast = node;
        } else {

        } break;
      case 'script':
        const scriptBlock = createBlock(node, source, pad);
        const isSetup = !!scriptBlock.attrs.setup;
        if (isSetup && !descriptor.scriptSetup) {
          descriptor.scriptSetup = scriptBlock;
          break;
        }
        if (!!isSetup && !descriptor.script) {
          descriptor.script = scriptBlock;
          break;
        }
        break;
      case 'style':
        const styleBlock = createBlock(node, source, pad);
        if (styleBlock.attrs.vars) {
          console.error('error');
        }
        descriptor.styles.push(styleBlock);
        break;
      default:
        descriptor.customBlocks.push(createBlock(node, source, pad));
        break;
    }
  });
  console.log(descriptor);

  const result = {
    descriptor,
  };
  return result;
}
