const ESLintPlugin = require('eslint-webpack-plugin');
module.exports = {
  plugins: [
    new ESLintPlugin({
      fix: true,
      extensions: ['js', 'json'],
      exclude:'node_modules'
    })
  ]
}