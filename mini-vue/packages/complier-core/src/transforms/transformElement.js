import { PatchFlags, isObject } from "../../../shared/src/index.js";
import { createVNodeCall } from "../ast.js"
import {
  isOn, isReservedProps
} from "../../../shared/src/general.js";
import {
  GUARD_REACTIVE_PROPS,
  MERGE_PROPS,
  NORMALIZE_CLASS,
  NORMALIZE_PROPS,
  NORMALIZE_STYLE,
  RESOLVE_COMPONENT,
  RESOLVE_DYNAMIC_COMPONENT,
  TELEPORT,
  TO_HANDLERS
} from "../runtimeHelpers.js";
import {
  NodeTypes,
  ElementTypes,
  createCallExpression,
  createObjectExpression,
  createArrayExpression,
  createObjectProperty,
  createSimpleExpression
} from "../ast.js";
import { findProp, isStaticArgOf, isStaticExp } from "../utils.js";
import { PatchFlagNames } from "../../../shared/src/patchFlags.js";

let __DEV__ = true;
export const transformElement = (node, context) => {
  return function postTransformElement() {
    node = context.currentNode;
    if (
      !(node.type === NodeTypes.ELEMENT &&
        (node.tagType === ElementTypes.ELEMENT || node.tagType === ElementTypes.COMPONENT))
    ) {
      return;
    }

    const { tag, props } = node;
    const isComponent = node.tagType === ElementTypes.COMPONENT;

    let vnodeTag = isComponent ? resolveComponentType(node, context) : `"${tag}"`;
    
    const isDynamicComponent = isObject(vnodeTag) && vnodeTag.callee === RESOLVE_DYNAMIC_COMPONENT;

    let vnodeProps;
    let vnodeChildren;
    let vnodePatchFlag;
    let patchFlag = 0;
    let vnodeDynamicProps;
    let dynamicPropNames;
    let vnodeDirectives;

    let shouldUseBolck = false;

    if (props.length > 0) {
      const propsBuildResult = buildProps(
        node,
        context,
        undefined,
        isComponent,
        isDynamicComponent
      );
      vnodeProps = propsBuildResult.props;
      patchFlag = propsBuildResult.patchFlag;
      dynamicPropNames = propsBuildResult.dynamicPropames;
      const directives = propsBuildResult.directives;
      vnodeDirectives = directives && directives.length ? {} : undefined;
      if (propsBuildResult.shouldUseBlock) {
        shouldUseBolck = true;
      }
    }
    if (node.children.length > 0) {
      if (node.children.length === 1 && vnodeTag !== TELEPORT) {
        let child = node.children[0];
        const type = child.type;

        const hasDynamicTextChild = type === NodeTypes.INTERPOLATION || type === NodeTypes.COMPOUND_EXPRESSION;
        if (hasDynamicTextChild) {
          patchFlag |= PatchFlags.TEXT;
        }
        if (hasDynamicTextChild || type === NodeTypes.TEXT) {
          vnodeChildren = child;
        } else {
          vnodeChildren = node.children;
        }
      } else {
        vnodeChildren = node.children;
      }
    }
    
    if (patchFlag !== 0) {
      if (__DEV__) {
        if (patchFlag < 0) {
          vnodePatchFlag = patchFlag + `/* ${PatchFlagNames[patchFlag]} */`
        } else {
          const flagNames = Object.keys(PatchFlagNames).map(Number).filter(n => n > 0 && patchFlag & n)
            .map(n => PatchFlagNames[n]).join(', ')
          vnodePatchFlag = patchFlag + ` /* ${flagNames} */ `
        }
      } else {
        vnodePatchFlag = String(patchFlag);
      } 
      if (dynamicPropNames && dynamicPropNames.length) {
        vnodeDynamicProps = stringifyDynamicPropNames(dynamicPropNames);
      }
    }
    node.codegenNode = createVNodeCall(
      context,
      vnodeTag,
      vnodeProps,
      vnodeChildren,
      vnodePatchFlag,
      vnodeDynamicProps,
      vnodeDirectives,
      !!shouldUseBolck,
      false,
      isComponent,
      node.loc
    );
  }
}
export function resolveComponentType(node,context,ssr) {
  let { tag } = node;
  //动态组件
  const isExplicitDynamic = isComponentTag(tag);
  const isProp = findProp(node, 'is'); // <component is="app"/>

  if (isProp) {
    if (isComponentTag) {
      const exp = isProp.type === NodeTypes.ATTRIBUTE ? isProp.value && createSimpleExpression(
        isProp.value.content, true
      ) : isProp.value;

      if (exp) {
        return createCallExpression(context.helper(RESOLVE_DYNAMIC_COMPONENT), exp);
      }
    } else if (isProp.type === NodeTypes.ATTRIBUTE && isProp.value.content.startsWith('vue:')) {
      tag = isProp.value.content.slice(4);
    }
  }

  context.helper(RESOLVE_COMPONENT);
  context.components.add(tag);
  return {}
}
function isComponentTag(tag) {
  return tag === 'component' || tag === 'Component';
}

export function buildProps(node,context,props = node.props,isComponent,isDynamicComponent,ssr=false) {
  const { tag, loc:elementLoc, children } = node; //获取当前节点的标签名称,位置信息,子元素
  
  let properties = [];
  const mergeArgs = [];
  const runtimeDirectives = [];
  const hasChildren = children.length > 0;
  let shouldUseBlock = false;

  let patchFlag = 0;
  let hasRef = false;
  let hasClassBinding = false;
  let hasStyleBinding = false;
  let hasDydrationEventBinding = false;
  let hasDynamicKey = false;
  let hasVnodeHook = false;

  let dynamicPropames = [];

  const pushMergeArg = (arg) => {
    if (properties.length) {
      mergeArgs.push(
        createObjectExpression(
          dedupeProperties(properties),
          elementLoc
        )
      )
      properties = [];
    }
    if (arg) mergeArgs.push(arg);
  }

  const analyzePatchFlag = ({key,value}) => {
    if (isStaticExp(key)) {
      const name = key.content;
      const isEventHandler = isOn(name);
      if (
        isEventHandler && (!isComponent || isDynamicComponent) && name.toLowerCase() !== 'onclick'
        && name !== 'onUpdate:modelValue' && !isReservedProps(name)
      ) {
        hasDydrationEventBinding = true;   
      }
      if (isEventHandler && isReservedProps(name)) {
        hasVnodeHook = true;
      }
      if (
        value.type === NodeTypes.JS_CACHE_EXPRESSION || 
        ((value.type === NodeTypes.SIMPLE_EXPRESSION ||
          value.type === NodeTypes.COMPOUND_EXPRESSION) &&
          getConstantType(value,context) >0)
      ) {
        return;
      }

      if (name === 'ref') {
        hasRef = true;
      } else if (name === 'class') {
        hasClassBinding = true;
      } else if (name!=='key' && !dynamicPropames.includes(name)) {
        dynamicPropames.push(name);
      }

      if (isComponent && (name === 'class' || name === 'style') && !dynamicPropames.includes(name)) {
        dynamicPropames.push(name);
      }
    } else {
      hasDynamicKey = true;
    }
    
  }
  for (let i = 0; i < props.length; i++){
    const prop = props[i];
    if (prop.type === NodeTypes.ATTRIBUTE) { //静态属性
      const { loc, name, value } = prop; // 获取 prop的位置信息,prop为静态属性时，name为字符串，value为对象，其中value的content为属性之
      let isStatic = true;//静态标识为true
      if (name === 'ref') {
        hasRef = true;
        if (context.scoped.vFor > 0) { //存在vFor
          properties.push(
            createObjectProperty(
              createSimpleExpression('ref_for', true), // key
              createSimpleExpression('true') //value
            )
          )
        }
      }
      // 跳过component上的is
      if (name === "is" && (isComponentTag(tag) || (value && value.content.startsWith('vue:')))) {
        continue;
      }

      properties.push(
        createObjectProperty(
          createSimpleExpression(
            name,
            true, // 带括号的属性名则为false
            {l:1}
          ),
          createSimpleExpression(
            value ? value.content : '',
            isStatic,
            value? value.loc:loc
          )
        )
      )
    } else { // 指令
      
      const { name, arg, exp, loc } = prop;
      const isVBind = name === "bind";
      const isVOn = name === 'on'
      if (name === 'slot') {
        if (!isComponent) {
          console.error("error");
        }
        continue;
      }
      //跳过，通过ditecriveTransforms处理
      if (name === 'once' || name === 'memo') {
        continue;
      }
      if (name === 'is' || (isVBind && isStaticArgOf(arg,'is') && (isComponentTag(tag)))) {
        continue;
      }

      if (isVOn && ssr) {
        continue;
      }

      if (
        (isVBind && isStaticArgOf(arg, 'key')) || 
        (isVOn && hasChildren && isStaticArgOf(arg,'vue":before-update'))
      ) {
        shouldUseBlock = true;
      }

      if (isVBind && isStaticArgOf(arg, 'ref') && context.scopes.vFor > 0) {
        properties.push(
          createObjectProperty(
            createSimpleExpression('ref_for', true),
            createSimpleExpression('true')
          )
        )
      }
      // v-bind={},v-on={}//同时绑定多个值
      if (!arg && (isVBind || isVOn)) {
        hasDynamicKey = true;
        if (exp) {
          if (isVBind) {
            pushMergeArg();
            mergeArgs.push(exp);
          } else {
            pushMergeArg({
              type: NodeTypes.JS_CALL_EXPRESSION,
              loc,
              callee: context.helper(TO_HANDLERS),
              arguments: isComponent ? [exp] : [exp,'true']
            })
          }
        } else {
          console.log("error");
        }
        continue;
      }

      const directiveTransform = context.directiveTransforms[name];

      if (directiveTransform) {
        
      }
    }
  }

  let propsExpression;
  if (mergeArgs.length) {
    pushMergeArg();
    if (mergeArgs.length > 1) {
      propsExpression = createCallExpression(
        context.helper(MERGE_PROPS),
        mergeArgs,
        elementLoc
      )
    } else {
      propsExpression = mergeArgs[0];
    }
  } else if (properties.length) {
    propsExpression = createObjectExpression(
      dedupeProperties(properties),
      elementLoc
    )
  }

  if (hasDynamicKey) {
    patchFlag |= PatchFlags.FULL_PROPS;
  } else {
    if (hasClassBinding && !isComponent) {
      patchFlag |= PatchFlags.CLASS
    }
    if (hasStyleBinding && !isComponent) {
      patchFlag |= PatchFlags.STYLE;
    }
    if (dynamicPropames.length) {
      patchFlag |= PatchFlags.PROPS;
    }
    if (hasDydrationEventBinding) {
      patchFlag |= PatchFlags.HYDRATE_EVENTS;
    }
  }
  if (
    !shouldUseBlock && (patchFlag === 0 || patchFlag === PatchFlags.HYDRATE_EVENTS) &&
    (hasRef || hasVnodeHook)) {
    patchFlag |= PatchFlags.NEED_PATCH;
  }
  
  if (!context.inSSR && propsExpression) {
    switch (propsExpression.type) {
      case NodeTypes.JS_OBJECT_EXPRESSION:
        let classKeyIndex = -1;
        let styleKeyIndex = -1;
        let hasDynamicKey = false;
        for (let i = 0; i < propsExpression.properties.length; i++) {
          const key = propsExpression.properties[i].key;
          if (isStaticExp(key)) {
            if (key.content === 'class') {
              classKeyIndex = i;
            } else if (key.content === 'style') {
              styleKeyIndex = i;
            }
          } else if (!key.isHandlerKey) {
            hasDynamicKey = true;
          }
        }
        const classProp = propsExpression.properties[classKeyIndex];
        const styleProp = propsExpression.properties[styleKeyIndex];
        if (!hasDynamicKey) {
          if (classProp && !isStaticExp(classProp.value)) {
            classProp.value = createCallExpression(
              context.helper(NORMALIZE_CLASS),
              [classProp.value]
            )
          }
          if (
            styleProp &&
            (hasStyleBinding ||
              (styleProp.value.type === NodeTypes.SIMPLE_EXPRESSION &&
                styleProp.value.content.trim()[0] === '[') ||
              styleProp.value.type === NodeTypes.JS_ARRAY_EXPRESSION)
          ) {
            styleProp.value = createCallExpression(
              context.helper(NORMALIZE_STYLE),
              [styleProp.value]
            )
          }
        } else {
          propsExpression = createCallExpression(
            context.helper(NORMALIZE_PROPS),
            [propsExpression]
          )
        } break;
      case NodeTypes.JS_CALL_EXPRESSION:
        break;
      default:
        propsExpression = createCallExpression(
          context.helper(NORMALIZE_PROPS),
          [
            createCallExpression(context.helper(GUARD_REACTIVE_PROPS), [
              propsExpression
            ])
          ]
        )
        break;
    }
  }
  return {
    props: propsExpression,
    directives: [],
    patchFlag,
    dynamicPropames,
    shouldUseBlock
  }
}

function dedupeProperties(properties) {
  const knownProps = new Map();
  const deduped = [];

  for (let i = 0; i<properties.length; i++){
    const prop = properties[i];
    if (prop.key.type === NodeTypes.COMPOUND_EXPRESSION || !prop.key.isStatic) {
      deduped.push(prop);
      continue;
    }

    const name = prop.key.content;
    const existing = knownProps.get(name);
    if (existing) {
      if (name === 'style' || name === 'class' || isOn(name)) {
        mergeAsArray(existing,prop);
      }
    } else {
      knownProps.set(name, prop);
      deduped.push(prop);
    }
  }
  return deduped;
}
function mergeAsArray(existing,incoming) {
  if (existing.value.type === NodeTypes.JS_ARRAY_EXPRESSION) {
    existing.value.elements.push(incoming.value);
  } else {
    existing, value = createArrayExpression(
      [existing.value, incoming.value],
      existing.loc
    )
  }
}
function stringifyDynamicPropNames(props) {
  let propsNamesString = `[`
  for (let i = 0, l = props.length; i < l; i++) {
    propsNamesString += JSON.stringify(props[i])
    if (i < l - 1) propsNamesString += ', '
  }
  return propsNamesString + `]`
}