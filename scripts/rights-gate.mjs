import fs from "node:fs";
const mode = process.env.VITE_DATA_MODE || "real";
if (mode !== "real") {
  console.error(
    "This release uses the Sumo API real-data snapshot. VITE_DATA_MODE must be real.",
  );
  process.exit(1);
}
const snapshot = JSON.parse(fs.readFileSync("data/real/snapshot.json", "utf8"));
if (
  snapshot.meta.data_mode !== "real" ||
  !snapshot.records.length ||
  snapshot.records.length !== snapshot.meta.count ||
  !snapshot.records.every(
    (r) =>
      r.rikishi_id.startsWith("sumo-api-") &&
      r.data_source_url.startsWith("https://sumo-api.com/api/rikishi/"),
  )
) {
  console.error("Invalid or mixed-source snapshot.");
  process.exit(1);
}
console.log(
  `Sumo API snapshot: ${snapshot.records.length} records, retrieved ${snapshot.meta.reference_date}`,
);
