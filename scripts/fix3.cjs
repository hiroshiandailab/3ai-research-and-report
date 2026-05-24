const fs = require("fs");
const path = "src/components/research-workbench.tsx";
let t = fs.readFileSync(path, "utf8");
const lines = t.split("\n");
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("tool !==") && lines[i].includes("manual") && lines[i].includes("toolCounts")) {
    lines[i] = '                      {tool !== "manual" ? ` (${toolCounts[tool]})` : ""}';
  }
  if (lines[i].includes("markdownPreview.length > 1200")) {
    lines[i] = '                {markdownPreview.length > 1200 ? "\\n\\n\u2026" : ""}';
  }
}
t = lines.join("\n");
// also fix placeholder newlines in brief
t = t.replace(
  'placeholder={"?????\\n?????\\n?????"}',
  'placeholder={"?????\\n?????\\n?????"}',
);
fs.writeFileSync(path, t, "utf8");
console.log("fixed");
