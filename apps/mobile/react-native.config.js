const path = require('path');

/**
 * React Native autolinking config.
 *
 * Firebase packages stay in package.json for future push notifications, but iOS
 * linking is disabled for now: RNFirebase needs `use_frameworks! :static`, which
 * currently breaks RN 0.77 simulator builds. Re-enable when implementing push.
 */
module.exports = {
  reactNativePath: path.resolve(__dirname, 'node_modules/react-native'),
  project: {
    android: {
      sourceDir: './android',
      packageName: 'com.nidavellir',
    },
    ios: {
      sourceDir: './ios',
    },
  },
  dependencies: {
    '@react-native-firebase/app': {
      platforms: {
        android: null,
        ios: null,
      },
    },
    '@react-native-firebase/messaging': {
      platforms: {
        android: null,
        ios: null,
      },
    },
  },
};
