module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['react-native-worklets-core/plugin', { processNestedWorklets: true }],
    // Reanimated must be listed last.
    ['react-native-reanimated/plugin', { processNestedWorklets: true }],
  ],
};
