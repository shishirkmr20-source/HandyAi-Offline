module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['.'],
        alias: {
          '@components': './src/components',
          '@screens': './src/screens',
          '@services': './src/services',
          '@store': './src/store',
          '@theme': './src/theme',
          '@models': './src/models',
          '@utils': './src/utils',
          '@': './src',
        },
      },
    ],
  ],
};
