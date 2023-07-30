import { PatchFlagNames, PatchFlags } from '../../../shared/src/patchFlags.js';
import {
  ConstantTypes, NodeTypes, createCallExpression, createObjectProperty, createSimpleExpression, createVNodeCall,
} from '../ast.js';
import { FRAGMENT, RENDER_LIST } from '../runtimeHelpers.js';
import { createStructuralDirectiveTransform } from '../transform.js';
import { isTemplateNode, findProp } from '../utils.js';

export const transformFor = createStructuralDirectiveTransform('for', (node, dir, context) => {
  const { helper, removeHelper } = context;
  return processFor(node, dir, context, (forNode) => {
    const renderExp = createCallExpression(helper(RENDER_LIST), [
      forNode.source,
    ]);
    const isTemplate = isTemplateNode(node);
    const keyProp = findProp(node, 'key');
    const keyExp = keyProp && (
      keyProp.type === NodeTypes.ATTRIBUTE ? createSimpleExpression(keyProp.value.content, true) : keyProp.exp
    );
    const keyProperty = keyProp ? createObjectProperty('key', keyExp) : null;

    const isStableFragment = forNode.source.type === NodeTypes.SIMPLE_EXPRESSION
      && forNode.source.constType > ConstantTypes.NOT_CONSTANT;
    const fragmentFlag = isStableFragment ? PatchFlags.STABLE_FRAGMENT : keyProp ? PatchFlags.KEYED_FRAGMENT : PatchFlags.UNKEYED_FRAGMENT;
    forNode.codegenNode = createVNodeCall(
      context,
      helper(FRAGMENT),
      undefined,
      renderExp,
      `${fragmentFlag} /* ${PatchFlagNames[fragmentFlag]} */`,
      undefined,
      undefined,
      true,
      !isStableFragment,
      false,
      node.loc,
    );

    return () => {

    };
  });
});
export function processFor(
  node,
  dir,
  context,
  processCodegen,
) {
  if (!dir.exp) {
    console.error('v-for不存在表达式');
    return;
  }
  const parseResult = parseForExpression(dir.exp, context);
  if (!parseResult) {
    console.error('error');
    return;
  }
  const { addIdentifiers, removeIdentifiers, scopes } = context;
  const {
    source, value, key, index,
  } = parseResult;
  const forNode = {
    type: NodeTypes.FOR,
    loc: dir.loc,
    source,
    valueAlias: value,
    keyAlias: key,
    objectIndexAlias: index,
    parseResult,
    children: isTemplateNode(node) ? node.children : [node],
  };
  context.replaceNode(forNode);
  scopes.vFor++;
  const onExit = processCodegen && processCodegen(forNode);
  return () => {
    scopes.vFor--;
    if (onExit) {
      onExit();
    }
  };
}

const forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/;
// This regex doesn't cover the case if key or index aliases have destructuring,
// but those do not make sense in the first place, so this works in practice.
const forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/;
const stripParensRE = /^\(|\)$/g;

function createAliasExpression(range = {}, content, offset) {
  return createSimpleExpression(
    content,
    false,
    range,
  );
}

export function parseForExpression(
  input,
  context,
) {
  const { loc } = input;
  const exp = input.content;
  const inMatch = exp.match(forAliasRE);
  if (!inMatch) return;
  const [, LHS, RHS] = inMatch;// LHS(item,index) RHS(list  )
  console.log(LHS, RHS);

  const result = {
    source: createAliasExpression(
      loc,
      RHS.trim(),
      exp.indexOf(RHS, LHS.length),
    ),
    value: undefined,
    key: undefined,
    index: undefined,
  };

  let valueContent = LHS.trim().replace(stripParensRE, '').trim(); // item,index
  const trimmedOffset = LHS.indexOf(valueContent);

  const iteratorMatch = valueContent.match(forIteratorRE);
  console.log(iteratorMatch);
  if (iteratorMatch) {
    valueContent = valueContent.replace(forIteratorRE, '').trim(); // item
    const keyContent = iteratorMatch[1].trim(); // index
    if (keyContent) {
      result.key = createAliasExpression(loc, keyContent, {});
    }
    if (iteratorMatch[2]) { // 是否存在元素组如 (item,index,arr)
      const indexContent = iteratorMatch[2].trim();
      if (indexContent) {
        result.index = createAliasExpression(
          loc,
          indexContent,
          {},
        );
      }
    }
  }
  if (valueContent) {
    result.value = createAliasExpression(loc, valueContent, {});
  }
  return result;
}
