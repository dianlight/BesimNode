import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
//import eslintPluginPrettier from "eslint-plugin-prettier";
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');


// root: true

export default [
  { root: true },
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
];