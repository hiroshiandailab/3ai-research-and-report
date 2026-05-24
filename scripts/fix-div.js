const fs = require("fs");
const path = require("path");
const f = path.join(__dirname, "../src/components/research-workbench.tsx");
let t = fs.readFileSync(f, "utf8");
t = t.replaceAll("<motion ", "<motion ");
t = t.replaceAll("</motion>", "</motion>");
fs.writeFileSync(f, t, "utf8");
console.log("done", t.includes("motion"));
