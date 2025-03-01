module.exports = {
  extends: [
    'react-app',
    'react-app/jest',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/ban-ts-comment': 'warn',
    'prettier/prettier': ['error', {
      singleQuote: true,
      trailingComma: 'es5',
      printWidth: 100,
      semi: true,
      endOfLine: 'auto'
    }]
  }
}; 