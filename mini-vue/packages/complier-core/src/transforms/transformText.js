import { PatchFlags } from "../../../shared/src/patchFlags.js";
import { PatchFlagNames } from "../../../shared/src/patchFlags.js";
import {
  ElementTypes,
  NodeTypes,
  createCallExpression,
  createCompoundExpression,
} from "../ast.js";
import { isText } from "../utils.js";
import { CREATE_TEXT } from "../runtimeHelpers.js";
export const transformText = (node, context) => {
  if (
    node.type === NodeTypes.ROOT ||
    node.type === NodeTypes.ELEMENT ||
    node.type === NodeTypes.FOR ||
    node.type === NodeTypes.IF_BRANCH
  ) {
    return () => {
      const children = node.children;
      let currentContainer = undefined;
      let hasText = false;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isText(child)) {
          hasText = true;
          for (let j = i + 1; j < children.length; j++) {
            const next = children[j];
            if (isText(next)) {
              if (!currentContainer) {
                currentContainer = children[i] = createCompoundExpression(
                  [child],
                  child.loc
                );
                
              }
              currentContainer.children.push(` + `, next);
              children.splice(j, 1);
              j--;
            } else {
              currentContainer = undefined;
              break;
            }
          }
        }
      }
      console.log(json(children))
      if (
        !hasText ||
        (children.length===1 && (node.type === NodeTypes.ROOT ||
        (node.type === NodeTypes.ELEMENT &&
          node.tagType === ElementTypes.ELEMENT&&
          !node.props.find(
            (p) =>
              p.type === NodeTypes.DIRECTIVE &&
              !context.directiveTransforms[p.name]
          ) && !(node.tag==='template'))))
      ) {
        debugger
        return;
      }  
      
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isText(child) || child.type === NodeTypes.COMPOUND_EXPRESSION) {
          const callArgs = [];
          if (child.type !== NodeTypes.TEXT || child.content !== " ") {
            callArgs.push(child);
          
          }
  
          if (!context.ssr) {
            callArgs.push(
              PatchFlags.TEXT + ` ${PatchFlagNames[PatchFlags.TEXT]} `
            );
          }
          
          children[i] = {
            type: NodeTypes.TEXT_CALL,
            content: child,
            loc: child.loc,
            codegenNode: createCallExpression(context.helper(CREATE_TEXT),callArgs),
          };
        }
      }
    };
  }
};
