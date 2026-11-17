import { describe, it, expect } from "vitest";
import {
  records,
  meta,
  readFilters,
  filterRows,
  bmi,
  winRate,
  pearson,
  median,
  quantile,
  pairs,
  age,
  summary,
  type Rikishi,
} from "../src/data";
const r = records[1];
describe("統計と品質", () => {
  it("初期対象と全階級がスナップショットに整合", () => {
    const f = readFilters(new URLSearchParams());
    expect(f.divisions).toEqual(["makuuchi", "juryo"]);
    expect(filterRows(records, f)).toHaveLength(
      meta.coverage.makuuchi + meta.coverage.juryo,
    );
    expect(filterRows(records, f, true)).toHaveLength(meta.count);
  });
  it("IDは重複せず、実データの出典を保持", () => {
    expect(new Set(records.map((r) => r.rikishi_id)).size).toBe(records.length);
    expect(
      records.every(
        (r) =>
          r.rikishi_id.startsWith("sumo-api-") &&
          r.data_source_url.startsWith("https://sumo-api.com/"),
      ),
    ).toBe(true);
  });
  it("欠損・文字列・0勝0敗を勝率にしない", () => {
    expect(winRate({ ...r, career_wins: 0, career_losses: 0 })).toBeNull();
    expect(winRate({ ...r, career_wins: null })).toBeNull();
    expect(
      winRate({ ...r, career_wins: "50" } as unknown as Rikishi),
    ).toBeNull();
    expect(
      winRate({ ...r, career_wins: 3, career_losses: 1, career_absences: 90 }),
    ).toBe(0.75);
  });
  it("BMIは有効な正数のみ", () => {
    expect(bmi({ ...r, height_cm: 200, weight_kg: 160 })).toBe(40);
    expect(bmi({ ...r, height_cm: 0 })).toBeNull();
    expect(bmi({ ...r, weight_kg: null })).toBeNull();
  });
  it("中央値と四分位を線形補間", () => {
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(quantile([1, 2, 3, 4], 0.25)).toBe(1.75);
    expect(median([])).toBeNull();
  });
  it("相関は10件以上かつ分散あり、正負を再現", () => {
    expect(pearson([[1, 2]])).toBeNull();
    expect(pearson(Array.from({ length: 10 }, (_, i) => [1, i]))).toBeNull();
    expect(
      pearson(Array.from({ length: 10 }, (_, i) => [i, i * 2])),
    ).toBeCloseTo(1);
    expect(pearson(Array.from({ length: 10 }, (_, i) => [i, -i]))).toBeCloseTo(
      -1,
    );
  });
  it("URLの空選択を初期値と混同しない", () => {
    expect(readFilters(new URLSearchParams("divisions=")).divisions).toEqual(
      [],
    );
    expect(
      readFilters(new URLSearchParams("divisions=invalid,juryo")).divisions,
    ).toEqual(["juryo"]);
  });
  it("共通フィルターと階級サマリーが整合", () => {
    const f = readFilters(
      new URLSearchParams("minW=160&stable=" + encodeURIComponent(r.stable)),
    );
    const rs = filterRows(records, f),
      ps = pairs(rs, "height_cm");
    expect(rs.every((r) => r.weight_kg! >= 160 && r.stable === f.stable)).toBe(
      true,
    );
    expect(ps.every((p) => rs.includes(p.r))).toBe(true);
    expect(
      summary(filterRows(records, f, true)).reduce((n, s) => n + s.n, 0),
    ).toBe(filterRows(records, f, true).length);
  });
  it("改名はIDを変えず比較可能、年齢は基準日", () => {
    expect({ ...r, shikona: "改名（架空）" }.rikishi_id).toBe(r.rikishi_id);
    expect(age({ ...r, birth_date: meta.reference_date })).toBe(0);
    expect(age({ ...r, birth_date: "" })).toBeNull();
  });
  it("異常な大きな正数を勝手に切らず、欠損のみ除外", () => {
    expect(
      pairs([{ ...r, height_cm: 400, weight_kg: 999 }], "height_cm"),
    ).toHaveLength(1);
    expect(
      pairs([{ ...r, height_cm: "180" } as unknown as Rikishi], "height_cm"),
    ).toHaveLength(0);
  });
});
