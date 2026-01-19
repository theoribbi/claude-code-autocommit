import { defineConfig } from "tsup";
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

export default defineConfig({
  entry: {
    "mcp/index": "src/mcp/index.ts",
    "slash-command/install": "src/slash-command/install.ts",
  },
  format: ["esm"],
  target: "node18",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  dts: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
  onSuccess: async () => {
    // Copy the slash command markdown file to dist
    const srcPath = "src/slash-command/autocommit.md";
    const destDir = "dist/slash-command";
    const destPath = join(destDir, "autocommit.md");

    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }

    copyFileSync(srcPath, destPath);
    console.log("Copied autocommit.md to dist/slash-command/");
  },
});
