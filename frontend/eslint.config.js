// eslint.config.js
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  // Ignora pastas e artefatos de build
  globalIgnores([
    'node_modules',
    'dist',
    'build',
    'coverage',
    '**/*.min.*',
  ]),
  {
    files: ['**/*.{js,jsx}'],
    // Bases + React (hooks) + Vite (react-refresh)
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        // habilita import.meta (Vite)
        'import.meta': 'readonly',
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      // Caso use o JSX runtime automático do React 17+
      react: { version: 'detect' },
    },
    rules: {
      // Deixe variáveis iniciadas por maiúsculas ou _ sem acusar "unused"
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
      // Útil no Vite para evitar hot reload quebrado
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Opcionalmente silencie console em dev (descomente se quiser bloquear)
      // 'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
]);
