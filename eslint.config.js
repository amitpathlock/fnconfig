// eslint.config.js
import { defineConfig } from "eslint/config";

export default defineConfig([
	js.configs.recommended,
	{
		// This configuration applies to all files except those in 'myFolder'
		files: ["**/*.js"], // applies to all JS files first
		ignores: [
			// For non-global ignores, a full glob pattern is required to match files in subdirectories
			'dist/**',
			'webapp/test/**',
			'node_modules/**'
		],
		rules: {
			semi: "error",
			"prefer-const": "error",
		},
	},
]);
