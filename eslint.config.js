import globals from 'globals';
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import unusedImports from 'eslint-plugin-unused-imports';

export default [
  { ignores: ['dist/**', 'node_modules/**', 'server/**', 'public/**'] },

  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'unused-imports': unusedImports,
    },
    rules: {
      // Les règles de base étaient neutralisées par la configuration précédente :
      // `rules` écrasait l'objet issu des presets. Elles sont réintroduites ici.
      ...js.configs.recommended.rules,
      ...react.configs.flat.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      'react/react-in-jsx-scope': 'off',
      // L'interface est intégralement en français : l'apostrophe est partout
      // dans le texte, et l'échapper nuirait à la lisibilité du JSX.
      'react/no-unescaped-entities': 'off',
      'react/prop-types': 'off',
      'react/no-unknown-property': ['error', { ignore: ['cmdk-input-wrapper', 'toast-close'] }],

      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
      ],

      eqeqeq: ['error', 'smart'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
    },
  },

  {
    // Les composants shadcn/ui sont importés tels quels : on n'y applique que
    // les règles de correction, pas les conventions de style du projet.
    files: ['src/components/ui/**/*.jsx'],
    rules: { 'react-refresh/only-export-components': 'off', 'no-console': 'off' },
  },
];
