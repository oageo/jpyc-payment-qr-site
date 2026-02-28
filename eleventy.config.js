import pluginPurgeCSS from "eleventy-plugin-purgecss";
import esbuild from "esbuild";
import { readFileSync } from "fs";

const { version: jpycPaymentQrVersion } = JSON.parse(
	readFileSync("./node_modules/jpyc-payment-qr/package.json", "utf-8"),
);

export default function (eleventyConfig) {
	eleventyConfig.addGlobalData("jpycPaymentQrVersion", jpycPaymentQrVersion);
	// purgecss 8.x + Windows環境ではファイルパス指定がfile://URL問題を起こすため
	// オブジェクト形式で直接渡す（purgecss.config.cjs は設定内容の参考用として保持）
	eleventyConfig.addPlugin(pluginPurgeCSS, {
		config: {
			content: ["./_site/**/*.html"],
			css: ["./_site/**/*.css"],
			safelist: ["is-inline-block"],
		},
	});
	eleventyConfig.addPassthroughCopy({
		"node_modules/bulma/css/bulma.min.css": "css/bulma.min.css",
	});

	eleventyConfig.on("eleventy.before", async ({ runMode }) => {
		const minify = runMode !== "serve" && runMode !== "watch";
		await esbuild.build({
			entryPoints: ["src/js/main.js"],
			bundle: true,
			format: "iife",
			platform: "browser",
			outfile: "_site/js/bundle.js",
			minify,
			sourcemap: !minify,
		});
	});

	eleventyConfig.addWatchTarget("./src/js/");

	return {
		dir: {
			input: "src",
			output: "_site",
		},
	};
}
