import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import prettier from 'eslint-config-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tseslint from 'typescript-eslint';

export default defineConfig({
  files: ['**/*.{js,ts}'],
  ignores: ['**/node_modules/**', '**/dist/**'],

  extends: [
    js.configs.recommended,
    tseslint.configs.recommendedTypeChecked,
    tseslint.configs.strictTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    vitest.configs.recommended,
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
        '@typescript-eslint': tseslint.plugin,
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
  ],
});
