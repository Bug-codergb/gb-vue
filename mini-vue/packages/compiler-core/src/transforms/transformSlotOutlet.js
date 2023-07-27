import { camelize } from '../../../shared/src/general.js';
import { NodeTypes, createCallExpression, createFunctionExpression } from '../ast.js';
import { RENDER_SLOT } from '../runtimeHelpers.js';
import { isSlotOutlet, isStaticArgOf, isStaticExp } from '../utils.js';
import { buildProps } from './transformElement.js';

export const transformSlotOutlet = (node, context) => {
  if (isSlotOutlet(node)) {
    const { children, loc } = node;
    const { slotName, slotProps } = processSlotOutlet(node, context);
    console.log(slotProps);
    const slotArgs = [
      context.prefixIdentifiers ? '_ctx.$slot' : '$slot',
      slotName,
      '{}',
      'undefined',
      'true',
    ];
    let expectedLen = 2;
    if (slotProps) {
      slotArgs[2] = slotProps;
      expectedLen = 3;
    }
    if (children.length) {
      console.log(children);
      slotArgs[3] = createFunctionExpression([], children, false, false, {});
      expectedLen = 4;
    }
    slotArgs.splice(expectedLen);
    node.codegenNode = createCallExpression(
      context.helper(RENDER_SLOT),
      slotArgs,
      {},
    );
  }
};
export function processSlotOutlet(node, context) {
  let slotName = '"default"';
  let slotProps;
  const nonNameProps = [];
  console.log(node);
  for (let i = 0; i < node.props.length; i++) {
    const p = node.props[i];
    if (p.type === NodeTypes.ATTRIBUTE) {
      if (p.value) {
        if (p.name === 'name') {
          slotName = JSON.stringify(p.value.content);
        } else {
          p.name = camelize(p.name);
          nonNameProps.push(p);
        }
      }
    } else {
      console.log(p);

      if (p.name === 'bind' && isStaticArgOf(p.arg, 'name')) {
        if (p.exp) {
          slotName = p.exp;
        }
      } else {
        console.log(p);
        if (p.name === 'bind' && p.arg && isStaticExp(p.arg)) {
          p.arg.content = camelize(p.arg.content);
        }
        nonNameProps.push(p);
      }
    }
  }
  console.log(nonNameProps);
  if (nonNameProps.length > 0) {
    const { props, directives } = buildProps(
      node,
      context,
      nonNameProps,
      false,
      false,
    );
    slotProps = props;
    if (directives.length) {
      console.error('slot error');
    }
  }
  console.log(slotName);
  return {
    slotName,
    slotProps,
  };
}