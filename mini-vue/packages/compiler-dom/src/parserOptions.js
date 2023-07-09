import { TextModes } from '../../compiler-core/src/index.js';
import { isHTMLTag, isVoidTag, makeMap } from '../../shared/src/index.js';

const isRawTextContainer = makeMap(
  'style,iframe,script,noscript',
  true,
);
export const DOMNamespaces = {
  HTML: 0 /* Namespaces.HTML */,
  SVG: 1,
  MATH_ML: 2,
};
export const parserOptions = {
  isVoidTag,
  isNativeTag: (tag) => isHTMLTag(tag),
  isPreTag: (tag) => tag === 'pre',
  getTextMode({ tag, ns }) {
    if (ns === DOMNamespaces.HTML) {
      if (tag === 'textarea' || tag === 'title') {
        return TextModes.RCDATA;
      }
      if (isRawTextContainer(tag)) {
        return TextModes.RAWTEXT;
      }
    }
    return TextModes.DATA;
  },
  getNamespace(tag, parent) {
    const ns = parent ? parent.ns : DOMNamespaces.HTML;
    if (parent && ns === DOMNamespaces.MATH_ML) {

    } else if (parent && ns === DOMNamespaces.SVG) {

    }
    if (ns === DOMNamespaces.HTML) {
      if (tag === 'svg') {
        return DOMNamespaces.SVG;
      }
      if (tag === 'match') {
        return DOMNamespaces.MATH_ML;
      }
    }
    return ns;
  },
};
