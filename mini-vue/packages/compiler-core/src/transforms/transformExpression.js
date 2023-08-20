import {
  NodeTypes, createCompoundExpression, createSimpleExpression, ConstantTypes,
} from '../ast.js';
import { isSimpleIdentifier } from '../utils.js';

export const transformExpression = (node, context) => {
  if (node.type === NodeTypes.INTERPOLATION) {
    node.content = processExpression(
      node.content,
      context,
    );
  } else if (node.type === NodeTypes.ELEMENT) {
    // handle directives on element
    for (let i = 0; i < node.props.length; i++) {
      const dir = node.props[i];
      // do not process for v-on & v-for since they are special handled
      if (dir.type === NodeTypes.DIRECTIVE && dir.name !== 'for') {
        const exp = dir.exp;
        const arg = dir.arg;
        // do not process exp if this is v-on:arg - we need special handling
        // for wrapping inline statements.
        if (
          exp
          && exp.type === NodeTypes.SIMPLE_EXPRESSION
          && !(dir.name === 'on' && arg)
        ) {
          dir.exp = processExpression(
            exp,
            context,
            // slot args must be processed as function params
            dir.name === 'slot',
          );
        }
        if (arg && arg.type === NodeTypes.SIMPLE_EXPRESSION && !arg.isStatic) {
          dir.arg = processExpression(arg, context);
        }
      }
    }
  }
};
export function processExpression(
  node,
  context,
  asParams = false,
  asRawStatements = false,
  localVars = Object.create(context.identifiers),

) {
  const { inline, bindingMetadata } = context;
  const rewriteIdentifier = (raw, parent, id) => `_ctx.${raw}`;
  // fast path if expression is a simple identifier.
  const rawExp = node.content;
  // bail constant on parens (function invocation) and dot (member access)
  const bailConstant = constantBailRE.test(rawExp);

  if (isSimpleIdentifier(rawExp)) {
    const isScopeVarReference = context.identifiers[rawExp];
    const isAllowedGlobal = isGloballyAllowed(rawExp);
    const isLiteral = isLiteralWhitelisted(rawExp);
    if (!asParams && !isScopeVarReference && !isAllowedGlobal && !isLiteral) {
      // const bindings exposed from setup can be skipped for patching but
      // cannot be hoisted to module scope
      if (isConst(bindingMetadata[node.content])) {
        node.constType = ConstantTypes.CAN_SKIP_PATCH;
      }
      node.content = rewriteIdentifier(rawExp);
    } else if (!isScopeVarReference) {
      if (isLiteral) {
        node.constType = ConstantTypes.CAN_STRINGIFY;
      } else {
        node.constType = ConstantTypes.CAN_HOIST;
      }
    }
    return node;
  }

  return null;
}
function canPrefix(id) {
  // skip whitelisted globals
  if (isGloballyAllowed(id.name)) {
    return false;
  }
  // special case for webpack compilation
  if (id.name === 'require') {
    return false;
  }
  return true;
}

export function stringifyExpression(exp) {
  if (isString(exp)) {
    return exp;
  } if (exp.type === NodeTypes.SIMPLE_EXPRESSION) {
    return exp.content;
  }
  return (exp.children)
    .map(stringifyExpression)
    .join('');
}

function isConst(type) {
  return (
    type === BindingTypes.SETUP_CONST || type === BindingTypes.LITERAL_CONST
  );
}
