/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // 👉 ⭐️ THE ULTIMATE WINDOWS FIX
  // By stripping out the complex Regex and just using simple string matching, 
  // we bypass the Windows backslash (\) vs forward slash (/) routing bugs!
  testMatch: [
     '<rootDir>/src/__tests__/**/*.[jt]s?(x)'
  ],

 transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-reanimated)'
  ],
};