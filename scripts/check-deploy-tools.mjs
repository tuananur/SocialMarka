import { execSync } from "child_process";
function run(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8", cwd: "C:/Users/Casper/Desktop/socailmarka" }).trim();
  } catch (e) {
    return (e.stdout || "") + (e.stderr || e.message);
  }
}
console.log("GIT:", run("git rev-parse --is-inside-work-tree 2>&1").split("\n")[0]);
console.log("REMOTE:", run("git remote -v 2>&1").split("\n").slice(0, 2).join(" | "));
console.log("VERCEL:", run("vercel --version 2>&1").split("\n")[0]);
console.log("GH:", run("gh auth status 2>&1").split("\n").slice(0, 4).join(" | "));
