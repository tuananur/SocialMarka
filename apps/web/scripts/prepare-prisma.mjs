import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
const repoRoot = path.join(webRoot, "../..");
const schema = path.join(repoRoot, "packages/db/prisma/schema.prisma");

execSync(`npx prisma generate --schema="${schema}"`, {
  cwd: webRoot,
  stdio: "inherit",
  env: process.env,
});

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true, force: true });
  return true;
}

const candidates = [
  path.join(repoRoot, "node_modules/.prisma/client"),
  path.join(repoRoot, "packages/db/node_modules/.prisma/client"),
  path.join(webRoot, "node_modules/.prisma/client"),
];

const dest = path.join(webRoot, "node_modules/.prisma/client");
let copied = false;
for (const src of candidates) {
  if (copyDir(src, dest)) {
    console.log("[prepare-prisma] copied engines from", src, "->", dest);
    copied = true;
    break;
  }
}

if (!copied) {
  console.warn("[prepare-prisma] warning: .prisma/client not found after generate");
}

const clientSrc = path.join(repoRoot, "node_modules/@prisma/client");
const clientDest = path.join(webRoot, "node_modules/@prisma/client");
if (fs.existsSync(clientSrc)) {
  copyDir(clientSrc, clientDest);
  console.log("[prepare-prisma] synced @prisma/client into apps/web");
}
