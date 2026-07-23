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

// find last write index
let lastWrite = -1;
for (let i = 0; i < events.length; i++) if (events[i].kind === "write") lastWrite = i;
let content = events[lastWrite].contents;
console.log("raw write imports:\n", content.split("\n").slice(0, 25).join("\n"));
console.log("\n--- failed replaces after last write ---");
for (let i = lastWrite + 1; i < events.length; i++) {
  const r = events[i];
  if (r.kind !== "replace") continue;
  if (!content.includes(r.old)) {
    console.log("\nFAIL @line", r.line);
    console.log("OLD preview:", JSON.stringify(r.old.slice(0, 180)));
    console.log("NEW preview:", JSON.stringify(r.neu.slice(0, 180)));
  } else {
    content = r.all ? content.split(r.old).join(r.neu) : content.replace(r.old, r.neu);
  }
}
