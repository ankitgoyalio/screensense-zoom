import path from "node:path";
import { fileURLToPath } from "node:url";
import CopyPlugin from "copy-webpack-plugin";

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));

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
		clean: false,
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
