module.exports = {
  extends: '@lucasecdb',
  env: {
    node: true,
    es6: true,
  },
  parserOptions: {
    project: './tsconfig.json',
  },
  settings: {
    react: {
      version: 'none',
    },
  },
  rules: {
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
  },
}
