import fs from "node:fs";
const mode = process.env.VITE_DATA_MODE || "demo";
if (mode !== "demo") {
  console.error(
    "Official mode is unavailable: permission, collector and coverage must all be reviewed before implementation.",
  );
  process.exit(1);
}
const r = JSON.parse(fs.readFileSync("data/rights.json", "utf8"));
if (r.status !== "unconfirmed") {
  console.error("Rights changes require review; this release is demo only.");
  process.exit(1);
}
console.log("DEMO gate passed: synthetic records only.");
