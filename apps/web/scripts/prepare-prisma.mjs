import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
const repoRoot = path.join(webRoot, "../..");
const schema = path.join(repoRoot, "packages/db/prisma/schema.prisma");

function exists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

function copyDir(src, dest) {
  if (!exists(src)) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true, force: true });
  return true;
}

// Ensure @prisma/client is resolvable from apps/web before generate
const clientCandidates = [
  path.join(webRoot, "node_modules/@prisma/client"),
  path.join(repoRoot, "node_modules/@prisma/client"),
  path.join(repoRoot, "packages/db/node_modules/@prisma/client"),
];

if (!clientCandidates.some(exists)) {
  console.log("[prepare-prisma] installing @prisma/client in apps/web...");
  execSync("npm install @prisma/client@^6.1.0 --no-save", {
    cwd: webRoot,
    stdio: "inherit",
    env: process.env,
  });
}

execSync(`npx prisma generate --schema="${schema}"`, {
  cwd: repoRoot,
  stdio: "inherit",
  env: process.env,
});

const engineCandidates = [
  path.join(repoRoot, "node_modules/.prisma/client"),
  path.join(repoRoot, "packages/db/node_modules/.prisma/client"),
  path.join(webRoot, "node_modules/.prisma/client"),
];

const dest = path.join(webRoot, "node_modules/.prisma/client");
let copied = false;
for (const src of engineCandidates) {
  if (copyDir(src, dest)) {
    console.log("[prepare-prisma] copied engines from", src, "->", dest);
    copied = true;
    break;
  }
}

if (!copied) {
  throw new Error("[prepare-prisma] .prisma/client not found after generate");
}

const clientSrc = clientCandidates.find(exists);
const clientDest = path.join(webRoot, "node_modules/@prisma/client");
if (clientSrc && clientSrc !== clientDest) {
  copyDir(clientSrc, clientDest);
  console.log("[prepare-prisma] synced @prisma/client into apps/web");
}
