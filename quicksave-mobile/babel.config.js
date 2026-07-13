module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-worklets-core/plugin', // Add this line
      'react-native-reanimated/plugin',    // Reanimated MUST always be last
    ],
  };
};