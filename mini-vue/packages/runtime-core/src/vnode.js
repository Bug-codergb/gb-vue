import ShapeFlags from '../../shared/src/shapeFlags.js';
import { isRef } from '../../reactivity/src/index.js';
import {
  isString, isFunction, EMPTY_ARRAY, isArray,
} from '../../shared/src/general.js';
import { PatchFlags, isObject } from '../../shared/src/index.js';
import { normalizeClass, normalizeStyle } from '../../shared/src/normalizeProp.js';
import { currentRenderingInstance } from './componentRenderContext.js';

const isSuspense = () => false;
const isTeleport = () => false;
const currentScopeId = '';

const __FEATURE_SUSPENSE__ = false;

export const InternalObjectKey = '__vInternal';

const normalizeKey = ({ key }) => (key != null ? key : null);

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

export const blockStack = [];// block栈存在block嵌套
export let currentBlock = null;// 数组｜null

// 创建一个虚拟节点
function createBaseVNode(
  type,
  props = null,
  children = null,
  patchFlag = 0, // 默认情况下patchFlag为0
  dynamicProps = null,
  shapeFlag = type === Fragment ? 0 : ShapeFlags.ELEMENT, // 默认情况下元素类型为普通元素element
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
    ctx: currentRenderingInstance, // 当前渲染组件实例 render函数执行之前
  };
  // 为设虚拟节点设置 shapeShape;
  if (Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  } else if (typeof children === 'string') {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
  }
  /*
    开始构建blockTree, isBlockTreeEnabled默认情况下为1,
    isBlockNode是否为block节点
  */
  if (
    isBlockTreeEnabled > 0
    && !isBlockNode
    && currentBlock
    && (vnode.patchFlag > 0 || shapeFlag & ShapeFlags.COMPONENT)
    && vnode.patchFlag !== PatchFlags.HYDRATE_EVENTS
  ) {
    currentBlock.push(vnode);
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

// 开始构建block
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
// 在opendBlock后，会通过createElementBlock创建虚拟节点
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
export const Comment = Symbol.for('v-cmt');

export function createTextVNode(text, flag) {
  return createVNode(Text, null, text, flag);
}
export function createCommentVNode(text = '', asBlock = false) {
  return asBlock ? (openBlock(), createBlock(Comment, null, text)) : createVNode(Comment, null, text);
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
export function normalizeVNode(child) {
  if (child == null || typeof child === 'boolean') {
    return createVNode(Comment);
  } if (isArray(child)) {
    return createVNode(
      Fragment,
      null,
      child.slice(),
    );
  } if (typeof child === 'object') {
    return cloneIfMounted(child);
  }
  return createVNode(Text, null, String(child));
}
export function cloneIfMounted(child) {
  return (child.el === null && child.patchFlag !== PatchFlags.HOISTED)
    || child.memo
    ? child
    : cloneVNode(child);
}

export function cloneVNode(
  vnode,
  extraProps,
  mergeRef = false,
) {
  // This is intentionally NOT using spread or extend to avoid the runtime
  // key enumeration cost.
  const {
    props, ref, patchFlag, children,
  } = vnode;
  const mergedProps = extraProps ? mergeProps(props || {}, extraProps) : props;
  const cloned = {
    __v_isVNode: true,
    __v_skip: true,
    type: vnode.type,
    props: mergedProps,
    key: mergedProps && normalizeKey(mergedProps),
    ref:
      extraProps && extraProps.ref
        ? mergeRef && ref
          ? isArray(ref)
            ? ref.concat(normalizeRef(extraProps))
            : [ref, normalizeRef(extraProps)]
          : normalizeRef(extraProps)
        : ref,
    scopeId: vnode.scopeId,
    slotScopeIds: vnode.slotScopeIds,
    children:
     patchFlag === PatchFlags.HOISTED && isArray(children)
       ? (children).map(deepCloneVNode)
       : children,
    target: vnode.target,
    targetAnchor: vnode.targetAnchor,
    staticCount: vnode.staticCount,
    shapeFlag: vnode.shapeFlag,
    // if the vnode is cloned with extra props, we can no longer assume its
    // existing patch flag to be reliable and need to add the FULL_PROPS flag.
    // note: preserve flag for fragments since they use the flag for children
    // fast paths only.
    patchFlag:
      extraProps && vnode.type !== Fragment
        ? patchFlag === -1 // hoisted node
          ? PatchFlags.FULL_PROPS
          : patchFlag | PatchFlags.FULL_PROPS
        : patchFlag,
    dynamicProps: vnode.dynamicProps,
    dynamicChildren: vnode.dynamicChildren,
    appContext: vnode.appContext,
    dirs: vnode.dirs,
    transition: vnode.transition,

    // These should technically only be non-null on mounted VNodes. However,
    // they *should* be copied for kept-alive vnodes. So we just always copy
    // them since them being non-null during a mount doesn't affect the logic as
    // they will simply be overwritten.
    component: vnode.component,
    suspense: vnode.suspense,
    ssContent: vnode.ssContent && cloneVNode(vnode.ssContent),
    ssFallback: vnode.ssFallback && cloneVNode(vnode.ssFallback),
    el: vnode.el,
    anchor: vnode.anchor,
    ctx: vnode.ctx,
    ce: vnode.ce,
  };

  return cloned;
}
function deepCloneVNode(vnode) {
  const cloned = cloneVNode(vnode);
  if (isArray(vnode.children)) {
    cloned.children = (vnode.children).map(deepCloneVNode);
  }
  return cloned;
}

export function normalizeChildren(vnode, children) {
  let type = 0;
  const { shapeFlag } = vnode;
  if (children == null) {
    children = null;
  } else if (isArray(children)) {
    type = ShapeFlags.ARRAY_CHILDREN;
  } else if (typeof children === 'object') {

  } else {
    type = ShapeFlags.SLOTS_CHILDREN;
  }
  vnode.shapeFlag |= type;
}
