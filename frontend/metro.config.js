// metro.config.js
// Extend Metro to support importing .geojson files by parsing them as JSON
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

module.exports = function () {
  const config = getDefaultConfig(__dirname);

  // Ensure .geojson is handled as a source file and transformed by our custom transformer
  config.resolver.sourceExts = Array.from(
    new Set([...(config.resolver.sourceExts || []), 'geojson'])
  );

  config.transformer = {
    ...(config.transformer || {}),
    babelTransformerPath: require.resolve('./metro.geojson-transformer.js'),
  };

  return withNativeWind(config, { input: './global.css' });
};


