const fs = require("fs");
const raw = fs.readFileSync("write-wb.cjs", "utf8");
const i = raw.indexOf("import { useMemo");
const j = raw.indexOf("// Fix accidental");
let tsx = '"use client";\n\n' + raw.slice(i, j).trim();
if (tsx.endsWith(";")) tsx = tsx.slice(0, -1).trimEnd();
tsx = tsx.replaceAll("<motion.div", "<div");
tsx = tsx.replaceAll("</motion.div>", "</div>");
tsx = tsx.replace(
  /<div className="space-y-2 pr-2">\{renderLayerCards\(layer\)\}<\/div>/,
  '<motion.div className="space-y-2 pr-2">{renderLayerCards(layer)}</motion.div>',
);
tsx = tsx.replace(
  '<motion.div className="space-y-2 pr-2">{renderLayerCards(layer)}</motion.div>',
  '<motion.div className="space-y-2 pr-2">{renderLayerCards(layer)}</motion.div>',
);
tsx = tsx.replace(
  '<motion.div className="space-y-2 pr-2">{renderLayerCards(layer)}</motion.div>',
  '<div className="space-y-2 pr-2">{renderLayerCards(layer)}</motion.div>',
);
tsx = tsx.replace(
  '<div className="space-y-2 pr-2">{renderLayerCards(layer)}</motion.div>',
  '<div className="space-y-2 pr-2">{renderLayerCards(layer)}</motion.div>',
);
tsx = tsx.replace(
  '<div className="space-y-2 pr-2">{renderLayerCards(layer)}</motion.div>',
  '<div className="space-y-2 pr-2">{renderLayerCards(layer)}</div>',
);
// remove ART block if present
tsx = tsx.replace(/const ART_FIELDS[\s\S]*?\];\n\n/, "");
tsx = tsx.replace(/\n\s*\{state\.mode === "ART" && \([\s\S]*?\)\}\n/, "\n");
fs.writeFileSync("src/components/research-workbench.tsx", tsx, "utf8");
console.log("written", tsx.length, "motion", (tsx.match(/motion/g) || []).length);
