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
  const nodes = [];
  parseChildren(template, ancestors, nodes);
  console.log(nodes);
  return nodes;
}
function isEnd(template, ancestors) {
  const s = template;
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

function parseChildren(template, ancestors, nodes) {
  while (!isEnd(template, ancestors)) {
    if (template[0] === '<') {
      if (template[1] === '/') {
        if (/[a-z]/i.test(template[2])) {
          const match = /^<\/?([a-z][^\t\r\n\f / >]*)/i.exec(template);
          template = template.slice(match[0].length);

          const isSelfClosing = template.startsWith('/>');
          template = template.slice(isSelfClosing ? 2 : 1);
        }
      } else if (/[a-z]/i.test(template[1])) {
        const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(template);
        const tag = match[1];
        template = template.slice(match[0].length);

        const props = [];
        while (template.length > 0 && !template.startsWith('>') && !template.startsWith('/>')) {
          template = template.trim();
          const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(template);
          const name = match[0];
          template = template.slice(name.length);
          if (/^[\t\r\n\f ]*=/.test(template)) {
            template = template.slice(1);
            const quote = template[0];
            if (quote === '"' || quote === '\'') {
              template = template.slice(1);
              const endIndex = template.indexOf(quote);
              const text = template.slice(0, endIndex);
              template = template.slice(1);
              props.push({
                name,
                value: text,
              });
            }
          }
        }

        // 属性匹配完后
        const isSelfClosing = template.startsWith('/>');
        template = template.slice(isSelfClosing ? 2 : 1);
        const node = {
          type: 'element',
          tag,
          props,
          children: [],
        };
        nodes.push(node);
      }
    }
  }
}
