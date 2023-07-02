const ESLintPlugin = require('eslint-webpack-plugin');

module.exports = {
  devtool: 'source',
  plugins: [
    new ESLintPlugin({
      fix: true,
      extensions: ['js', 'json'],
      exclude: 'node_modules',
    }),
  ],
};
