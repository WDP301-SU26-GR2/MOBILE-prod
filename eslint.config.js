// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      // These React Compiler diagnostics mistake asynchronous RN data loaders and
      // native time APIs for synchronous render-side mutations. Keep the normal
      // Hooks dependency checks enabled while opting out of those false positives.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
    },
  }
]);
