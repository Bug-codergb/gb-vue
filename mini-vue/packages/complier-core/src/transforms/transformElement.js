import { isObject } from "../../../shared/src/index.js";
import {
  isOn, isReservedProps
} from "../../../shared/src/general.js";
import { RESOLVE_COMPONENT, RESOLVE_DYNAMIC_COMPONENT } from "../runtimeHelpers.js";
import {
  NodeTypes, ElementTypes, createCallExpression,createObjectExpression, createArrayExpression, createObjectProperty, createSimpleExpression
} from "../ast.js";
import { findProp, isStaticExp } from "../utils.js";
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
      const propsBuildResult = buildProps();
    }
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

export function buildProps(node,context,props,isComponent,isDynamicComponent,ssr=false) {
  const { tag, loc, children } = node;
  
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

  const pushMergeArg = (agr) => {
    if (properties.length) {
      mergeArgs.push(
        createObjectExpression()
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
    if (prop.type === NodeTypes.ATTRIBUTE) {
      const { loc, name, value } = prop;
      let isStatic = true;
      if (name === 'ref') {
        hasRef = true;
        if (context.scoped.vFor > 0) {
          properties.push(
            createObjectProperty(
              createSimpleExpression('ref_for', true),
              createSimpleExpression('true')
            )
          )
        }
      }

    }
  }
}

function dedupeProperties(properties) {
  const knownProps = new Map();
  const deduped = [];

  for (let i = 0; i<properties.length; i++){
    const prop = properties[i];
    if (prop.key.type === NodeTypes.COMPOUND_EXPRESSION || !prop.key, isStatic) {
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