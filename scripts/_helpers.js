const dotenv = require('dotenv');
const fs = require('fs');

/**
 * Loads environment variables from .env and .env.local,
 * with .env.local taking precedence over .env.
 */
function loadEnvironmentVariables() {
  try {
    // Parse .env
    const envConfig = fs.existsSync('.env') ? dotenv.parse(fs.readFileSync('.env')) : {};

    // Parse .env.local
    const localEnvConfig = fs.existsSync('.env.local') ? dotenv.parse(fs.readFileSync('.env.local')) : {};

    // Merge configurations (.env.local overrides .env)
    const combinedConfig = { ...envConfig, ...localEnvConfig };

    // Set process.env variables manually
    Object.keys(combinedConfig).forEach((key) => {
      process.env[key] = combinedConfig[key];
    });

    console.log('Environment variables loaded successfully.');
  } catch (error) {
    console.error('Error loading environment variables:', error.message);
  }
}

module.exports = { loadEnvironmentVariables };
