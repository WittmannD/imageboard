import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import vitest from '@vitest/eslint-plugin';
import tseslint, { configs, plugin } from 'typescript-eslint';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

export default tseslint.config(
  eslint.configs.recommended,
  configs.recommendedTypeChecked,
  configs.strictTypeChecked,
  configs.stylisticTypeChecked,
  vitest.configs.recommended,
  {
    ignores: ['**/node_modules/**', '**/dist/**'],
  },
  {
    languageOptions: {
      parserOptions: {
        // projectService: true,
        projectService: {
          allowDefaultProject: ['*.cjs', '*.mjs'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': plugin,
      'simple-import-sort': simpleImportSort,
      vitest,
    },
    rules: {
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      'simple-import-sort/imports': [
        'warn',
        {
          groups: [['^node:', '^@?\\w', '^\\u0000'], ['^(@hdotu)'], ['^\\.']],
        },
      ],
      'simple-import-sort/exports': 'warn',
    },
  },
  prettier,
);
