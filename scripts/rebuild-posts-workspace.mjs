import fs from "fs";

const transcript =
  "C:/Users/Casper/.cursor/projects/c-Users-Casper-Desktop-socailmarka/agent-transcripts/9f8b027c-803c-4af7-9e9e-f60301b56b98/9f8b027c-803c-4af7-9e9e-f60301b56b98.jsonl";
const targetSuffix = "posts-workspace.tsx";

const events = [];
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
    if (!p.endsWith(targetSuffix)) continue;
    if (part.name === "Write" && typeof part.input?.contents === "string") {
      events.push({ kind: "write", line: lineNo, contents: part.input.contents });
    }
    if (
      part.name === "StrReplace" &&
      typeof part.input?.old_string === "string" &&
      typeof part.input?.new_string === "string"
    ) {
      events.push({
        kind: "replace",
        line: lineNo,
        old: part.input.old_string,
        neu: part.input.new_string,
        all: !!part.input.replace_all,
      });
    }
  }
}

console.log(
  "events",
  events.length,
  "writes",
  events.filter((e) => e.kind === "write").length,
);

// rebuild: for each write, apply subsequent replaces until next write
let best = null;
let i = 0;
while (i < events.length) {
  if (events[i].kind !== "write") {
    i++;
    continue;
  }
  let content = events[i].contents;
  const writeLine = events[i].line;
  i++;
  let applied = 0;
  let failed = 0;
  while (i < events.length && events[i].kind !== "write") {
    const r = events[i];
    if (content.includes(r.old)) {
      content = r.all ? content.split(r.old).join(r.neu) : content.replace(r.old, r.neu);
      applied++;
    } else {
      failed++;
    }
    i++;
  }
  console.log(`write@${writeLine} len=${content.length} applied=${applied} failed=${failed}`);
  if (!best || content.length >= best.content.length) {
    best = { content, writeLine, applied, failed };
  }
}

const out =
  "C:/Users/Casper/Desktop/socailmarka/apps/web/src/components/posts/posts-workspace.tsx";
fs.writeFileSync(out, best.content, "utf8");
console.log("wrote best from write@", best.writeLine, "len", best.content.length);
console.log("has ManagePost import", best.content.includes("post-display"));
console.log("has ProviderIcon import", /import .*ProviderIcon/.test(best.content));
