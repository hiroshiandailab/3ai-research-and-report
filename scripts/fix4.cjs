const fs = require("fs");
const path = "src/components/research-workbench.tsx";
const lines = fs.readFileSync(path, "utf8").split("\n");
lines[427] = '                      {tool !== "manual" ? ` (${toolCounts[tool]})` : ""}';
lines[320] = '                    placeholder={"?????\\n?????\\n?????"}';
fs.writeFileSync(path, lines.join("\n"), "utf8");
