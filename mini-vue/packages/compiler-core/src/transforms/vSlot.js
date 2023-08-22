import {
  ElementTypes,
  NodeTypes,
  createObjectProperty,
  createSimpleExpression,
  createConditionalExpression,
  createObjectExpression,
  createCallExpression,
  createArrayExpression,
  createFunctionExpression,
} from '../ast.js';
import { WITH_CTX, CREATE_SLOTS } from '../runtimeHelpers.js';
import { findDir, isStaticExp, isTemplateNode } from '../utils.js';

import { SlotFlags, slotFlagsText } from '../../../shared/src/slotFlags.js';

const defaultFallback = createSimpleExpression('undefined', false);

export const trackSlotScoped = (node, context) => {
  if (
    node.type === NodeTypes.ELEMENT
    && (
      node.tagType === ElementTypes.COMPONENT
      || node.tagType === ElementTypes.TEMPLATE
    )
  ) {
    const vSlot = findDir(node, 'slot');
    if (vSlot) {
      const slotProps = vSlot.exp;
      context.scopes.vSlot++;
      return () => {
        context.scopes.vSlot--;
      };
    }
  }
};

const buildClientSlotFn = (props, children, loc) => createFunctionExpression(
  props,
  children,
  false /* newline */,
  true /* isSlot */,
  children.length ? children[0].loc : loc,
);

export function buildSlots(node, context, buildSlotFn = buildClientSlotFn) {
  context.helper(WITH_CTX);
  const { children, loc } = node;
  const slotsProperties = [];
  const dynamicSlots = [];
  let hasDynamicSlots = context.scopes.vSlot > 0 || context.scopes.vFor > 0;

  const onComponentSlot = findDir(node, 'slot', true);
  console.log(onComponentSlot, 'onComponentSlot');
  if (onComponentSlot) {
    const { arg, exp } = onComponentSlot;
    if (arg && !isStaticExp(arg)) {
      hasDynamicSlots = true;
    }
    slotsProperties.push(
      createObjectProperty(
        arg || createSimpleExpression('default', true),
        buildSlotFn(exp, children, loc),
      ),
    );
  }

  let hasTemplateSlots = false;
  let hasNamedDefaultSlot = false;
  const implicitDefaultChildren = [];
  const seenSlotNames = new Set();
  let conditionalBranchIndex = 0;

  for (let i = 0; i < children.length; i++) {
    const slotElement = children[i];
    let slotDir;
    if (!isTemplateNode(slotElement) || !(slotDir = findDir(slotElement, 'slot', true))) {
      if (slotElement.type !== NodeTypes.COMMENT) {
        implicitDefaultChildren.push(slotElement);
      }
      continue;
    }
    hasTemplateSlots = true;
    const { children: slotChildren, loc: slotLoc } = slotElement;
    const {
      arg: slotName,
      exp: slotProps,
      loc: dirLoc,
    } = slotDir;

    let staticSlotName;
    if (isStaticExp(slotName)) {
      staticSlotName = slotName ? slotName.content : 'default';
    } else {
      hasDynamicSlots = true;
    }

    const slotFunction = buildSlotFn(slotProps, slotChildren, slotLoc);
    console.log(slotFunction);
    let vIf;
    let vElse;
    let vFor;

    if ((vIf = findDir(slotElement, 'if'))) {
      hasDynamicSlots = true;
      dynamicSlots.push(
        createConditionalExpression(
          vIf.exp,
          buildDynamicSlot(slotName, slotFunction, conditionalBranchIndex++),
          defaultFallback,
        ),
      );
    } else if (
      (vElse = findDir(slotElement, /^else(-if)?$/, true /* allowEmpty */))
    ) {

    } else {
      if (staticSlotName) {
        if (seenSlotNames.has(staticSlotName)) {
          console.error('11');
          continue;
        }
        seenSlotNames.add(staticSlotName);
        if (staticSlotName === 'default') {
          hasNamedDefaultSlot = true;
        }
      }
      slotsProperties.push(createObjectProperty(slotName, slotFunction));
      console.log(slotsProperties);
    }
  }
  if (!onComponentSlot) {
    const buildDefaultSlotProperty = (props, children) => {
      const fn = buildSlotFn(props, children, loc);
      return createObjectProperty('default', fn);
    };
    if (!hasTemplateSlots) {
      slotsProperties.push(buildDefaultSlotProperty(undefined, children));
    } else if (implicitDefaultChildren.length && implicitDefaultChildren.some((node) => isNonWhitespaceContent(node))) {
      if (hasNamedDefaultSlot) {
        console.error('slot error');
      } else {
        slotsProperties.push(
          buildDefaultSlotProperty(undefined, implicitDefaultChildren),
        );
      }
    }
  }
  const slotFlag = hasDynamicSlots
    ? SlotFlags.DYNAMIC
    : hasForwardedSlots(node.children)
      ? SlotFlags.FORWARDED
      : SlotFlags.STABLE;

  let slots = createObjectExpression(
    slotsProperties.concat(
      createObjectProperty(
        '_',
        // 2 = compiled but dynamic = can skip normalization, but must run diff
        // 1 = compiled and static = can skip normalization AND diff as optimized
        createSimpleExpression(
          `${slotFlag} /* ${slotFlagsText[slotFlag]} */`,
          false,
        ),
      ),
    ),
    loc,
  );
  if (dynamicSlots.length) {
    slots = createCallExpression(context.helper(CREATE_SLOTS), [
      slots,
      createArrayExpression(dynamicSlots),
    ]);
  }

  return {
    slots,
    hasDynamicSlots,
  };
}

function hasForwardedSlots(children) {
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    switch (child.type) {
      case NodeTypes.ELEMENT:
        if (
          child.tagType === ElementTypes.SLOT
          || hasForwardedSlots(child.children)
        ) {
          return true;
        }
        break;
      case NodeTypes.IF:
        if (hasForwardedSlots(child.branches)) return true;
        break;
      case NodeTypes.IF_BRANCH:
      case NodeTypes.FOR:
        if (hasForwardedSlots(child.children)) return true;
        break;
      default:
        break;
    }
  }
  return false;
}
function isNonWhitespaceContent(node) {
  if (node.type !== NodeTypes.TEXT && node.type !== NodeTypes.TEXT_CALL) { return true; }
  return node.type === NodeTypes.TEXT
    ? !!node.content.trim()
    : isNonWhitespaceContent(node.content);
}
function buildDynamicSlot(
  name,
  fn,
  index,
) {
  const props = [
    createObjectProperty('name', name),
    createObjectProperty('fn', fn),
  ];
  if (index != null) {
    props.push(
      createObjectProperty('key', createSimpleExpression(String(index), true)),
    );
  }
  return createObjectExpression(props);
}
