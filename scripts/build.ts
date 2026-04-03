import { rm } from "node:fs/promises";

async function runBuild(): Promise<void> {
  await rm("dist", { force: true, recursive: true });

  await Bun.$`bunx tsc -p tsconfig.json`;
  await Bun.$`mkdir -p dist`;
  await Bun.$`cp manifest.json dist/manifest.json`;
  await Bun.$`cp -R static/. dist/`;
}

await runBuild();
