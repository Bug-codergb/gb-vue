const templateAST = parse(template);
const jsAST = transform(templateAST);
const code = generate(jsAST);