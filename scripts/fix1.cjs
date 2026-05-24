const fs = require("fs");
const path = "src/components/research-workbench.tsx";
let s = fs.readFileSync(path, "utf8");
s = s.replaceAll("<motion.div", "<motion.div");
s = s.replaceAll("<motion.div", "<div");
s = s.replaceAll("</motion.div>", "</motion.div>");
s = s.replaceAll("</motion.div>", "</motion.div>");
