// webpack.config.js
// Customize Expo Webpack to import .geojson as JSON
const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Ensure .geojson is resolved
  if (!config.resolve) config.resolve = {};
  config.resolve.extensions = Array.from(
    new Set([...(config.resolve.extensions || []), '.geojson'])
  );

  // Treat .geojson like JSON (no special loader needed if type: 'json')
  // For compatibility across webpack versions, add a rule if needed.
  config.module = config.module || { rules: [] };
  const rules = config.module.rules || [];
  rules.push({
    test: /\.geojson$/i,
    type: 'json',
  });
  config.module.rules = rules;

  return config;
};


