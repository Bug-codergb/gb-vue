const baseParse=(content)=>{
  const ctx = createParserContext(content);
  parseChildren(ctx, []);
}
const createParserContext = (content) => {
  return {
    source:content
  }
}
const parseChildren = (ctx,ancestors) => {
  const nodes = [];
  while (!isEnd()) {
    
  }
}
const advanceBy = (ctx,numberOfCharacters) => {
  ctx.source = ctx.source.slice(numberOfCharacters);
}