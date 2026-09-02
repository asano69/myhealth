import js from "@eslint/js";
import solid from "eslint-plugin-solid/configs/recommended";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";

// Flat config (ESLint 9+). Only src/ is linted; build output and
// node_modules are excluded by default (no need to list them here).
export default [
  js.configs.recommended,
  solid,
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        // Injected by vite.config.js's `define`; a build-time string
        // replacement, not a real runtime global.
        __APP_NAME__: "readonly",
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },
  {
    // Root-level config files (vite.config.js, etc.) run under Node,
    // not the browser, so they need Node globals like `process`.
    files: ["*.config.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    // Same as above, but for TypeScript config files (vite.config.ts):
    // espree (ESLint's default parser) can't parse TS syntax like type
    // imports or type annotations, so this swaps in the TS parser just
    // for this file pattern.
    files: ["*.config.ts"],
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.node,
      },
    },
  },
];
