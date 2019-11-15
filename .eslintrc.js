module.exports = {
  env: {
    browser: true, // Allow use of document, window
    node: true, // Allow use process ...,
    es6: true
  },
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 8,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
      modules: true
    }
  },
  plugins: ['prettier', 'react'],
  extends: ['prettier', 'eslint:recommended', 'plugin:react/recommended'],
  rules: {
    'prettier/prettier': 0,
    // Active it later
    'react/prop-types': 'off',
    //
    semi: 'off',
    'no-multiple-empty-lines': 'off',
    'brace-style': 'off',
    'no-return-assign': 'off',
    'promise/param-names': 1,
    'comma-dangle': 'off',
    'space-before-function-paren': 0,
    'no-unused-vars': 0, // @todo remove this
    'no-console': 0,
    'promise/param-names': 0
  },
  settings: {
    react: {
      version: '16.2.0'
    }
  }
};
