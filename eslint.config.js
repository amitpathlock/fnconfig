// eslint.config.js
import eslint from '@eslint/js';

export default [
    {
        // The "ignores" property takes an array of glob patterns
        ignores: [
            "node_modules/",
            "dist/",
            "webapp/test/"
        ]
    },
    eslint.configs.recommended,
    // other configurations...
];
