// eslint.config.js
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
	globalIgnores([
		"!node_modules/", // unignore `node_modules/` directory
		"node_modules/*", // ignore its content
		"!dist/", // unignore `node_modules/mylibrary` directory
		"dist/*", // ignore its content
		"!webapp/test/", // unignore `node_modules/mylibrary` directory
		"webapp/test/*" // ignore its content
	]),
	{
		rules: {
			semi: "error",
			"prefer-const": "error",
			"accessor-pairs": "error",
			"block-scoped-var": "warn",
			"consistent-return": "warn",
			"curly": ["error", "all"],
			"default-case-last": "error",
			"default-case": "warn",
			"default-param-last": "error",
			"grouped-accessor-pairs": "error",
			"no-alert": "error",
			"no-caller": "error",
			"no-case-declarations": "error",
			"no-constant-binary-expression": "error",
			"no-constructor-return": "error",
			"no-div-regex": "error",
			"no-empty-pattern": "error",
			"no-eval": "error",
			"no-extend-native": "error",
			"no-extra-bind": "error",
			"no-extra-label": "error",
			"no-fallthrough": "error",
			"no-floating-decimal": "error",
			"no-global-assign": "error",
			"no-implicit-globals": ["error", { "lexicalBindings": true }],
			"no-implied-eval": "error",
			"no-iterator": "error",
			"no-labels": "error",
			"no-lone-blocks": "error",
			"no-loop-func": "error",
			"no-new-func": "error",
			"no-new-wrappers": "error",
			"no-new": "warn",
			"no-nonoctal-decimal-escape": "error",
			"no-octal-escape": "error",
			"no-octal": "error",
			"no-proto": "error",
			"no-redeclare": "warn",
			"no-return-assign": ["error", "always"],
			"no-script-url": "error",
			"no-self-assign": "error",
			"no-self-compare": "error",
			"no-sequences": "error",
			"no-unmodified-loop-condition": "error",
			"no-unused-expressions": "warn",
			"no-unused-labels": "error",
			"no-useless-catch": "error",
			"no-void": "error",
			"no-warning-comments": ["warn", { "location": "anywhere" }],
			"no-with": "error",
			"prefer-object-has-own": "off",
			"radix": ["error", "as-needed"],
			"require-await": "error",
			"wrap-iife": ["error", "any"],
			"yoda": "error"
		},
	},

]);
