import fs from "fs";
import path from "path";

const histRoot = "C:/Users/Casper/AppData/Roaming/Cursor/User/History";
const project = "C:/Users/Casper/Desktop/socailmarka";

function uriToPath(u) {
  let s = decodeURIComponent(String(u).replace(/^file:\/\//, ""));
  if (/^\/[a-zA-Z]:/.test(s)) s = s.slice(1);
  return path.normalize(s);
}

let restored = 0;
let skipped = 0;
let checked = 0;

for (const dir of fs.readdirSync(histRoot)) {
  const entriesPath = path.join(histRoot, dir, "entries.json");
  if (!fs.existsSync(entriesPath)) continue;
  let j;
  try {
    j = JSON.parse(fs.readFileSync(entriesPath, "utf8"));
  } catch {
    continue;
  }
  const resource = String(j.resource || "");
  if (!resource.toLowerCase().includes("socailmarka")) continue;
  const filePath = uriToPath(resource);
  if (!filePath.toLowerCase().includes("socailmarka")) continue;
  checked++;
  const entries = j.entries || [];
  if (!entries.length) continue;

  let best = null;
  for (const e of entries) {
    const hp = path.join(histRoot, dir, e.id);
    if (!fs.existsSync(hp)) continue;
    const content = fs.readFileSync(hp, "utf8");
    if (content.trim().length <= 2) continue;
    if (!best || content.length >= best.content.length) {
      best = { content, id: e.id };
    }
  }
  if (!best) continue;

  const exists = fs.existsSync(filePath);
  const curLen = exists ? fs.statSync(filePath).size : 0;
  if (!exists || curLen <= 2 || (best.content.length > curLen * 2 && curLen < 500)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, best.content, "utf8");
    restored++;
    console.log(
      "RESTORED",
      path.relative(project, filePath),
      "len",
      best.content.length,
      "was",
      curLen,
    );
  } else {
    skipped++;
  }
}

console.log({ checked, restored, skipped });
