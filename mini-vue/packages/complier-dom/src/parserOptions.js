import { isHTMLTag, isVoidTag } from "../../shared/src/index.js";
export const parserOptions = {
  isVoidTag,
  isNativeTag: tag => isHTMLTag(tag),
  isPreTag: tag => tag === 'pre',
}