import { PatchFlags, isObject } from '../../../shared/src/index.js';
import {
  createVNodeCall,
  NodeTypes,
  ElementTypes,
  createCallExpression,
  createObjectExpression,
  createArrayExpression,
  createObjectProperty,
  createSimpleExpression,
} from '../ast.js';
import {
  isOn, isReservedProps, isSymbol,
} from '../../../shared/src/general.js';
import {
  GUARD_REACTIVE_PROPS,
  MERGE_PROPS,
  NORMALIZE_CLASS,
  NORMALIZE_PROPS,
  NORMALIZE_STYLE,
  RESOLVE_COMPONENT,
  RESOLVE_DIRECTIVE,
  RESOLVE_DYNAMIC_COMPONENT,
  TELEPORT,
  TO_HANDLERS,
} from '../runtimeHelpers.js';
import {
  findProp, isStaticArgOf, isStaticExp, toValidateId,
} from '../utils.js';
import { PatchFlagNames } from '../../../shared/src/patchFlags.js';

const directiveImportMap = new WeakMap();
const __DEV__ = true;
export const transformElement = (node, context) => function postTransformElement() {
  node = context.currentNode;
  if (
    !(node.type === NodeTypes.ELEMENT
        && (node.tagType === ElementTypes.ELEMENT
          || node.tagType === ElementTypes.COMPONENT)
    )
  ) {
    // 如果不是 **组件类型** 或者 **元素类型** 则直接返回
    return;
  }

  const { tag, props } = node; // 获取当前节点的标签名称，props
  const isComponent = node.tagType === ElementTypes.COMPONENT; // 判断是否为组件

  const vnodeTag = isComponent ? resolveComponentType(node, context) : `"${tag}"`;

  const isDynamicComponent = isObject(vnodeTag) && vnodeTag.callee === RESOLVE_DYNAMIC_COMPONENT;// 是否为动态组件<component is="App"/>

  let vnodeProps;
  let vnodeChildren;
  let vnodePatchFlag;
  let patchFlag = 0;
  let vnodeDynamicProps;
  let dynamicPropNames;
  let vnodeDirectives; // 当前节点上的指令，当指令存在时，且当前节点为vnode_call时需要调用withDirectives(runtiem-core)

  let shouldUseBolck = false;

  if (props.length > 0) {
    const propsBuildResult = buildProps(
      node,
      context,
      undefined, // 直接使用默认参数
      isComponent,
      isDynamicComponent,
    );

    console.log(propsBuildResult);

    vnodeProps = propsBuildResult.props;
    patchFlag = propsBuildResult.patchFlag;
    dynamicPropNames = propsBuildResult.dynamicPropames;
    const { directives } = propsBuildResult;

    // js_array_expression节点属性为elements[vModelText,{content:foo}]
    vnodeDirectives = directives && directives.length ? (createArrayExpression(
      directives.map((dir) => buildDirectiveArgs(dir, context)),
    )) : undefined;

    if (propsBuildResult.shouldUseBlock) {
      shouldUseBolck = true;
    }
  }
  if (node.children.length > 0) {
    if (node.children.length === 1 && vnodeTag !== TELEPORT) {
      const child = node.children[0];
      const { type } = child;

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
        vnodePatchFlag = `${patchFlag}/* ${PatchFlagNames[patchFlag]} */`;
      } else {
        const flagNames = Object.keys(PatchFlagNames).map(Number).filter((n) => n > 0 && patchFlag & n)
          .map((n) => PatchFlagNames[n])
          .join(', ');
        vnodePatchFlag = `${patchFlag} /* ${flagNames} */ `;
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
    node.loc,
  );
};
export function resolveComponentType(node, context, ssr) {
  let { tag } = node;
  // 动态组件
  const isExplicitDynamic = isComponentTag(tag); // 标签名称是否为 <component/>
  const isProp = findProp(node, 'is'); // <component is="app"/>

  if (isProp) { // 存在 is
    if (isExplicitDynamic) { // 动态组件
      const exp = isProp.type === NodeTypes.ATTRIBUTE ? isProp.value && createSimpleExpression(isProp.value.content, true) : isProp.exp;

      if (exp) { // is存在值，
        return createCallExpression(context.helper(RESOLVE_DYNAMIC_COMPONENT), [exp]);
      }
    } else if (isProp.type === NodeTypes.ATTRIBUTE && isProp.value.content.startsWith('vue:')) {
      tag = isProp.value.content.slice(4);
    }
  }

  const isDir = !isExplicitDynamic && findProp(node, 'is');
  if (isDir && isDir.exp) {
    console.error("v-is='component - name'已经被废弃了. 使用 is='vue:component - name'替代");

    return createCallExpression(
      context.helper(RESOLVE_DYNAMIC_COMPONENT, [isDir.exp]),
    );
  }

  context.helper(RESOLVE_COMPONENT);
  context.components.add(tag);
  return toValidateId(tag, 'component');
}
function isComponentTag(tag) {
  return tag === 'component' || tag === 'Component';
}

export function buildProps(
  node,
  context,
  props = node.props,
  isComponent,
  isDynamicComponent,
  ssr = false,
) {
  const { tag, loc: elementLoc, children } = node; // 获取当前节点的标签名称,位置信息,子元素

  let properties = []; // objectProperty{ key:simpleExpression,value:simpleExpression }
  const mergeArgs = [];
  const runtimeDirectives = [];
  const hasChildren = children.length > 0;
  let shouldUseBlock = false;

  let patchFlag = 0;
  let hasRef = false;
  let hasClassBinding = false;
  const hasStyleBinding = false;
  let hasDydrationEventBinding = false;
  let hasDynamicKey = false;
  let hasVnodeHook = false;

  const dynamicPropames = [];

  const pushMergeArg = (arg) => {
    if (properties.length) {
      mergeArgs.push(
        createObjectExpression(
          dedupeProperties(properties),
          elementLoc,
        ),
      );
      properties = [];
    }
    if (arg) mergeArgs.push(arg);
  };

  const analyzePatchFlag = ({ key, value }) => {
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
        value.type === NodeTypes.JS_CACHE_EXPRESSION
        || ((value.type === NodeTypes.SIMPLE_EXPRESSION
          || value.type === NodeTypes.COMPOUND_EXPRESSION) /* &&
          getConstantType(value,context) >0 */)
      ) {
        return;
      }

      if (name === 'ref') {
        hasRef = true;
      } else if (name === 'class') {
        hasClassBinding = true;
      } else if (name !== 'key' && !dynamicPropames.includes(name)) {
        dynamicPropames.push(name);
      }

      if (isComponent && (name === 'class' || name === 'style') && !dynamicPropames.includes(name)) {
        dynamicPropames.push(name);
      }
    } else {
      hasDynamicKey = true;
    }
  };
  for (let i = 0; i < props.length; i++) {
    const prop = props[i];
    if (prop.type === NodeTypes.ATTRIBUTE) { // 静态属性直接push到properties
      const { loc, name, value } = prop; // 获取 prop的位置信息,prop为静态属性时，name为字符串，value为对象，其中value的content为属性之
      const isStatic = true;// 静态标识为true
      if (name === 'ref') {
        hasRef = true;
        if (context.scoped.vFor > 0) { // 存在vFor
          properties.push(
            createObjectProperty(
              createSimpleExpression('ref_for', true), // key
              createSimpleExpression('true'), // value
            ),
          );
        }
      }
      // 跳过component上的is(vue 3.1 在 普通元素上可以添加is属性 value为 ** <tr is="vue:my-row-component" /> **)
      if (name === 'is' && (isComponentTag(tag) || (value && value.content.startsWith('vue:')))) {
        continue;
      }
      // 直接push
      properties.push(
        createObjectProperty(
          createSimpleExpression(
            name,
            true, // 带括号的属性名则为false
            { offset: 1, limit: 10000000 }, // 临时变量
          ),
          createSimpleExpression(
            value ? value.content : '',
            isStatic,
            value ? value.loc : loc,
          ),
        ),
      );
    } else { // 指令
      const {
        name, arg, exp, loc,
      } = prop; // name:指令的名称，bind,model,if,else-if,else,show,for,on
      const isVBind = name === 'bind';
      const isVOn = name === 'on';

      if (name === 'slot') {
        if (!isComponent) {
          console.error('error');
        }
        continue;
      }
      // 跳过，通过ditecriveTransforms处理
      if (name === 'once' || name === 'memo') {
        continue;
      }
      if (name === 'is' || (isVBind && isStaticArgOf(arg, 'is') && (isComponentTag(tag)))) {
        continue;
      }

      if (isVOn && ssr) {
        continue;
      }

      if (
        (isVBind && isStaticArgOf(arg, 'key'))
        || (isVOn && hasChildren && isStaticArgOf(arg, 'vue":before-update'))
      ) {
        shouldUseBlock = true;
      }

      if (isVBind && isStaticArgOf(arg, 'ref') && context.scopes.vFor > 0) {
        properties.push(
          createObjectProperty(
            createSimpleExpression('ref_for', true),
            createSimpleExpression('true'),
          ),
        );
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
              arguments: isComponent ? [exp] : [exp, 'true'],
            });
          }
        } else {
          console.log(`${isVBind ? 'v-bind' : 'v-on'}指令没有表达式`);
        }
        continue;
      }

      const directiveTransform = context.directiveTransforms[name];

      if (directiveTransform) {
        const { props, needRuntime } = directiveTransform(prop, node, context);
        console.log(props, needRuntime);
        !ssr && props.forEach(analyzePatchFlag);
        if (isVOn && arg && !isStaticExp(arg)) { // 非静态arg :[app]= app v-on:[event] = handler

        } else {
          properties.push(...props);
        }
        if (needRuntime) {
          runtimeDirectives.push(prop);
          if (isSymbol(needRuntime)) {
            directiveImportMap.set(prop, needRuntime);
          }
        }
      }
    }
  }
  let propsExpression;
  if (mergeArgs.length) { // mergeArgs.length > 0 则存在v-bind={},或者v-on={} 需要mergeProps包裹，详情在runtime-core/vnode
    pushMergeArg();// 如果需要合并，则第一步先将style:{},class:{}等属性通过dedupeProperties去重合并后，再将style:{},class:{}添加进去实现合并
    if (mergeArgs.length > 1) {
      propsExpression = createCallExpression(
        context.helper(MERGE_PROPS), // 调用mergProps合并(详情见runtime-core下的vnode)
        mergeArgs,
        elementLoc,
      );
    } else {
      propsExpression = mergeArgs[0];
    }
  } else if (properties.length) { // 不需要合并则直接将style,class去重后添加进去
    propsExpression = createObjectExpression(
      dedupeProperties(properties),
      elementLoc,
    );
  }

  if (hasDynamicKey) {
    patchFlag |= PatchFlags.FULL_PROPS;
  } else {
    if (hasClassBinding && !isComponent) {
      patchFlag |= PatchFlags.CLASS;
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
    !shouldUseBlock && (patchFlag === 0 || patchFlag === PatchFlags.HYDRATE_EVENTS)
    && (hasRef || hasVnodeHook)) {
    patchFlag |= PatchFlags.NEED_PATCH;
  }

  if (!context.inSSR && propsExpression) {
    switch (propsExpression.type) {
      // 当节点的类型为js_object_expression时，需要去normalizeProps,如class=[{active:flag},{bar:false},'container']
      case NodeTypes.JS_OBJECT_EXPRESSION:
        let classKeyIndex = -1;
        let styleKeyIndex = -1;
        let hasDynamicKey = false;
        for (let i = 0; i < propsExpression.properties.length; i++) {
          const { key } = propsExpression.properties[i];
          if (isStaticExp(key)) { // 静态类型的属性名称，class="",:class="{}",都为静态类型，:[key]="app"为动态类型
            if (key.content === 'class') { // 由于做过合并在dedupeProperties中，每一个properties的key都不一致，在遍历时不会覆盖classKeyIndex
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
        if (!hasDynamicKey) { // 通过normalize_class处理class(详情见shared下的normalizeProp)
          if (classProp && !isStaticExp(classProp.value)) {
            classProp.value = createCallExpression(
              context.helper(NORMALIZE_CLASS),
              [classProp.value],
            );
          }
          if (// 处理style(详情见shared下的normalizeProp)
            styleProp
            && (hasStyleBinding
              || (styleProp.value.type === NodeTypes.SIMPLE_EXPRESSION
                && styleProp.value.content.trim()[0] === '[')
              || styleProp.value.type === NodeTypes.JS_ARRAY_EXPRESSION)
          ) {
            styleProp.value = createCallExpression(
              context.helper(NORMALIZE_STYLE),
              [styleProp.value],
            );
          }
        } else {
          propsExpression = createCallExpression(
            context.helper(NORMALIZE_PROPS),
            [propsExpression],
          );
        } break;
      case NodeTypes.JS_CALL_EXPRESSION:
        break;
      default:
        propsExpression = createCallExpression(
          context.helper(NORMALIZE_PROPS),
          [
            createCallExpression(context.helper(GUARD_REACTIVE_PROPS), [
              propsExpression,
            ]),
          ],
        );
        break;
    }
  }
  return {
    props: propsExpression,
    directives: runtimeDirectives,
    patchFlag,
    dynamicPropames,
    shouldUseBlock,
  };
}

function dedupeProperties(properties) {
  // console.log(json(properties))
  const knownProps = new Map();
  const deduped = [];

  for (let i = 0; i < properties.length; i++) {
    const prop = properties[i];
    if (prop.key.type === NodeTypes.COMPOUND_EXPRESSION || !prop.key.isStatic) {
      deduped.push(prop);
      continue;
    }

    const name = prop.key.content;
    // console.log(name) // onClick, class,style
    const existing = knownProps.get(name);
    if (existing) {
      if (name === 'style' || name === 'class' || isOn(name)) {
        mergeAsArray(existing, prop);
      }
    } else {
      knownProps.set(name, prop);
      deduped.push(prop);
    }
  }
  return deduped;
}
function mergeAsArray(existing, incoming) {
  if (existing.value.type === NodeTypes.JS_ARRAY_EXPRESSION) {
    existing.value.elements.push(incoming.value);
  } else {
    existing.value = createArrayExpression(
      [existing.value, incoming.value],
      existing.loc,
    );
  }
}
function stringifyDynamicPropNames(props) {
  let propsNamesString = '[';
  for (let i = 0, l = props.length; i < l; i++) {
    propsNamesString += JSON.stringify(props[i]);
    if (i < l - 1) propsNamesString += ', ';
  }
  return `${propsNamesString}]`;
}

export function buildDirectiveArgs(dir, context) {
  const dirArgs = [];
  const runtim = directiveImportMap.get(dir);
  if (runtim) {
    dirArgs.push(context.helperString(runtim));
  } else {
    context.helper(RESOLVE_DIRECTIVE);
    context.directives.add(dir.name);
    dirArgs.push(toValidateId(dir.name, 'directive'));
  }
  const { loc } = dir;
  if (dir.exp) {
    dirArgs.push(dir.exp);
  }
  if (dir.arg) {
    if (!dir.exp) {
      dirArgs.push('void 0');
    }
    dirArgs.push(dir.arg);
  }
  if (Object.keys(dir.modifiers).length) {
    if (!dir.arg) {
      if (!dir.exp) {
        dirArgs.push('void 0');
      }
      dirArgs.push('void 0');
    }
    const trueExpression = createSimpleExpression('true', false, loc);
    dirArgs.push(
      createObjectExpression(
        dir.modifiers.map((modifier) => createObjectProperty(modifier, trueExpression)),
        loc,
      ),
    );
  }
  return createArrayExpression(dirArgs, dir.loc);
}
