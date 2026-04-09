import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import astro from 'eslint-plugin-astro';
import prettierRecommended from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // jsx-a11y solo en TS/JS — no es compatible con el AST de Astro
  // eslint-plugin-astro tiene sus propias reglas de a11y para .astro
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    ...jsxA11y.flatConfigs.recommended,
  },

  ...astro.configs.recommended,
  prettierRecommended,

  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': 'warn',
    },
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
    },
  },

  {
    // prettier/prettier conflicta con el frontmatter de Astro
    files: ['**/*.astro'],
    rules: {
      'prettier/prettier': 'off',
    },
  },

  {
    ignores: ['dist/**', 'node_modules/**', '.astro/**'],
  },
);
