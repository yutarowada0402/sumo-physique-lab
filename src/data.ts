import snapshot from "../data/real/snapshot.json";
export const meta = snapshot.meta;
export const divisions = [
  "makuuchi",
  "juryo",
  "makushita",
  "sandanme",
  "jonidan",
  "jonokuchi",
] as const;
export type Division = (typeof divisions)[number];
export const labels: Record<Division, string> = {
  makuuchi: "幕内",
  juryo: "十両",
  makushita: "幕下",
  sandanme: "三段目",
  jonidan: "序二段",
  jonokuchi: "序ノ口",
};
export const colors: Record<Division, string> = {
  makuuchi: "#e46164",
  juryo: "#d9b869",
  makushita: "#89aeb9",
  sandanme: "#9c9cbd",
  jonidan: "#85a68e",
  jonokuchi: "#b99b83",
};
export type Rikishi = {
  rikishi_id: string;
  shikona: string;
  shikona_kana: string;
  rank_raw: string;
  division: Division;
  stable: string;
  birthplace: string;
  birth_date: string;
  height_cm: number | null;
  weight_kg: number | null;
  highest_rank: string;
  source_url: string | null;
  career_wins: number | null;
  career_losses: number | null;
  career_absences: number | null;
  career_basho: number | null;
  makuuchi_wins: number | null;
  makuuchi_losses: number | null;
  performance_as_of: string;
  profile_updated_at: string | null;
  data_source_url: string;
};
export const records = snapshot.records as Rikishi[];
export const finite = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
export const positive = (v: unknown): v is number => finite(v) && v > 0;
export const bmi = (r: Rikishi) =>
  positive(r.weight_kg) && positive(r.height_cm)
    ? r.weight_kg / (r.height_cm / 100) ** 2
    : null;
export const winRate = (r: Rikishi) =>
  finite(r.career_wins) &&
  finite(r.career_losses) &&
  r.career_wins >= 0 &&
  r.career_losses >= 0 &&
  r.career_wins + r.career_losses > 0
    ? r.career_wins / (r.career_wins + r.career_losses)
    : null;
export const age = (r: Rikishi) => {
  const b = new Date(r.birth_date),
    a = new Date(meta.reference_date);
  if (!Number.isFinite(b.getTime()) || b > a) return null;
  return (
    a.getUTCFullYear() -
    b.getUTCFullYear() -
    (a.getUTCMonth() < b.getUTCMonth() ||
    (a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() < b.getUTCDate())
      ? 1
      : 0)
  );
};
export const avg = (v: number[]) =>
  v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
export function quantile(v: number[], p: number) {
  if (!v.length) return null;
  const s = [...v].sort((a, b) => a - b),
    k = (s.length - 1) * p,
    f = Math.floor(k);
  return s[f] + (s[Math.ceil(k)] - s[f]) * (k - f);
}
export const median = (v: number[]) => quantile(v, 0.5);
export function pearson(p: number[][]) {
  if (p.length < 10) return null;
  const x = avg(p.map((a) => a[0]))!,
    y = avg(p.map((a) => a[1]))!;
  let n = 0,
    a = 0,
    b = 0;
  for (const [u, v] of p) {
    n += (u - x) * (v - y);
    a += (u - x) ** 2;
    b += (v - y) ** 2;
  }
  return a > 0 && b > 0 ? n / Math.sqrt(a * b) : null;
}
export const fmt = (v: unknown, d = 1) => (finite(v) ? v.toFixed(d) : "—");
export type Filters = {
  divisions: Division[];
  q: string;
  stable: string;
  birthplace: string;
  minAge: string;
  maxAge: string;
  minH: string;
  maxH: string;
  minW: string;
  maxW: string;
};
export function readFilters(p: URLSearchParams): Filters {
  return {
    divisions: p.has("divisions")
      ? (p.get("divisions") || "")
          .split(",")
          .filter((v): v is Division => divisions.includes(v as Division))
      : ["makuuchi", "juryo"],
    q: p.get("q") || "",
    stable: p.get("stable") || "",
    birthplace: p.get("birthplace") || "",
    minAge: p.get("minAge") || "",
    maxAge: p.get("maxAge") || "",
    minH: p.get("minH") || "",
    maxH: p.get("maxH") || "",
    minW: p.get("minW") || "",
    maxW: p.get("maxW") || "",
  };
}
export function filterRows(rows: Rikishi[], f: Filters, all = false) {
  return rows.filter(
    (r) =>
      (all || f.divisions.includes(r.division)) &&
      (!f.q || `${r.shikona} ${r.shikona_kana}`.includes(f.q)) &&
      (!f.stable || r.stable === f.stable) &&
      (!f.birthplace || r.birthplace === f.birthplace) &&
      [
        ["minAge", age(r), true],
        ["maxAge", age(r), false],
        ["minH", r.height_cm, true],
        ["maxH", r.height_cm, false],
        ["minW", r.weight_kg, true],
        ["maxW", r.weight_kg, false],
      ].every(([key, value, min]) => {
        const s = f[key as keyof Filters];
        return (
          !s ||
          (finite(value) && (min ? value >= Number(s) : value <= Number(s)))
        );
      }),
  );
}
export function pairs(
  rows: Rikishi[],
  key: "height_cm" | "weight_kg",
  performance = false,
) {
  return rows.flatMap((r) => {
    const x = r[key],
      y = performance ? winRate(r) : r.weight_kg;
    return positive(x) && finite(y) && (performance || y > 0)
      ? [{ r, x, y: performance ? y * 100 : y }]
      : [];
  });
}
export const summary = (rows: Rikishi[]) =>
  divisions.map((division) => {
    const rs = rows.filter((r) => r.division === division),
      v = rs.map((r) => r.weight_kg).filter(positive);
    return {
      division,
      n: rs.length,
      valid: v.length,
      excluded: rs.length - v.length,
      mean: avg(v),
      median: median(v),
      five: [0, 0.25, 0.5, 0.75, 1].map((p) => quantile(v, p)),
    };
  });
