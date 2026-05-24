const fs = require("fs");
const path = require("path");

const f = path.join(__dirname, "../src/components/research-workbench.tsx");
let t = fs.readFileSync(f, "utf8");

t = t.replace(/const ART_FIELDS[\s\S]*?\];\n\n/, "");
t = t.replace(/\n\s*\{state\.mode === "ART" && \([\s\S]*?\)\}\n/, "\n");
t = t.replaceAll("<motion ", "<div ");
t = t.replaceAll("</motion>", "</div>");
t = t.replace(/setArtNotes,\n\s*/g, "");

fs.writeFileSync(f, t, "utf8");
console.log("ART block removed:", !t.includes("ART\u30e2\u30fc\u30c9\u5c02\u7528\u30e1\u30e2"));
console.log("invalid motion tags:", t.includes("motion"));
