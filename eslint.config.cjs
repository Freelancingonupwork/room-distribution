// eslint.config.cjs — ESLint v9 flat config (CommonJS) for TypeScript-only

const tseslint = require('typescript-eslint');
const pluginPrettier = require('eslint-plugin-prettier');
const prettier = require('eslint-config-prettier');
const simpleImportSort = require('eslint-plugin-simple-import-sort');

module.exports = [
  // 1) Global ignores (replaces .eslintignore)
  { ignores: ['dist', 'node_modules', '**/*.config.*', '**/.eslintrc.*'] },

  // 2) TS recommended rule sets (already scoped internally to TS/TSX files)
  ...tseslint.configs.recommended,

  // 3) Turn off formatting rules that conflict with Prettier
  prettier,

  // 4) Project-specific rules, scoped to TS files only
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      prettier: pluginPrettier,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      // Show Prettier issues in Problems panel
      'prettier/prettier': 'warn',

      // TS hygiene
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],

      // Keep imports sorted
      'simple-import-sort/imports': 'warn',
      'simple-import-sort/exports': 'warn',
    },
  },
];
