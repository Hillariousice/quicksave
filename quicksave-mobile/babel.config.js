module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    // I DELETED THE MODULE-RESOLVER FROM HERE
    'react-native-reanimated/plugin', // must be last
  ],
};