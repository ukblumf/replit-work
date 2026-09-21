// Converts the OpenAPI YAML contracts into JSON files bundled into each API server,
// so GET /openapi.json serves the real contract (importable by n8n) instead of a hand-written copy.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");

const targets = [
  ["openapi.yaml", "artifacts/api-server/src/generated/openapi.json"],
  ["jobs-openapi.yaml", "artifacts/jobs-api/src/generated/openapi.json"],
];

for (const [source, out] of targets) {
  const doc = parse(readFileSync(path.join(here, source), "utf8"));
  const dest = path.join(root, out);
  mkdirSync(path.dirname(dest), { recursive: true });
  writeFileSync(dest, JSON.stringify(doc, null, 2) + "\n");
  console.log(`${source} -> ${out}`);
}
