import path from "node:path";
import { fileURLToPath } from "node:url";
import CopyPlugin from "copy-webpack-plugin";

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));

/**
 * Create shared Webpack settings used by both background and content builds.
 * @param {boolean} isProduction - When true, set production mode and disable source maps.
 * @param {string} outputRoot - Output directory name resolved relative to this config file.
 * @param {boolean} clean - Whether to enable output cleaning (remove previous build files).
 * @returns {import('webpack').Configuration} Webpack configuration object with common fields (mode, devtool, resolve, module rules, and output).
 */
function createSharedSettings({ isProduction, outputRoot, clean }) {
	return {
		mode: isProduction ? "production" : "development",
		devtool: isProduction ? false : "cheap-module-source-map",
		resolve: {
			extensions: [".js"],
		},
		module: {
			rules: [
				{
					test: /\.js$/,
					type: "javascript/esm",
				},
			],
		},
		output: {
			clean,
			path: path.resolve(ROOT_DIR, outputRoot),
		},
	};
}

export default (env = {}, argv = {}) => {
	const browser = env.BROWSER ?? "chrome";
	const isProduction = argv.mode === "production";
	const outputRoot = isProduction ? "dist" : "dev";
	const sharedSettings = createSharedSettings({
		isProduction,
		outputRoot,
		clean: isProduction,
	});

	return [
		{
			...sharedSettings,
			name: "background",
			target: "webworker",
			entry: {
				background: "./src/background/index.js",
			},
			output: {
				...sharedSettings.output,
				filename: "background.js",
			},
		},
		{
			...sharedSettings,
			name: "content",
			target: "web",
			entry: {
				content: "./src/content/index.js",
			},
			output: {
				...sharedSettings.output,
				filename: "content.js",
			},
			plugins: [
				new CopyPlugin({
					patterns: [
						{
							from: `src/manifest/${browser}.json`,
							to: "manifest.json",
						},
						{
							from: "src/assets/icons",
							to: "icons",
						},
					],
				}),
			],
		},
	];
};
