module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: 'airbnb-base',
  overrides: [
    {
      env: {
        node: true,
      },
      files: [
        '.eslintrc.{js,cjs}',
      ],
      parserOptions: {
        sourceType: 'script',
      },
    },
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'import/extensions': 'off',
    'import/prefer-default-export': 'off',
    'no-console': 'off',
    'no-empty': 'off',
    'no-bitwise': 'off',
    camelcase: 'off',
    'no-underscore-dangle': 'off',
    'no-param-reassign': 'off',
    'no-nested-ternary': 'off',
    'default-param-last': 'off',
    'no-restricted-syntax': 'off',
    'no-plusplus': 'off',
    'no-continue': 'off',
    'max-len': 'off',
    'no-new-func': 'off',
    'no-return-assign': 'off',
    'use-isnan': 'off',
    'import/no-cycle': 'off',
    'no-use-before-define': 'warn',
    'no-lonely-if': 'off',
    'no-multi-assign': 'off',
  },
};
