import fs from "fs";
const t = fs.readFileSync(
  "C:/Users/Casper/Desktop/socailmarka/apps/web/src/components/posts/posts-workspace.tsx",
  "utf8",
);

const used = [
  "useEffect",
  "useSearchParams",
  "ProviderBadge",
  "ProviderIcon",
  "ComposerMediaPreview",
  "PostDetailModal",
  "PostManageCard",
  "ConfirmDialog",
  "ManagePost",
  "mediaMime",
  "setMediaMime",
  "mediaFileName",
  "setMediaFileName",
  "mediaAssetId",
  "setMediaAssetId",
  "deleteConfirmId",
  "setDeleteConfirmId",
  "mediaIsLocal",
  "setMediaIsLocal",
  "setMediaFromFile",
  "Chip",
  "ToolIcon",
];

for (const name of used) {
  const usedIn = t.includes(name);
  const declared =
    t.includes(`function ${name}`) ||
    t.includes(`const ${name}`) ||
    t.includes(`let ${name}`) ||
    t.includes(`type ${name}`) ||
    t.includes(`import { ${name}`) ||
    t.includes(`, ${name}`) ||
    t.includes(`${name},`) ||
    t.includes(` ${name} }`) ||
    new RegExp(`\\b${name}\\b.*=.*useState`).test(t);
  if (usedIn && !declared) console.log("MISSING DECL/IMPORT:", name);
  else if (usedIn) console.log("ok", name);
}
