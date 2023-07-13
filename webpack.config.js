const path = require('path');
const ESLintPlugin = require('eslint-webpack-plugin');

module.exports = {
  entry: './mini-vue/packages/vue/src/index.js',
  output: {
    path: path.resolve(__dirname, './mini-vue/packages/vue', 'dist'),
    clean: true,
    library: {
      name: 'MyLibrary',
      type: 'assign',
    },
  },
  devtool: 'source-map',
  target: ['web'],
  plugins: [
    new ESLintPlugin({
      fix: true,
      extensions: ['js'],
      emitError: false, // 设置为false则打包不报错
      exclude: ['node_modules', 'dist'],
    }),
  ],
};
