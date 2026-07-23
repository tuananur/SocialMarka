const fs = require("fs");
const path = require("path");

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

const root = path.join(__dirname, "..");
const candidates = [
  path.join(root, "node_modules", ".prisma"),
  path.join(root, "node_modules", "@prisma", "client", ".prisma"),
];

let src = null;
for (const c of candidates) {
  if (fs.existsSync(c)) {
    src = c;
    break;
  }
}

// Also check default nested client folder
const nested = path.join(root, "node_modules", "@prisma", "client");
if (!src && fs.existsSync(nested)) {
  // engines live next to client in newer layouts
  const engine = fs
    .readdirSync(nested)
    .find((f) => f.includes("query_engine") || f.endsWith(".node"));
  if (engine) {
    const destRoot = path.join(root, "..", "..", "node_modules", ".prisma", "client");
    const destWeb = path.join(root, "..", "..", "apps", "web", "node_modules", ".prisma", "client");
    for (const dest of [destRoot, destWeb]) {
      fs.mkdirSync(dest, { recursive: true });
      for (const f of fs.readdirSync(nested)) {
        const s = path.join(nested, f);
        if (fs.statSync(s).isFile()) {
          fs.copyFileSync(s, path.join(dest, f));
        }
      }
    }
    console.log("Prisma engine files copied from @prisma/client");
    process.exit(0);
  }
}

if (!src) {
  console.warn("No .prisma folder found to copy");
  process.exit(0);
}

const targets = [
  path.join(root, "..", "..", "node_modules", ".prisma"),
  path.join(root, "..", "..", "apps", "web", "node_modules", ".prisma"),
];

for (const dest of targets) {
  fs.rmSync(dest, { recursive: true, force: true });
  copyDir(src, dest);
  console.log("Copied", src, "->", dest);
}
