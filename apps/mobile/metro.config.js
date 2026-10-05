const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const defaultConfig = getDefaultConfig(projectRoot);

/**
 * Watch only the hoisted dependencies and the shared package.
 * Watching the whole repo also picks up android/.gradle and .cxx and
 * blows past the OS file-watch limit.
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  watchFolders: [
    path.resolve(workspaceRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'packages/shared'),
  ],
  resolver: {
    disableHierarchicalLookup: true,
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
    extraNodeModules: {
      '@nidavellir/shared': path.resolve(workspaceRoot, 'packages/shared'),
      react: path.resolve(workspaceRoot, 'node_modules/react'),
      'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
    },
    // Character Vault (react-native-filament) GLB models.
    assetExts: [...(defaultConfig.resolver?.assetExts || []), 'glb'],
  },
};

module.exports = mergeConfig(defaultConfig, config);
