import { NO } from "../../shared/src/general.js";
export const defaultParserOptions = {
  delimiters: ["{{", "}}"],
  isVoidTag:NO,
  isPreTag: NO,
}
export function baseParser(content,options) {
  const context = createParserContext(content, options);
  const start = getCursor(context);
  return;
}
function createParserContext(content,rawOptions) {
  const options = Object.assign({}, defaultParserOptions);
  for (let key in rawOptions) {
    options[key] = rawOptions[key] === undefined ? defaultParserOptions[key] : rawOptions[key];
  }
  return {
    options,
    column: 1,
    line: 0,
    offset: 0,
    originalSource: content,
    source: content,
    inPre: false,//未知
    inVPrev:false//未知
  }
}
function getCursor(context) {
  const { column, line, offset } = context;
  return {
    column,
    line,
    offset
  }
}