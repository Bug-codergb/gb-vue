import { ElementTypes, NodeTypes, createSimpleExpression } from "../ast.js";
import { 
  createStructuralDirectiveTransform, traverseNode
} from "../transform.js";
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
        
      } else {
        
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