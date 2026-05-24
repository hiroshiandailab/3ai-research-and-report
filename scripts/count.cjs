const fs = require("fs");
const t = fs.readFileSync("src/components/research-workbench.tsx", "utf8");
const ticks = (t.match(/`/g) || []).length;
console.log("backticks", ticks);
