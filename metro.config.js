const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration for HandyAi
 * https://reactnative.dev/docs/metro
 */
const defaultConfig = getDefaultConfig(__dirname);

const customConfig = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    assetExts: defaultConfig.resolver.assetExts.concat(['gguf', 'bin']),
  },
};

module.exports = mergeConfig(defaultConfig, customConfig);
