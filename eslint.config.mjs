import js from '@eslint/js';
import tseslint from 'typescript-eslint';

const browserGlobals = {
  window: 'readonly',
  document: 'readonly',
  crypto: 'readonly',
  TextEncoder: 'readonly',
  Uint8Array: 'readonly',
  console: 'readonly'
};

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      globals: browserGlobals,
      parserOptions: {
        ecmaFeatures: { jsx: true }
      }
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn'
    }
  }
];
