// Learn more https://docs.expo.dev/guides/customizing-metro
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// @stayreco/shared is symlinked from ../packages, outside this app's folder.
config.watchFolders = [path.resolve(__dirname, '../packages/shared')];

module.exports = withNativeWind(config, { input: './global.css', inlineRem: 16 });
