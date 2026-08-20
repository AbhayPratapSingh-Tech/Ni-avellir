const path = require('path');

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
};
