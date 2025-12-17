// eslint.config.js
import { defineConfig } from "eslint/config";

export default defineConfig([
	{
		ignores: ["dist/**","webapp/test/**","node_modules/**"],
		rules: {
			semi: "error",
			"prefer-const": "error",
		},
	},
]);
