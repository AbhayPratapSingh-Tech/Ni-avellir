/** Root ESLint 8 config (this repo does not use ESLint 9 flat config). */
module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
  },
  extends: ['eslint:recommended'],
  ignorePatterns: [
    'node_modules/**',
    'dist/**',
    'build/**',
    'coverage/**',
    'apps/mobile/android/**',
    'apps/mobile/ios/**',
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  overrides: [
    {
      files: ['**/*.{ts,tsx}'],
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
  ],
};
