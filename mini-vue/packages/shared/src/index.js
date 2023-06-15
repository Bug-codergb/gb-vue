import isObject from "./isObject.js";
import shapeFlags from "./shapeFlags.js";
import {PatchFlags} from "./patchFlags.js";
import { isReservedProps, hasChanged, isIntegerKey } from "./general.js";
import { makeMap } from "./makeMap.js";
import { isHTMLTag,isVoidTag } from "./domTagConfig.js";
export {
  makeMap,
  isObject,
  shapeFlags,
  isReservedProps,
  hasChanged,
  isIntegerKey,
  isHTMLTag,
  isVoidTag,
  PatchFlags
}