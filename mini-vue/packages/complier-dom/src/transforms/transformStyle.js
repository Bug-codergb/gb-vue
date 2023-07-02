import { NodeTypes } from '../../../complier-core/src/ast.js';

export const transformStyle = (node) => {
  if (node.type === NodeTypes.ELEMENT) {
    node.props.forEach((p, i) => {
      if (p.type === NodeTypes.ATTRIBUTE && p.name === 'style' && p.value) {

      }
    });
  }
};
const parseInlineCSS = () => {

};
