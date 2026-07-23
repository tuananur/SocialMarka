import fs from "fs";
import path from "path";

const root = "C:/Users/Casper/Desktop/socailmarka";
const transcript =
  "C:/Users/Casper/.cursor/projects/c-Users-Casper-Desktop-socailmarka/agent-transcripts/9f8b027c-803c-4af7-9e9e-f60301b56b98/9f8b027c-803c-4af7-9e9e-f60301b56b98.jsonl";
const histRoot = "C:/Users/Casper/AppData/Roaming/Cursor/User/History";

function walk(d, acc = []) {
  if (!fs.existsSync(d)) return acc;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".next") continue;
      walk(p, acc);
    } else if (/\.(ts|tsx)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

function resolveModule(n) {
  const candidates = [
    `${root}/apps/web/src/${n}.ts`,
    `${root}/apps/web/src/${n}.tsx`,
    `${root}/apps/web/src/${n}/index.ts`,
    `${root}/apps/web/src/${n}/index.tsx`,
  ];
  return candidates.find((c) => fs.existsSync(c) && fs.statSync(c).size > 2) || null;
}

const files = walk(`${root}/apps/web/src`);
const needed = new Set();
const importRe = /from\s+["']@\/([^"']+)["']/g;
for (const f of files) {
  const t = fs.readFileSync(f, "utf8");
  let m;
  while ((m = importRe.exec(t))) needed.add(m[1]);
}

const missing = [...needed].filter((n) => !resolveModule(n)).sort();
console.log("missing modules", missing.length);
missing.forEach((m) => console.log(" -", m));

// Build history map resource -> best content
function uriToPath(u) {
  let s = decodeURIComponent(String(u).replace(/^file:\/\//, ""));
  if (/^\/[a-zA-Z]:/.test(s)) s = s.slice(1);
  return path.normalize(s);
}

const historyBest = new Map();
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
  let best = null;
  for (const e of j.entries || []) {
    const hp = path.join(histRoot, dir, e.id);
    if (!fs.existsSync(hp)) continue;
    const content = fs.readFileSync(hp, "utf8");
    if (content.trim().length <= 2) continue;
    if (!best || content.length >= best.content.length) best = { content };
  }
  if (best) historyBest.set(filePath.toLowerCase(), best.content);
}

// Build transcript last-write map
const writes = new Map();
const replaces = [];
let lineNo = 0;
for (const line of fs.readFileSync(transcript, "utf8").split("\n")) {
  lineNo++;
  if (!line.trim()) continue;
  let obj;
  try {
    obj = JSON.parse(line);
  } catch {
    continue;
  }
  const content = obj?.message?.content;
  if (!Array.isArray(content)) continue;
  for (const part of content) {
    if (part.type !== "tool_use") continue;
    const p = String(part.input?.path || "").replace(/\\/g, "/");
    if (!p.toLowerCase().includes("socailmarka")) continue;
    if (part.name === "Write" && typeof part.input?.contents === "string") {
      writes.set(path.normalize(p).toLowerCase(), {
        path: path.normalize(p),
        contents: part.input.contents,
        line: lineNo,
      });
    }
    if (
      part.name === "StrReplace" &&
      typeof part.input?.old_string === "string" &&
      typeof part.input?.new_string === "string"
    ) {
      replaces.push({
        path: path.normalize(p).toLowerCase(),
        realPath: path.normalize(p),
        old: part.input.old_string,
        neu: part.input.new_string,
        line: lineNo,
        all: !!part.input.replace_all,
      });
    }
  }
}

function rebuildFromTranscript(absPath) {
  const key = path.normalize(absPath).toLowerCase();
  // find writes for this path
  const pathWrites = [];
  for (const [k, w] of writes) {
    if (k === key || k.endsWith(key.replace(/\\/g, "/").split("/socailmarka/")[1] || "___")) {
      pathWrites.push(w);
    }
  }
  // better: match by ending
  const ending = absPath.replace(/\\/g, "/").toLowerCase();
  const matched = [];
  for (const [, w] of writes) {
    const wp = w.path.replace(/\\/g, "/").toLowerCase();
    if (wp === ending || wp.endsWith(ending.split("/socailmarka/")[1] || "___")) matched.push(w);
  }
  if (!matched.length) return null;
  matched.sort((a, b) => a.line - b.line);
  // rebuild each write segment
  let best = null;
  for (let wi = 0; wi < matched.length; wi++) {
    let content = matched[wi].contents;
    const start = matched[wi].line;
    const end = wi + 1 < matched.length ? matched[wi + 1].line : Infinity;
    for (const r of replaces) {
      if (r.line <= start || r.line >= end) continue;
      const rp = r.realPath.replace(/\\/g, "/").toLowerCase();
      if (!(rp === ending || rp.endsWith(ending.split("/socailmarka/")[1] || "___"))) continue;
      if (content.includes(r.old)) {
        content = r.all ? content.split(r.old).join(r.neu) : content.replace(r.old, r.neu);
      }
    }
    if (!best || content.length >= best.length) best = content;
  }
  return best;
}

let restored = 0;
for (const n of missing) {
  const targets = [
    `${root}/apps/web/src/${n}.ts`,
    `${root}/apps/web/src/${n}.tsx`,
  ];
  let content = null;
  let dest = targets[0];
  for (const t of targets) {
    const fromHist = historyBest.get(path.normalize(t).toLowerCase());
    if (fromHist) {
      content = fromHist;
      dest = t;
      break;
    }
  }
  if (!content) {
    for (const t of targets) {
      const fromTx = rebuildFromTranscript(t);
      if (fromTx) {
        content = fromTx;
        dest = t;
        break;
      }
    }
  }
  // also try without extension variants from history keys
  if (!content) {
    for (const [k, v] of historyBest) {
      if (k.replace(/\\/g, "/").includes(`/src/${n}.`)) {
        content = v;
        dest = k.includes(".tsx") ? targets[1] : targets[0];
        break;
      }
    }
  }
  if (!content) {
    console.log("STILL MISSING", n);
    continue;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content, "utf8");
  restored++;
  console.log("RESTORED", path.relative(root, dest), content.length);
}
console.log({ restored, still: missing.length - restored });
