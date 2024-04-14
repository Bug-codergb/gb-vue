const template = `
  <div class="container" id="root"><span class="app"></span><p></p></div>
`;
function last(value) {
  return value[value.length - 1];
}
const ret = parser(template, []);

function parser(template, ancestors) {
  template = template.trim();
  if (!template) {
    return;
  }
  const context = {
    template,
  };
  const nodes = parseChildren(context, ancestors);
  console.log(nodes);
  return nodes;
}

function parseChildren(context, ancestors) {
  const nodes = [];
  let node = null;
  while (!isEnd(context, ancestors)) {
    if (context.template[0] === '<') {
      if (context.template[1] === '/') {
        if (/[a-z]/i.test(context.template[2])) {
          const match = /^<\/?([a-z][^\t\r\n\f / >]*)/i.exec(context.template);
          context.template = context.template.slice(match[0].length);
          const isSelfClosing = context.template.startsWith('/>');
          context.template = context.template.slice(isSelfClosing ? 2 : 1);
          continue;
        }
      } else if (/[a-z]/i.test(context.template[1])) {
        node = parseElement(context, ancestors);
      }
    }
    nodes.push(node);
  }

  return nodes;
}
function parseElement(context, ancestors) {
  if (!context.template) {
    return '';
  }
  const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.template);

  const tag = match[1];
  context.template = context.template.slice(match[0].length);

  const props = [];
  while (context.template.length > 0 && !context.template.startsWith('>') && !context.template.startsWith('/>')) {
    context.template = context.template.trim();
    const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.template);
    const name = match[0];
    context.template = context.template.slice(name.length);
    if (/^[\t\r\n\f ]*=/.test(context.template)) {
      context.template = context.template.slice(1);
      const quote = context.template[0];
      if (quote === '"' || quote === '\'') {
        context.template = context.template.slice(1);
        const endIndex = context.template.indexOf(quote);
        const text = context.template.slice(0, endIndex);
        context.template = context.template.slice(1);
        props.push({
          name,
          value: text,
        });
      }
    }
  }

  // 属性匹配完后
  const isSelfClosing = context.template.startsWith('/>');
  context.template = context.template.slice(isSelfClosing ? 2 : 1);

  const node = {
    type: 'element',
    tag,
    props,
    children: [],
  };
  ancestors.push(node);

  const children = parseChildren(context, ancestors);

  node.children = children;
  ancestors.pop();
  return node;
}

function isEnd(context, ancestors) {
  const s = context.template;
  if (s.startsWith('</')) {
    if (ancestors.length && startsWithEndTagOpen(s, last(ancestors).tag)) {
      return true;
    }
  }
  return !s;
}
function startsWithEndTagOpen(source, tag) {
  return (
    source.startsWith('</')
    && source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase()
    && /[\t\r\n\f />]/.test(source[2 + tag.length] || '>')
  );
}
