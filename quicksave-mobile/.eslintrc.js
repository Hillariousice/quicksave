module.exports = {
  extends: [
    'expo', // Expo's default rules
    'plugin:@typescript-eslint/recommended', // Basic TS rules
    'plugin:@typescript-eslint/recommended-requiring-type-checking', // ⭐️ Strict Type-aware rules
    'prettier', // MUST BE LAST! Tells ESLint to ignore formatting rules that conflict with Prettier
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json', // ⭐️ Links ESLint to your TypeScript config
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    // Shows Prettier formatting issues as ESLint errors
    'prettier/prettier': 'error', 
    
    // Customize your strictness here
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-empty-interface': 'off',
    'react-hooks/exhaustive-deps': 'warn'
  },
  ignorePatterns: ['node_modules/', 'dist/', '.expo/', '*.js'], // Ignore JS config files
};