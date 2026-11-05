#!/usr/bin/env node
/**
 * Static snapshot for GitHub project Pages (https://<user>.github.io/klaro/).
 * Builds with base /klaro/, renders the landing, and writes dist/pages.
 */
import { spawn } from "node:child_process";
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "dist", "pages");
const staticDir = join(root, ".vercel", "output", "static");

function run(command, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: "inherit",
      env: { ...process.env, ...env },
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited ${code}`));
    });
  });
}

async function waitForPreview() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch("http://127.0.0.1:8081/");
      if (response.ok) return response;
    } catch {
      /* not up yet */
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error("preview did not answer on :8081");
}

const env = { GITHUB_PAGES: "1" };
await run("npm", ["run", "build"], env);
await run("node", ["scripts/preview.mjs", "restart"], env);

try {
  const response = await waitForPreview();
  const html = await response.text();
  if (!html.includes("Десять клиентов")) {
    throw new Error("rendered page is missing the landing headline");
  }
  if (!html.includes("/klaro/assets/")) {
    throw new Error("rendered page is missing /klaro/ asset URLs");
  }

  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  cpSync(staticDir, out, { recursive: true });
  writeFileSync(join(out, "index.html"), html);
  writeFileSync(join(out, ".nojekyll"), "");
  console.log(`[pages] wrote ${out}`);
} finally {
  await run("node", ["scripts/preview.mjs", "stop"], env);
}
