import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
	{
		ignores: ["dist/**", "dev/**", "node_modules/**"],
	},
	{
		files: ["src/content/**/*.{js,mjs,cjs,ts,mts,cts}"],
		plugins: { js },
		extends: ["js/recommended"],
		languageOptions: { globals: globals.browser },
	},
	{
		files: ["src/background/**/*.{js,mjs,cjs,ts,mts,cts}"],
		languageOptions: { globals: globals.serviceworker },
	},
	...tseslint.configs.recommended,
]);
