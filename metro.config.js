// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Exclude wasm files from being processed as JS modules
config.resolver.assetExts.push('wasm');

// For web builds, provide an empty module for expo-sqlite's web worker
// since we use AsyncStorage as a fallback on web
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName.includes('wa-sqlite')) {
    return {
      type: 'empty',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
