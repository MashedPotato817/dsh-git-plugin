import { build } from "esbuild";
import { writeFile } from "node:fs/promises";
const result = await build({
	entryPoints: ["src/client/index.tsx"],
	bundle: true,
	write: false,
	tsconfig: "tsconfig.client.json",
	jsx: "automatic",
	format: "cjs",
	platform: "browser",
	target: "es2022",
	external: ["react", "react/jsx-runtime"],
	loader: { ".css": "text" },
	define: { "process.env.NODE_ENV": '"production"' },
	legalComments: "inline",
	metafile: true,
});
const external = result.metafile.outputs[
	Object.keys(result.metafile.outputs)[0]
].imports
	.filter((item) => item.external)
	.map((item) => item.path);
if (external.some((name) => !["react", "react/jsx-runtime"].includes(name)))
	throw new Error(`Unexpected browser external: ${external.join(", ")}`);
await writeFile(
	"lib/client.js",
	`// Generated from src/client; do not edit.\nwindow.__ModuleLoader__.load({id:"dsh-git-plugin",factory(require){\nconst module={exports:{}};const exports=module.exports;\n${result.outputFiles[0].text}\nreturn module.exports;\n}});\n`,
);
