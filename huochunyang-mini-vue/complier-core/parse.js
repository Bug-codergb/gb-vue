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
  while (!isEnd(ctx,ancestors)) {
    let node;
    let s = ctx.source;
    if (s.startsWidth("{{")) {//在这里需要处理插值语法
      
    } else if(s[0]==="<"){
      if (s[1] === "/") {
        //处理结束标签
        if (/[a-z]/i.test(s[2])) {
        
        }
      } else if(/[a-z]/i.test(s[1])){
        //开始标签
      }
    }
  }
}
const isEnd = (ctx,ancestors) => {
  const s = ctx.source;
  if (ctx.source.startsWidth("</")) {
    for (let i = ancestors.length - 1; i >= 0; --i){
      if (startsWidthEndTagOpen(ß)) {
         
       } 
    }
  }
}
const startsWidthEndTagOpen=(source,tag) => {
  return source.startsWidth("</") && source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase();
}
const advanceBy = (ctx,numberOfCharacters) => {
  ctx.source = ctx.source.slice(numberOfCharacters);
}