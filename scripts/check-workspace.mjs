import fs from "fs";
const p = "C:/Users/Casper/Desktop/socailmarka/apps/web/src/components/posts/posts-workspace.tsx";
const t = fs.readFileSync(p, "utf8");
console.log("size", t.length);
console.log("has ProviderIcon", t.includes("ProviderIcon"));
console.log("has post-display", t.includes("post-display"));
console.log("has ManagePost", t.includes("ManagePost"));
console.log("--- first 45 lines ---");
console.log(t.split("\n").slice(0, 45).join("\n"));
