import { build } from "esbuild";

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  // pg only loads pg-native if asked to; it is not installed.
  external: ["pg-native"],
  platform: "node",
  format: "esm",
  outfile: "dist/index.mjs",
  sourcemap: true,
  banner: {
    js: "import { createRequire } from 'node:module'; globalThis.require = createRequire(import.meta.url);",
  },
});