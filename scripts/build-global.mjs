// Writes lib/accessible-charts.global.js: the same code as lib/index.js for a plain
// <script> tag (no bundler, works from file://). Run: node scripts/build-global.mjs
import { readFileSync, writeFileSync } from "node:fs";
const src = readFileSync(new URL("../lib/index.js", import.meta.url), "utf8");
const names = [];
const body = src.replace(/^export const (\w+)/gm, (_, n) => { names.push(n); return `const ${n}`; });
if (/^export /m.test(body)) throw new Error("unhandled export form in lib/index.js");
writeFileSync(new URL("../lib/accessible-charts.global.js", import.meta.url),
  `// Generated from lib/index.js by scripts/build-global.mjs. Do not edit.\nvar AccessibleCharts = (function () {\n"use strict";\n${body}\nreturn { ${names.join(", ")} };\n})();\n`);
console.log(`global build: ${names.length} exports`);
