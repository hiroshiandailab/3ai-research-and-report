const fs = require("fs");
const path = "src/components/research-workbench.tsx";
let t = fs.readFileSync(path, "utf8");
t = t.replace(
  /title: \\\\ Report\\,/,
  "title: `${SOURCE_TOOL_LABELS[tool]} Report`,",
);
t = t.replace(/\\n\\n?/g, '"\\n\\n?"');
t = t.replace(/\{markdownPreview\.length > 1200 \? "\\n\\n?" : ""\}/, 
  '{markdownPreview.length > 1200 ? "\\n\\n?" : ""}');
// fix placeholder if broken
t = t.replace(/title: \\\\ Report\\,/g, "title: `${SOURCE_TOOL_LABELS[tool]} Report`,");
fs.writeFileSync(path, t, "utf8");
console.log((t.match(/title:/g)||[]).length);
const line = t.split("\n")[163];
console.log(line);
