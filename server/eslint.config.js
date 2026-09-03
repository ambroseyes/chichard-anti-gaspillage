import globals from 'globals';
import js from '@eslint/js';

export default [
  { ignores: ['node_modules/**', 'var/**', 'prisma/migrations/**'] },
  {
    files: ['**/*.js', '**/*.mjs'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error',
      'no-return-await': 'error',
    },
  },
  {
    files: ['scripts/**/*.mjs', 'tests/**/*.js'],
    rules: { 'no-console': 'off' },
  },
];
