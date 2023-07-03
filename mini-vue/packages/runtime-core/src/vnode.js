import ShapeFlags from '../../shared/src/shapeFlags.js';
import { isRef } from '../../reactivity/src/index.js';
import {
  isString, isFunction, EMPTY_ARRAY,
} from '../../shared/src/general.js';
import { isObject } from '../../shared/src/index.js';
import { normalizeClass, normalizeStyle } from '../../shared/src/normalizeProp.js';

const isSuspense = () => false;
const isTeleport = () => false;
const currentScopeId = '';

const __FEATURE_SUSPENSE__ = false;

const normalizeKey = ({ key }) => (key != null ? key : null);
const currentRenderingInstance = {};
const normalizeRef = ({
  ref,
  ref_key,
  ref_for,
}) => {
  if (typeof ref === 'number') {
    ref = `${ref}`;
  }
  return (
    ref != null
      ? isString(ref) || isRef(ref) || isFunction(ref)
        ? {
          i: currentRenderingInstance, r: ref, k: ref_key, f: !!ref_for,
        }
        : ref
      : null
  );
};
export function guardReactiveProps(props) {
  if (!props) return null;
  return props;
}

export const blockStack = [];
export let currentBlock = null;

function createBaseVNode(
  type,
  props,
  children,
  patchFlag = 0,
  dynamicProps = null,
  shapeFlag = type === Fragment ? 0 : ShapeFlags.ELEMENT,
  isBlockNode,
  needFullChildrenNormalization = false,
) {
  const vnode = {
    __v_isVNode: true,
    __v_skip: true,
    type,
    props,
    key: props && normalizeKey(props),
    ref: props && normalizeRef(props),
    scopeId: currentScopeId,
    slotScopeIds: null,
    children,
    component: null,
    suspense: null,
    ssContent: null,
    ssFallback: null,
    dirs: null,
    transition: null,
    el: null,
    anchor: null,
    target: null,
    targetAnchor: null,
    staticCount: 0,
    shapeFlag,
    patchFlag,
    dynamicProps,
    dynamicChildren: null,
    appContext: null,
    ctx: currentRenderingInstance,
  };
  // 为设虚拟节点设置 shapeShape;
  if (Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  } else if (typeof children === 'string') {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
  }
  return vnode;
}

function _createVNode(type, props, children, patchFlag, dynamicProps, isBlockNode) {
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : __FEATURE_SUSPENSE__ && isSuspense(type)
      ? ShapeFlags.SUSPENSE
      : isTeleport(type)
        ? ShapeFlags.TELEPORT
        : isObject(type)
          ? ShapeFlags.STATEFUL_COMPONENT
          : isFunction(type)
            ? ShapeFlags.FUNCTIONAL_COMPONENT
            : 0;

  return createBaseVNode(
    type,
    props,
    children,
    patchFlag,
    dynamicProps,
    shapeFlag,
    isBlockNode,
  );
}
export const createVNode = _createVNode;

export function openBlock(disableTracking = false) {
  blockStack.push((currentBlock = disableTracking ? null : []));
}
export function closeBlock() {
  blockStack.pop();
  currentBlock = blockStack[blockStack.length - 1] || null;
}
export let isBlockTreeEnabled = 1;

export function setBlockTracking(value) {
  isBlockTreeEnabled += value;
}

function setupBlock(vnode) {
  vnode.dynamicChildren = isBlockTreeEnabled > 0 ? currentBlock || EMPTY_ARRAY : null;
  closeBlock();

  if (isBlockTreeEnabled > 0 && currentBlock) {
    currentBlock.push(vnode);
  }
  return vnode;
}

export function createElementBlock(
  type,
  props,
  children,
  patchFlag,
  dynamicProps,
  shapeFlag,
) {
  return setupBlock(
    createBaseVNode(
      type,
      props,
      children,
      patchFlag,
      dynamicProps,
      shapeFlag,
      true,
    ),
  );
}

export function createBlock(
  type,
  props,
  children,
  patchFlag,
  dynamicProps,
) {
  return setupBlock(
    createVNode(
      type,
      props,
      children,
      patchFlag,
      dynamicProps,
      true,
    ),
  );
}

export function isVNode(value) {
  return value ? value.__v_isVNode === true : false;
}

function getShapeFlag(type) {
  return typeof type === 'string'
    ? ShapeFlags.ELEMENT
    : ShapeFlags.STATEFUL_COMPONENT;
}

export const Text = Symbol('Text');
export const Fragment = Symbol('Fragment');
export const Static = Symbol.for('v-stc');

export function createTextVNode(text, flag) {
  return createVNode(Text, null, text, flag);
}
export function mergeProps(...args) {
  const ret = {};
  for (let i = 0; i < args.length; i++) {
    const toMerge = args[i];
    for (const key in toMerge) {
      if (key === 'class') {
        if (ret.class !== toMerge.class) {
          ret.class = normalizeClass([ret.class, toMerge.class]);
        }
      } else if (key === 'style') {
        ret.style = normalizeStyle([ret.style, toMerge.style]);
      } else if (key !== '') {
        ret[key] = toMerge[key];
      }
    }
  }
  return ret;
}
export {
  createBaseVNode as createElementVNode,
};
export function isSameVNodeType(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}
