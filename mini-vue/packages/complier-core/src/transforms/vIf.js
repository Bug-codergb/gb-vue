import {
  ConstantTypes,
  ElementTypes,
  NodeTypes,
  createCallExpression,
  createConditionalExpression,
  createObjectExpression,
  createObjectProperty,
  createSimpleExpression,
  createVNodeCall
} from "../ast.js";
import { CREATE_COMMENT, FRAGMENT } from "../runtimeHelpers.js";
import { 
  createStructuralDirectiveTransform, traverseNode
} from "../transform.js";
import {  PatchFlags  } from "../../../shared/src/index.js";
import { PatchFlagNames } from "../../../shared/src/patchFlags.js";
let __DEV__ = true;
export const transformIf = createStructuralDirectiveTransform(/^(if|else|else-if)$/, (node, dir, context) => {
  return processIf(node, dir, context, (ifNode,branch,isRoot) => {
    const siblings = context.parent.children;
    let i = siblings.indexOf(ifNode);
    let key = 0;
    while (i-- >= 0) {
      const sibling = siblings[i];
      if (sibling && sibling.type === NodeTypes.IF) {
        key += sibling.branches.length;
      }
    }

    return () => {
      if (isRoot) {
        ifNode.codegenNode = createCodegenNodeForBranch(
          branch,
          key,
          context
        )
      } else {
        const parentCondition = getParentCondition(ifNode.codegenNode);
        parentCondition.alternate = createCodegenNodeForBranch(
          branch,
          key + ifNode.branches.length - 1,
          context
        )
      }
    }
  });
});
export function processIf(node, dir, context, processCodegen) {
  // v-if 或者 v-else-if 没有value, v-if = undefined,v-else-if=undefined
  if (dir.name !== 'else' && (!dir.exp || !dir.exp.content.trim())) {
    const loc = fir.exp ? dir.exp.loc : node.loc;
    dir.exp = createSimpleExpression('true',false,loc);
  }

  if (dir.name === "if") {
    /*
      创建一个分支，并且将分支插入到ifNode中，最后将当前节点
      替换为ifNode,提升ast树语义
    */
    const branch = createIfBranch(node, dir);
    const ifNode = {
      type: NodeTypes.IF,
      loc: node.loc,
      branches:[branch]
    }
    context.replaceNode(ifNode);
    if (processCodegen) {
      return processCodegen(ifNode, branch, true);
    }
  } else { // 指令为v-else-if，v-else
    const siblings = context.parent.children;
    let i = siblings.indexOf(node);
    while (i-- >= -1) {
      const sibling = siblings[i];

      if (sibling && sibling.type === NodeTypes.COMMENT) {//如果是注释节点，直接跳过
        context.removeNode(sibling);
        continue;
      }
      if (sibling && sibling.type === NodeTypes.TEXT && !sibling.content.trim().length) {
        context.removeNode(sibling);
        continue;
      }
      
      if (sibling && sibling.type === NodeTypes.IF) {
        if (
          dir.name === 'else-if' &&
          sibling.branches[sibling.branches.length-1].condition === undefined
        ) {
          console.error("不匹配");
        }

        context.removeNode(); //移除当前节点
        const branch = createIfBranch(node, dir);//创建当前节点分支节点
        //创建分支节点后，不需要创建ifNode，直接将当前分支节点插入到最近的ifNode中去
        sibling.branches.push(branch);
        const onExit = processCodegen && processCodegen(sibling, branch, false);
        
        traverseNode(branch, context);
        if (onExit) {
          onExit();
        }
        context.currentNode = null;
      } else {
        console.error("不匹配")
      }
      break;
    }
  }
}
function createIfBranch(node,dir) {
  const isTemplate = node.tagType === ElementTypes.TEMPLATE;
  return {
    type: NodeTypes.IF_BRANCH,
    loc: node.loc,
    condition: dir.name === 'else' ? undefined : dir.exp,
    children: [node],
    isTemplate,
  }
}
//为分支创建 codegenCode
function createCodegenNodeForBranch(branch, keyIndex, context) {
  if (branch.condition) {
    return createConditionalExpression(
      branch.condition,
      createChildrenCodegenNode(branch, keyIndex, context),
      createCallExpression(
        context.helper(CREATE_COMMENT),
        [
          'v-if',
          'true'
        ]
      )
    )
  } else {
    return createChildrenCodegenNode(branch,keyIndex,context)
  }
}
function createChildrenCodegenNode(branch,keyIndex,context) {
  const { helper } = context;
  const keyProperty = createObjectProperty(
    'key',
    createSimpleExpression(
      `${keyIndex}`,
      false,
      {},
      ConstantTypes.CAN_HOIST
    )
  )
  const { children } = branch;
  
  const firstChild = children[0];
  const needFragmentWrapper = children.length !== 1 || firstChild.type !== NodeTypes.ELEMENT;
  
  if (needFragmentWrapper) {
    if (children.length === 1 || firstChild.type !== NodeTypes.FOR) {
      const vnodeCall = firstChild.codegenNode;
      return vnodeCall;
    } else {
      debugger
      let patchFlag = PatchFlags.STABLE_FRAGMENT;
      let patchFlagText = PatchFlagNames[PatchFlags.STABLE_FRAGMENT];
      if (__DEV__ && !branch.isTemplateIf && children.filter(c => c.type !== NodeTypes.COMMENT).length === 1) {
        patchFlag |= PatchFlags.DEV_ROOT_FRAGMENT;
        patchFlagText += `, ${PatchFlagNames[PatchFlags.DEV_ROOT_FRAGMENT]}`;
      }
      return createVNodeCall(
        context,
        helper(FRAGMENT),
        createObjectExpression([keyProperty]),
        children,
        patchFlag + (__DEV__ ? ` /* ${patchFlagText} */ ` : ''),
        undefined,
        undefined,
        true,
        false,
        false,
        branch.loc
      )
    }
  } else {
    const ret = firstChild.codegenNode;
    return ret;
  }
}
function getParentCondition(node) {
  while (true) {
    if (node.type === NodeTypes.JS_CONDITIONAL_EXPRESSION) {
      if (node.alternate.type == NodeTypes.JS_CONDITIONAL_EXPRESSION) {
        node = node.alternate;
      } else {
        return node;
      }
    } else if(node.type === NodeTypes.JS_CACHE_EXPRESSION) {
      node = node.value;
    }
  }
}