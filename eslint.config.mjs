import js from "@eslint/js";
import globals from "globals";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores([
    "!node_modules/", // unignore `node_modules/` directory
    "node_modules/*", // ignore its content
    "!dist/", // unignore `node_modules/mylibrary` directory
    "dist/*", // ignore its content
    "!webapp/test/", // unignore `node_modules/mylibrary` directory
    "webapp/test/*" ,// ignore its content
    "eslint.config.mjs",
    "!webapp/localService/",
    "webapp/localService/*"
  ]),
  { files: ["**/*.{js,mjs,cjs}"], plugins: { js }, extends: ["js/recommended"],
   languageOptions: { globals: { "sap": true, "$": true ,"jQuery":true,"element":true,"hasher":true} } },
]);
