// metro.geojson-transformer.js
// Load .geojson files as JSON while delegating all other files to the default transformer
let upstreamTransformer;
try {
  // Prefer Expo's default transformer to preserve web/env handling
  upstreamTransformer = require('@expo/metro-config/babel-transformer');
} catch (e) {
  try {
    // Fallback to the standard Metro transformer
    upstreamTransformer = require('metro-react-native-babel-transformer');
  } catch (e2) {
    throw new Error(
      "Unable to load an upstream Metro transformer. Install one of: '@expo/metro-config' (preferred) or 'metro-react-native-babel-transformer'"
    );
  }
}

function isGeoJson(filename) {
  return filename && filename.endsWith('.geojson');
}

module.exports.transform = function (props) {
  const { src, filename, options } = props;
  if (isGeoJson(filename)) {
    const jsonObj = JSON.parse(src);
    const code = `module.exports = ${JSON.stringify(jsonObj)};`;
    return upstreamTransformer.transform({ src: code, filename, options });
  }
  return upstreamTransformer.transform(props);
};


