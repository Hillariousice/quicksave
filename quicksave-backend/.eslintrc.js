module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'plugin:@typescript-eslint/recommended',
  ],
  env: {
    node: true,
    jest: true,
  },
  rules: {
    // We turn off the 'any' warning because we used it to bypass Prisma cache issues!
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
  },
  ignorePatterns: ['dist/', 'node_modules/', 'jest.config.js'],
};