import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  HashRouter,
  NavLink,
  Link,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import * as echarts from "echarts/core";
import type { EChartsOption } from "echarts";
import { ScatterChart, BarChart, BoxplotChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  MarkLineComponent,
} from "echarts/components";
import { SVGRenderer } from "echarts/renderers";
echarts.use([
  ScatterChart,
  BarChart,
  BoxplotChart,
  GridComponent,
  TooltipComponent,
  MarkLineComponent,
  SVGRenderer,
]);
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronRight,
  FlaskConical,
  GitCompareArrows,
  Info,
  Scale,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import {
  records,
  meta,
  divisions,
  labels,
  colors,
  readFilters,
  filterRows,
  positive,
  finite,
  avg,
  median,
  quantile,
  bmi,
  winRate,
  age,
  fmt,
  pairs,
  pearson,
  summary,
  type Rikishi,
  type Filters,
} from "./data";
import "./style.css";
const routes = [
  ["/", "概要", Activity],
  ["/physique", "体格分析", Scale],
  ["/performance", "体格 × 成績", BarChart3],
  ["/compare", "力士比較", GitCompareArrows],
  ["/methodology", "データと定義", FlaskConical],
] as const;
function Chart({
  option,
  onPick,
  label,
}: {
  option: EChartsOption;
  onPick?: (id: string) => void;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const c = echarts.init(ref.current, undefined, { renderer: "svg" });
    c.setOption(option);
    c.on("click", (e: unknown) => {
      const d = (e as { data?: { id?: string } }).data;
      if (d?.id) onPick?.(d.id);
    });
    const ro = new ResizeObserver(() => c.resize());
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      c.dispose();
    };
  }, [option, onPick]);
  return <div ref={ref} className="chart" role="img" aria-label={label} />;
}
const grid = { left: 52, right: 22, top: 35, bottom: 54 };
const axis = (name: string) => ({
  name,
  nameLocation: "middle" as const,
  nameGap: 33,
  nameTextStyle: { color: "#a3a5ae" },
  axisLabel: { color: "#a3a5ae" },
  splitLine: { lineStyle: { color: "#ffffff0c" } },
  axisLine: { lineStyle: { color: "#484b52" } },
});
function Panel({
  title,
  children,
  aside,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-head">
        <div>
          <h2>{title}</h2>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}
function Scatter({
  rows,
  performance = false,
  height = false,
  add,
}: {
  rows: Rikishi[];
  performance?: boolean;
  height?: boolean;
  add: (id: string) => void;
}) {
  const [reg, setReg] = useState(false),
    [points, setPoints] = useState(true),
    [opacity, setOpacity] = useState<Record<string, number>>({}),
    [hidden, setHidden] = useState<string[]>([]);
  const key = height || !performance ? "height_cm" : "weight_kg",
    ps = pairs(rows, key, performance),
    ds = divisions.filter((d) => rows.some((r) => r.division === d));
  const option: EChartsOption = {
    animation: false,
    color: ds.map((d) => colors[d]),
    grid,
    tooltip: {
      trigger: "item",
      confine: true,
      renderMode: "richText",
      formatter: (v: unknown) => {
        const d = (v as { data: { id: string; value: number[] } }).data,
          r = records.find((r) => r.rikishi_id === d?.id);
        return r
          ? `${r.shikona}\n${r.rank_raw}\n${fmt(r.height_cm)} cm / ${fmt(r.weight_kg)} kg\n${performance ? "生涯勝率 " + fmt(winRate(r)! * 100) + " %\n" : ""}選択すると比較に追加`
          : "";
      },
    },
    xAxis: {
      ...axis(key === "height_cm" ? "身長（cm）" : "体重（kg）"),
      scale: true,
    },
    yAxis: {
      ...axis(performance ? "生涯勝率（%）" : "体重（kg）"),
      scale: !performance,
      ...(performance ? { min: 0, max: 100 } : {}),
    },
    series: ds
      .filter((d) => !hidden.includes(d))
      .map((d) => {
        const data = ps.filter((p) => p.r.division === d),
          xy = data.map((p) => [p.x, p.y]),
          mx = avg(xy.map((p) => p[0])) || 0,
          my = avg(xy.map((p) => p[1])) || 0,
          den = xy.reduce((s, p) => s + (p[0] - mx) ** 2, 0),
          slope = den
            ? xy.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0) / den
            : 0,
          xs = xy.map((p) => p[0]),
          lo = Math.min(...xs),
          hi = Math.max(...xs);
        return {
          type: "scatter",
          name: labels[d],
          symbol: d === "juryo" ? "diamond" : "circle",
          symbolSize: points ? 9 : 0,
          itemStyle: { color: colors[d], opacity: opacity[d] ?? 0.75 },
          data: data.map((p) => ({ value: [p.x, p.y], id: p.r.rikishi_id })),
          ...(performance && reg && data.length >= 10 && den > 0
            ? {
                markLine: {
                  silent: true,
                  symbol: ["none", "none"],
                  lineStyle: { color: colors[d], type: "dashed" },
                  data: [
                    [
                      { coord: [lo, my + slope * (lo - mx)] },
                      { coord: [hi, my + slope * (hi - mx)] },
                    ],
                  ],
                },
              }
            : {}),
        };
      }),
  };
  return (
    <>
      <div className="chart-tools">
        <div className="legend">
          {ds.map((d) => (
            <button
              key={d}
              className={hidden.includes(d) ? "muted" : ""}
              aria-pressed={!hidden.includes(d)}
              onClick={() =>
                setHidden(
                  hidden.includes(d)
                    ? hidden.filter((x) => x !== d)
                    : [...hidden, d],
                )
              }
            >
              <i style={{ background: colors[d] }} />
              {labels[d]}
            </button>
          ))}
        </div>
        {performance && (
          <label>
            <input
              type="checkbox"
              checked={reg}
              onChange={(e) => setReg(e.target.checked)}
            />{" "}
            回帰線
          </label>
        )}
      </div>
      {points ? (
        <>
          {" "}
          <Chart
            option={option}
            onPick={add}
            label={`${key === "height_cm" ? "身長" : "体重"}と${performance ? "生涯勝率" : "体重"}の散布図、有効${ps.length}人`}
          />
        </>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>階級</th>
                <th>有効 n / 除外</th>
                <th>{key === "height_cm" ? "平均身長 cm" : "平均体重 kg"}</th>
                <th>{performance ? "平均勝率 %" : "平均体重 kg"}</th>
              </tr>
            </thead>
            <tbody>
              {ds.map((d) => {
                const pp = ps.filter((p) => p.r.division === d);
                return (
                  <tr key={d}>
                    <th>{labels[d]}</th>
                    <td>
                      {pp.length} /{" "}
                      {rows.filter((r) => r.division === d).length - pp.length}
                    </td>
                    <td>{fmt(avg(pp.map((p) => p.x)))}</td>
                    <td>{fmt(avg(pp.map((p) => p.y)))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="caption">
            個別点を非表示にした集計ビュー。同じ有効ペアから平均を算出。
          </p>
        </div>
      )}
      <div className="chart-foot">
        <span>
          有効 n = {ps.length} · 表示{" "}
          {ps.filter((p) => !hidden.includes(p.r.division)).length}人 ·
          欠損等除外 {rows.length - ps.length}人
        </span>
        <span>点を選択 → 比較に追加</span>
      </div>
      {ds.length > 2 && (
        <div className="chart-tools">
          <label>
            <input
              type="checkbox"
              checked={points}
              onChange={(e) => setPoints(e.target.checked)}
            />{" "}
            個別点を表示
          </label>
          {ds.map((d) => (
            <label key={d}>
              {labels[d]}の透明度{" "}
              <input
                aria-label={`${labels[d]}の透明度`}
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={opacity[d] ?? 0.75}
                onChange={(e) =>
                  setOpacity({ ...opacity, [d]: +e.target.value })
                }
              />
            </label>
          ))}
          {!points && <span>集計ビュー：下の階級別比較を参照</span>}
        </div>
      )}
      <p className="caption">
        {performance
          ? "力士ごとの生涯勝率との関連。相関は因果を示しません。"
          : "点は1人の力士。身長と体重の組み合わせから、体格の広がりを見ます。"}
      </p>
    </>
  );
}
function DivisionPanel({ rows }: { rows: Rikishi[] }) {
  const [stat, setStat] = useState("mean");
  const ss = summary(rows);
  const option: EChartsOption = {
    animation: false,
    grid: { ...grid, left: 55 },
    tooltip: { trigger: "item", confine: true },
    xAxis: {
      ...axis("階級"),
      type: "category",
      axisLabel: { color: "#a3a5ae", interval: 0, fontSize: 10 },
      data: divisions.map((d) => labels[d]),
    },
    yAxis: { ...axis("体重（kg）"), min: 0 },
    series: [
      {
        type: "bar",
        barWidth: "38%",
        data: ss.map((s) => ({
          value: stat === "mean" ? s.mean : s.median,
          itemStyle: { color: colors[s.division], borderRadius: [4, 4, 0, 0] },
        })),
      },
    ],
  };
  return (
    <Panel
      title="階級別の体格"

      aside={
        <select
          aria-label="階級比較の統計"
          value={stat}
          onChange={(e) => setStat(e.target.value)}
        >
          <option value="mean">平均体重</option>
          <option value="median">中央値体重</option>
        </select>
      }
    >
      <p className="caption">
        全6階級サマリー · 階級選択のみ適用せず、その他の共通フィルターを適用
      </p>
      <Chart option={option} label="全6階級の体重比較" />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>階級</th>
              <th>全人数</th>
              <th>有効 n / 除外</th>
              <th>平均 kg</th>
              <th>中央値 kg</th>
              <th>最小 / Q1 / 中央 / Q3 / 最大 kg</th>
            </tr>
          </thead>
          <tbody>
            {ss.map((s) => (
              <tr key={s.division}>
                <th>
                  <i
                    className="dot"
                    style={{ background: colors[s.division] }}
                  />
                  {labels[s.division]}
                </th>
                <td>{s.n}</td>
                <td>
                  {s.valid} / {s.excluded}
                </td>
                <td>{fmt(s.mean)}</td>
                <td>{fmt(s.median)}</td>
                <td>{s.five.map((x) => fmt(x)).join(" / ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="caption">
        統計単位は全階級とも「力士1人」。有効値だけで算出。n &lt; 5
        は分布の解釈に注意。
      </p>
    </Panel>
  );
}
function Ranking({
  rows,
  add,
  short = false,
}: {
  rows: Rikishi[];
  add: (id: string) => void;
  short?: boolean;
}) {
  const [p, setP] = useSearchParams();
  const metric = short ? "weight_kg" : p.get("metric") || "weight_kg",
    asc = !short && p.get("order") === "asc",
    page = Math.max(0, Number(p.get("page")) || 0);
  const value = (r: Rikishi) =>
    metric === "bmi"
      ? bmi(r)
      : metric === "height_cm"
        ? r.height_cm
        : r.weight_kg;
  const valid = rows.filter((r) => positive(value(r))),
    sorted = [...valid].sort(
      (a, b) =>
        (asc ? 1 : -1) * (value(a)! - value(b)!) ||
        a.rikishi_id.localeCompare(b.rikishi_id),
    );
  const size = short ? 10 : 15;
  const safePage = Math.min(
    page,
    Math.max(0, Math.ceil(sorted.length / size) - 1),
  );
  const set = (k: string, v: string) => {
    const q = new URLSearchParams(p);
    q.set(k, v);
    if (k !== "page") q.delete("page");
    setP(q);
  };
  return (
    <Panel
      title={short ? "体重ランキング · TOP 10" : "体格ランキング"}

      aside={
        short ? (
          <Link to={`/physique?${p}`}>
            もっと見る <ArrowUpRight size={15} />
          </Link>
        ) : undefined
      }
    >
      {!short && (
        <div className="chart-tools">
          <select
            aria-label="ランキング指標"
            value={metric}
            onChange={(e) => set("metric", e.target.value)}
          >
            <option value="weight_kg">体重 kg</option>
            <option value="height_cm">身長 cm</option>
            <option value="bmi">BMI</option>
          </select>
          <button onClick={() => set("order", asc ? "desc" : "asc")}>
            {asc ? "昇順 ↑" : "降順 ↓"}
          </button>
        </div>
      )}
      <p className="caption">
        n = {valid.length} · 欠損等除外 {rows.length - valid.length}人 ·
        同値はID順
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>四股名 / 番付</th>
              <th>階級</th>
              <th>身長 cm</th>
              <th>体重 kg</th>
              <th>BMI</th>
              <th>比較</th>
            </tr>
          </thead>
          <tbody>
            {sorted
              .slice(
                short ? 0 : safePage * size,
                short ? 10 : (safePage + 1) * size,
              )
              .map((r, i) => (
                <tr key={r.rikishi_id}>
                  <td className="rank-no">
                    {(short ? 0 : safePage * size) + i + 1}
                  </td>
                  <th>
                    <span className="name">{r.shikona}</span>
                    <small>{r.rank_raw}</small>
                  </th>
                  <td>
                    <span style={{ color: colors[r.division] }}>
                      {labels[r.division]}
                    </span>
                  </td>
                  <td>{fmt(r.height_cm)}</td>
                  <td className="strong">{fmt(r.weight_kg)}</td>
                  <td>{fmt(bmi(r))}</td>
                  <td>
                    <button
                      aria-label={`${r.shikona}を比較に追加`}
                      onClick={() => add(r.rikishi_id)}
                    >
                      ＋
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {!valid.length && (
        <p className="empty">
          該当データがありません。絞り込みを変更してください。
        </p>
      )}
      {!short && (
        <div className="pagination">
          <button
            disabled={safePage === 0}
            onClick={() => set("page", String(safePage - 1))}
          >
            前へ
          </button>
          <span>
            {safePage + 1} / {Math.max(1, Math.ceil(sorted.length / size))}
          </span>
          <button
            disabled={(safePage + 1) * size >= sorted.length}
            onClick={() => set("page", String(safePage + 1))}
          >
            次へ
          </button>
        </div>
      )}
    </Panel>
  );
}
function KPIs({ rows }: { rows: Rikishi[] }) {
  const [kind, setKind] = useState("mean");
  const w = rows.map((r) => r.weight_kg).filter(positive),
    h = rows.map((r) => r.height_cm).filter(positive),
    rates = rows.map(winRate).filter(finite);
  const stat = kind === "median" ? median : avg;
  const cards = [
    ["対象力士数", rows.length, "人", rows.length],
    [
      "体重",
      kind === "count" ? w.length : stat(w),
      kind === "count" ? "人" : "kg",
      w.length,
    ],
    [
      "身長",
      kind === "count" ? h.length : stat(h),
      kind === "count" ? "人" : "cm",
      h.length,
    ],
    [
      "生涯勝率",
      kind === "count" ? rates.length : stat(rates.map((v) => v * 100)),
      kind === "count" ? "人" : "%",
      rates.length,
    ],
  ] as const;
  return (
    <>
      <div className="section-label">
        <span>選択中の力士</span>
        <div className="segmented">
          {[
            ["mean", "平均"],
            ["median", "中央値"],
            ["count", "対象人数"],
          ].map(([v, l]) => (
            <button
              key={v}
              className={kind === v ? "active" : ""}
              onClick={() => setKind(v)}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="kpis">
        {cards.map(([l, v, u, n], i) => (
          <div className="kpi" key={l}>
            <div className="kpi-label">
              {i > 0 && kind !== "count"
                ? kind === "mean"
                  ? "平均"
                  : "中央値"
                : ""}
              {l}
            </div>
            <div className="kpi-number">
              {fmt(v, i === 0 || kind === "count" ? 0 : 1)}
              <span>{u}</span>
            </div>
            <small>
              有効 n = {n} <span>欠損等除外 {rows.length - n}人</span>
            </small>
          </div>
        ))}
      </div>
      <p className="caption">
        平均生涯勝率は各力士の勝率の単純平均です。全試合を合算した勝率とは異なります。
      </p>
    </>
  );
}
function Notables({
  rows,
  add,
}: {
  rows: Rikishi[];
  add: (id: string) => void;
}) {
  const w = rows
      .filter((r) => positive(r.weight_kg))
      .sort((a, b) => b.weight_kg! - a.weight_kg!),
    h = rows
      .filter((r) => positive(r.height_cm))
      .sort((a, b) => b.height_cm! - a.height_cm!);
  const weights = w.map((r) => r.weight_kg!),
    q1 = quantile(weights, 0.25),
    q3 = quantile(weights, 0.75),
    out = w.find(
      (r) =>
        q1 !== null &&
        q3 !== null &&
        (r.weight_kg! > q3 + 1.5 * (q3 - q1) ||
          r.weight_kg! < q1 - 1.5 * (q3 - q1)),
    );
  return (
    <>
      <div className="section-label">
        <span>体格の特徴</span>
      </div>
      <div className="notables">
        {[
          ["最重量", w[0], "weight_kg", "kg"],
          ["最軽量", w.at(-1), "weight_kg", "kg"],
          ["最長身", h[0], "height_cm", "cm"],
          ["最短身", h.at(-1), "height_cm", "cm"],
          ["体重の外れ値", out, "weight_kg", "kg"],
        ].map(([l, row, key, unit]) => {
          const r = row as Rikishi | undefined;
          return (
            <button
              className="notable"
              key={String(l)}
              onClick={() => r && add(r.rikishi_id)}
              disabled={!r}
            >
              <span className="eyebrow">{String(l)}</span>
              <strong>{r?.shikona || "該当なし"}</strong>
              <span>
                {r ? fmt(r[key as "weight_kg" | "height_cm"]) : "—"}{" "}
                <small>{String(unit)}</small>
              </span>
              <small>
                {r ? labels[r.division] : "有効値なし"}{" "}
                <ChevronRight size={14} />
              </small>
            </button>
          );
        })}
      </div>
      <p className="caption">
        絞り込み内の有効測定値で算出（重複あり）。外れ値は体重のQ1−1.5×IQR未満／Q3＋1.5×IQR超のうち最重量の1人。
      </p>
    </>
  );
}
function Distribution({ rows }: { rows: Rikishi[] }) {
  const [metric, setMetric] = useState<"weight_kg" | "height_cm">("weight_kg"),
    [bin, setBin] = useState(10);
  const vals = rows.map((r) => r[metric]).filter(positive),
    low = vals.length ? Math.floor(Math.min(...vals) / bin) * bin : 0,
    high = vals.length ? Math.ceil(Math.max(...vals) / bin) * bin : 0;
  const starts = vals.length
    ? Array.from(
        { length: Math.ceil((high - low) / bin) + 1 },
        (_, i) => low + i * bin,
      )
    : [];
  return (
    <Panel
      title="体格の分布"
      aside={
        <div className="chart-tools">
          <select
            aria-label="分布の指標"
            value={metric}
            onChange={(e) => setMetric(e.target.value as typeof metric)}
          >
            <option value="weight_kg">体重 kg</option>
            <option value="height_cm">身長 cm</option>
          </select>
          <select
            aria-label="ビン幅"
            value={bin}
            onChange={(e) => setBin(+e.target.value)}
          >
            {[5, 10, 20].map((v) => (
              <option key={v} value={v}>
                ビン幅 {v}
              </option>
            ))}
          </select>
        </div>
      }
    >
      <Chart
        label="測定値のヒストグラム"
        option={{
          animation: false,
          grid,
          tooltip: { trigger: "axis", confine: true },
          xAxis: {
            ...axis(
              `${metric === "weight_kg" ? "体重 kg" : "身長 cm"}（左端以上・右端未満）`,
            ),
            type: "category",
            data: starts.map((v) => `${v}–${v + bin}`),
          },
          yAxis: { ...axis("人数（人）"), minInterval: 1 },
          series: [
            {
              type: "bar",
              data: starts.map(
                (v) => vals.filter((x) => x >= v && x < v + bin).length,
              ),
              itemStyle: { color: "#d9b869" },
            },
          ],
        }}
      />
      <p className="caption">
        n = {vals.length} · 欠損等除外 {rows.length - vals.length}人 · ビン幅{" "}
        {bin} {metric === "weight_kg" ? "kg" : "cm"}。人数の分布を表示します。
      </p>
    </Panel>
  );
}
function Boxes({ rows }: { rows: Rikishi[] }) {
  const ss = summary(rows);
  return (
    <Panel title="全6階級の箱ひげ図">
      <p className="caption">
        階級フィルター以外を適用。ひげは最小〜最大、箱はQ1〜Q3、中央線は中央値。
      </p>
      <Chart
        label="全6階級の体重5数要約"
        option={{
          animation: false,
          grid,
          tooltip: { trigger: "item", confine: true },
          xAxis: {
            ...axis("階級"),
            type: "category",
            axisLabel: { color: "#a3a5ae", interval: 0, fontSize: 10 },
            data: divisions.map((d) => labels[d]),
          },
          yAxis: { ...axis("体重（kg）") },
          series: [
            {
              type: "boxplot",
              data: ss.map((s) =>
                s.valid
                  ? {
                      value: s.five as number[],
                      itemStyle: {
                        color: colors[s.division],
                        borderColor: colors[s.division],
                      },
                    }
                  : [],
              ),
            },
          ],
        }}
      />
      <p className="caption">
        {ss
          .map((s) => `${labels[s.division]} n=${s.valid} / 除外${s.excluded}`)
          .join(" · ")}
        。n &lt; 5 では箱ひげ図の解釈に注意。
      </p>
    </Panel>
  );
}
function Performance({
  rows,
  all,
  add,
}: {
  rows: Rikishi[];
  all: Rikishi[];
  add: (id: string) => void;
}) {
  const [scope, setScope] = useState("filtered"),
    [metric, setMetric] = useState<"weight_kg" | "height_cm">("weight_kg");
  const target =
    scope === "all"
      ? all
      : scope === "filtered"
        ? rows
        : all.filter((r) => r.division === scope);
  return (
    <>
      <div className="chart-tools">
        <label>
          表示対象{" "}
          <select value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="filtered">共通フィルター</option>
            <option value="makuuchi">幕内のみ（他の絞込適用）</option>
            <option value="juryo">十両のみ（他の絞込適用）</option>
            <option value="all">全6階級（他の絞込適用）</option>
          </select>
        </label>
      </div>
      <div className="info">
        <Info size={19} />
        <p>
          体格は筋力の測定値ではありません。生涯勝率は対戦相手・在位年数・所属階級・年齢の影響を受け、同階級内でも純粋な強さの指標ではありません。相関
          ≠ 因果。少ない取組数の高勝率にも注意してください。
        </p>
      </div>
      <Panel title="体重と生涯勝率">
        <Scatter rows={target} performance add={add} />
      </Panel>
      <Panel title="身長と生涯勝率">
        <Scatter rows={target} performance height add={add} />
      </Panel>
      <Panel
        title="階級別の相関"
        aside={
          <select
            aria-label="相関の測定指標"
            value={metric}
            onChange={(e) => setMetric(e.target.value as typeof metric)}
          >
            <option value="weight_kg">体重 kg</option>
            <option value="height_cm">身長 cm</option>
          </select>
        }
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>階級</th>
                <th>人数</th>
                <th>有効 n / 除外</th>
                <th>Pearson r</th>
                <th>最小勝率 %</th>
                <th>最大勝率 %</th>
                <th>平均勝率 %</th>
              </tr>
            </thead>
            <tbody>
              {divisions.map((d) => {
                const rs = target.filter((r) => r.division === d),
                  ps = pairs(rs, metric, true),
                  v = ps.map((p) => p.y);
                return (
                  <tr key={d}>
                    <th>{labels[d]}</th>
                    <td>{rs.length}</td>
                    <td>
                      {ps.length} / {rs.length - ps.length}
                    </td>
                    <td>
                      {pearson(ps.map((p) => [p.x, p.y])) === null
                        ? "算出対象外"
                        : fmt(pearson(ps.map((p) => [p.x, p.y])), 3)}
                    </td>
                    <td>{fmt(v.length ? Math.min(...v) : null)}</td>
                    <td>{fmt(v.length ? Math.max(...v) : null)}</td>
                    <td>{fmt(avg(v))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="caption">
          有効ペア n &lt; 10
          または変数の分散0の場合は算出対象外。平均・最大・最小も同じ有効ペアから算出。階級間比較は記述統計です。
        </p>
      </Panel>
      <Panel title="生涯成績一覧">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>四股名</th>
                <th>階級</th>
                <th>勝 / 敗 / 休</th>
                <th>勝率 %</th>
                <th>比較</th>
              </tr>
            </thead>
            <tbody>
              {target.map((r) => (
                <tr key={r.rikishi_id}>
                  <th>{r.shikona}</th>
                  <td>{labels[r.division]}</td>
                  <td>
                    {r.career_wins ?? "—"} / {r.career_losses ?? "—"} /{" "}
                    {r.career_absences ?? "—"}
                  </td>
                  <td>{fmt(winRate(r) === null ? null : winRate(r)! * 100)}</td>
                  <td>
                    <button onClick={() => add(r.rikishi_id)}>＋ 比較</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="caption">
          全 {target.length}人 · 勝率有効 n=
          {target.filter((r) => winRate(r) !== null).length} · 除外
          {target.filter((r) => winRate(r) === null).length}人
        </p>
      </Panel>
    </>
  );
}
function Compare({
  ids,
  add,
  remove,
}: {
  ids: string[];
  add: (id: string) => void;
  remove: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const rs = ids
    .map((id) => records.find((r) => r.rikishi_id === id)!)
    .filter(Boolean);
  const fields: [string, (r: Rikishi) => React.ReactNode][] = [
    ["番付", (r) => r.rank_raw],
    ["階級", (r) => labels[r.division]],
    ["部屋", (r) => r.stable],
    ["年齢", (r) => (finite(age(r)) ? `${age(r)}歳` : "—")],
    ["身長 cm", (r) => fmt(r.height_cm)],
    ["体重 kg", (r) => fmt(r.weight_kg)],
    ["BMI", (r) => fmt(bmi(r))],
    [
      "生涯 勝 / 敗 / 休",
      (r) =>
        `${r.career_wins ?? "—"} / ${r.career_losses ?? "—"} / ${r.career_absences ?? "—"}`,
    ],
    ["生涯勝率 %", (r) => fmt(winRate(r) === null ? null : winRate(r)! * 100)],
    [
      "公式プロフィール",
      (r) =>
        r.source_url ? (
          <a href={r.source_url} target="_blank" rel="noopener noreferrer">
            公式を見る ↗
          </a>
        ) : (
          "—"
        ),
    ],
  ];
  return (
    <>
      <Panel title="比較する力士を選択">
        <p className="caption">
          全階級から2〜4人を選択。共通フィルターに関係なく検索できます。
        </p>
        <label className="search">
          <Search size={17} />
          <input
            aria-label="比較する力士を検索"
            placeholder="四股名・読み・ローマ字で検索"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <div className="candidate-list">
          {records
            .filter((r) => !q || `${r.shikona} ${r.shikona_kana}`.includes(q))
            .map((r) => (
              <button
                key={r.rikishi_id}
                disabled={ids.includes(r.rikishi_id) || ids.length >= 4}
                onClick={() => add(r.rikishi_id)}
              >
                <span>
                  {r.shikona}
                  <small>{labels[r.division]}</small>
                </span>
                {ids.includes(r.rikishi_id) ? (
                  <Check size={16} />
                ) : (
                  <span>＋</span>
                )}
              </button>
            ))}
        </div>
      </Panel>
      {rs.length < 2 ? (
        <div className="empty">
          {rs.length === 0
            ? "比較対象はまだありません。"
            : "あと1人選ぶと比較が表示されます。"}
          <p>選択中 {rs.length} / 4人</p>
          {rs.map((r) => (
            <button key={r.rikishi_id} onClick={() => remove(r.rikishi_id)}>
              {r.shikona} ×
            </button>
          ))}
        </div>
      ) : (
        <>
          <Panel title="身長・体重の差">
            <p className="caption">
              先頭の力士を基準とした差分。各測定の有効 n と除外を表示。
            </p>
            {(["weight_kg", "height_cm"] as const).map((key) => {
              const unit = key === "weight_kg" ? "kg" : "cm",
                valid = rs.filter((r) => positive(r[key]));
              return (
                <div className="difference" key={key}>
                  <h3>
                    {key === "weight_kg" ? "体重" : "身長"} · n={valid.length} /
                    除外 {rs.length - valid.length}人
                  </h3>
                  {rs.map((r) => {
                    const v = r[key],
                      base = rs[0][key],
                      delta = positive(v) && positive(base) ? v - base : null;
                    return (
                      <div key={r.rikishi_id}>
                        <span>{r.shikona}</span>
                        <div className="bar-track">
                          <i
                            style={{
                              width: positive(v)
                                ? `${Math.min(100, (v / (key === "weight_kg" ? 300 : 220)) * 100)}%`
                                : "0",
                              background: colors[r.division],
                            }}
                          />
                        </div>
                        <strong>
                          {fmt(v)} {unit}{" "}
                          <small>
                            (
                            {delta === null
                              ? "—"
                              : `${delta > 0 ? "+" : ""}${fmt(delta)}`}
                            )
                          </small>
                        </strong>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </Panel>
          <Panel title="プロフィール・成績比較">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>比較項目</th>
                    {rs.map((r) => (
                      <th key={r.rikishi_id}>
                        {r.shikona}{" "}
                        <button
                          aria-label={`${r.shikona}を比較から削除`}
                          onClick={() => remove(r.rikishi_id)}
                        >
                          ×
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fields.map(([l, get]) => (
                    <tr key={l}>
                      <th>{l}</th>
                      {rs.map((r) => (
                        <td key={r.rikishi_id}>{get(r)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="caption">成績基準: {meta.performance_as_of}。</p>
          </Panel>
        </>
      )}
    </>
  );
}
function Methodology() {
  return (
    <>
      <Panel title="データの出典">
        <dl>
          <dt>提供元</dt>
          <dd>
            <a href={meta.source_url} target="_blank" rel="noopener noreferrer">
              Sumo API ↗
            </a>
            （非公式データベース）。日本相撲協会の公式サービスではありません。
          </dd>
          <dt>取得日時</dt>
          <dd>
            {new Date(meta.retrieved_at_utc).toLocaleString("ja-JP", {
              timeZone: "Asia/Tokyo",
            })}{" "}
            JST
          </dd>
          <dt>番付・プロフィール</dt>
          <dd>
            {meta.banzuke_basho}。提供元更新日：
            {meta.profile_updated_min.slice(0, 10)} 〜{" "}
            {meta.profile_updated_max.slice(0, 10)}
            。古い情報が含まれる場合があります。
          </dd>
          <dt>成績</dt>
          <dd>
            {meta.performance_as_of}
            。各力士のAPI通算成績を使用し、休場は勝率の分母に含めません。取組の確定時点はAPIからは確認できません。
          </dd>
          <dt>対象と欠損</dt>
          <dd>
            APIが現役として返した6階級の力士。協会の番付人数との照合は未実施です。出身地は提供元表記を使用。読みがない場合はローマ字名でも検索できます。最高位は未取得です。
          </dd>
        </dl>
      </Panel>
      <Panel title="データ収録状況">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>階級</th>
                <th>収録人数</th>
                <th>身長・体重あり</th>
                <th>通算勝敗あり</th>
              </tr>
            </thead>
            <tbody>
              {divisions.map((d) => {
                const rs = records.filter((r) => r.division === d);
                return (
                  <tr key={d}>
                    <th>{labels[d]}</th>
                    <td>{rs.length}</td>
                    <td>
                      {
                        rs.filter(
                          (r) => positive(r.height_cm) && positive(r.weight_kg),
                        ).length
                      }
                    </td>
                    <td>
                      {
                        rs.filter(
                          (r) =>
                            finite(r.career_wins) && finite(r.career_losses),
                        ).length
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="指標と欠損の定義">
        <dl>
          <dt>BMI</dt>
          <dd>
            体重kg ÷ (身長cm ÷
            100)²。両測定値が正数の場合のみ算出。筋肉量や健康状態の評価には用いません。
          </dd>
          <dt>生涯勝率</dt>
          <dd>
            勝数 ÷ (勝数 ＋ 敗数)。休場は分母に含めません。0勝0敗・欠損は
            —。幕内戦績を非幕内力士の0%として利用しません。
          </dd>
          <dt>平均・中央値</dt>
          <dd>
            有効値を持つ力士の単純平均／中央値。偶数件の中央値は中央2値の平均。四分位数は線形補間。各図表に有効人数と除外件数を表示します。
          </dd>
          <dt>Pearson相関</dt>
          <dd>
            有効ペア10件以上、両変数の分散が正の場合に算出。有意性や因果関係は断定しません。回帰線は階級ごとの最小二乗直線です。
          </dd>
          <dt>欠損処理</dt>
          <dd>
            null・非数値・非正の測定値を該当指標から除外。代わりに0を描画しません。年齢は基準日で計算します。取得失敗時は既存ファイルを上書きしません。
          </dd>
          <dt>比較の限界</dt>
          <dd>
            最新一時点のみ。年齢・階級・対戦相手等を調整した因果推論ではありません。少数件や新弟子の見かけの高勝率、測定時点の違いに注意。直近6場所勝率は未実装です。
          </dd>
        </dl>
      </Panel>
    </>
  );
}
function App() {
  const [params, setParams] = useSearchParams(),
    loc = useLocation(),
    f = readFilters(params),
    rows = filterRows(records, f),
    all = filterRows(records, f, true);
  const ids = (params.get("compare") || "")
    .split(",")
    .filter(
      (v, i, a) =>
        records.some((r) => r.rikishi_id === v) && a.indexOf(v) === i,
    )
    .slice(0, 4);
  const [toast, setToast] = useState("");
  const [detail, setDetail] = useState(false);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(t);
  }, [toast]);
  const update = (patch: Partial<Filters>) => {
    const next = { ...f, ...patch },
      p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v === "") p.delete(k);
      else p.set(k, Array.isArray(v) ? v.join(",") : v);
    }
    p.delete("page");
    setParams(p);
  };
  const add = (id: string) => {
    if (ids.includes(id)) {
      setToast("すでに比較に追加されています");
      return;
    }
    if (ids.length >= 4) {
      setToast("比較は4人までです。比較画面で削除してください");
      return;
    }
    const p = new URLSearchParams(params);
    p.set("compare", [...ids, id].join(","));
    setParams(p);
    setToast("比較に追加しました");
  };
  const remove = (id: string) => {
    const p = new URLSearchParams(params);
    p.set("compare", ids.filter((x) => x !== id).join(","));
    setParams(p);
  };
  const page = routes.find((r) => r[0] === loc.pathname);
  const title = page?.[1] || "ページが見つかりません";
  const query = params.toString();
  return (
    <>
      <a
        className="skip"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        本文へ移動
      </a>
      <aside className="sidebar">
        <Link className="brand" to={`/?${query}`}>
          <span className="brand-icon">相</span>
          <span>
            SUMO<span>PHYSIQUE LAB</span>
          </span>
        </Link>
        <nav>
          {routes.map(([path, label, Icon]) => (
            <NavLink key={path} to={`${path}?${query}`} end={path === "/"}>
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="shell">
        <header>
          <div>
            <span className="breadcrumb">SUMO PHYSIQUE LAB</span>
            <ChevronRight size={13} />
            <strong>{title}</strong>
          </div>
          <span className="demo-badge">
            <i /> 実データ / Sumo API
          </span>
        </header>
        <nav className="mobile-nav">
          {routes.map(([path, label]) => (
            <NavLink key={path} to={`${path}?${query}`} end={path === "/"}>
              {label}
            </NavLink>
          ))}
        </nav>
        <main id="main" tabIndex={-1}>
          <div className="hero">
            <h1>{title}</h1>
            <p>
              {loc.pathname === "/"
                ? "力士の身長・体重と通算成績を確認できます。"
                : loc.pathname === "/compare"
                  ? "2〜4人のプロフィールと成績を比較できます。"
                  : loc.pathname === "/methodology"
                    ? "出典、取得日時、指標の計算方法。"
                    : "階級や力士名で絞り込めます。"}
            </p>
            <div className="snapshot">
              <span>取得日：{meta.reference_date}</span>
              <span>収録：{records.length}人</span>
              <a
                href={meta.source_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                出典：Sumo API ↗
              </a>
            </div>
          </div>
          {!["/compare", "/methodology"].includes(loc.pathname) && (
            <section className="filters" aria-label="共通フィルター">
              <div className="filter-top">
                <div className="quick">
                  {[
                    ["幕内・十両", ["makuuchi", "juryo"]],
                    ["幕内のみ", ["makuuchi"]],
                    ["十両のみ", ["juryo"]],
                    ["全階級", [...divisions]],
                  ].map(([l, ds]) => (
                    <button
                      key={String(l)}
                      className={
                        JSON.stringify(f.divisions) === JSON.stringify(ds)
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        update({ divisions: ds as Filters["divisions"] })
                      }
                    >
                      {String(l)}
                    </button>
                  ))}
                </div>
                <div className="filter-right">
                  <label className="search">
                    <Search size={16} />
                    <input
                      aria-label="力士名検索"
                      placeholder="力士名で検索"
                      value={f.q}
                      onChange={(e) => update({ q: e.target.value })}
                    />
                  </label>
                  <button
                    className={detail ? "active" : ""}
                    onClick={() => setDetail(!detail)}
                    aria-expanded={detail}
                  >
                    <SlidersHorizontal size={16} /> 絞り込み
                  </button>
                </div>
              </div>
              {detail && (
                <div className="filter-detail">
                  <fieldset>
                    <legend>階級（複数選択）</legend>
                    {divisions.map((d) => (
                      <label key={d}>
                        <input
                          type="checkbox"
                          checked={f.divisions.includes(d)}
                          onChange={() =>
                            update({
                              divisions: f.divisions.includes(d)
                                ? f.divisions.filter((x) => x !== d)
                                : [...f.divisions, d],
                            })
                          }
                        />
                        {labels[d]}
                      </label>
                    ))}
                  </fieldset>
                  <label>
                    所属部屋
                    <select
                      value={f.stable}
                      onChange={(e) => update({ stable: e.target.value })}
                    >
                      <option value="">すべて</option>
                      {[...new Set(records.map((r) => r.stable))].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    出身地
                    <select
                      value={f.birthplace}
                      onChange={(e) => update({ birthplace: e.target.value })}
                    >
                      <option value="">すべて</option>
                      {[...new Set(records.map((r) => r.birthplace))].map(
                        (s) => (
                          <option key={s}>{s}</option>
                        ),
                      )}
                    </select>
                  </label>
                  {[
                    ["年齢（歳）", "minAge", "maxAge"],
                    ["身長（cm）", "minH", "maxH"],
                    ["体重（kg）", "minW", "maxW"],
                  ].map(([l, a, b]) => (
                    <label key={l}>
                      {l}
                      <div className="range">
                        <input
                          aria-label={`${l}下限`}
                          type="number"
                          min="0"
                          value={String(f[a as keyof Filters])}
                          onChange={(e) => update({ [a]: e.target.value })}
                          placeholder="下限"
                        />
                        <span>〜</span>
                        <input
                          aria-label={`${l}上限`}
                          type="number"
                          min="0"
                          value={String(f[b as keyof Filters])}
                          onChange={(e) => update({ [b]: e.target.value })}
                          placeholder="上限"
                        />
                      </div>
                    </label>
                  ))}
                  <button
                    onClick={() => {
                      setParams({});
                      setToast("フィルターを初期化しました");
                    }}
                  >
                    初期化
                  </button>
                </div>
              )}
              <div className="filter-summary">
                <span>
                  <Users size={13} />{" "}
                  {f.divisions.map((d) => labels[d]).join("・") || "階級未選択"}{" "}
                  <strong>{rows.length}人</strong>
                </span>
                <span>出典：Sumo API</span>
              </div>
            </section>
          )}
          {loc.pathname === "/" ? (
            <>
              <KPIs rows={rows} />
              <Panel
                title="身長と体重"

                aside={<span className="tag">選択中の階級</span>}
              >
                <Scatter rows={rows} add={add} />
              </Panel>
              <Panel
                title="体重と生涯勝率"

                aside={
                  <Link to={`/performance?${query}`}>
                    詳しく分析 <ArrowUpRight size={16} />
                  </Link>
                }
              >
                <Scatter rows={rows} performance add={add} />
                <p className="caption">
                  体格 ≠
                  筋力。生涯勝率は年齢・在位年数・対戦相手等の影響を受けます。
                </p>
              </Panel>
              <Notables rows={rows} add={add} />
              <DivisionPanel rows={all} />
              <Ranking rows={rows} add={add} short />
              <div className="end-links">
                <Link to={`/physique?${query}`}>
                  体格分析へ <ArrowUpRight />
                </Link>
                <Link to={`/performance?${query}`}>
                  体格 × 成績へ <ArrowUpRight />
                </Link>
              </div>
            </>
          ) : loc.pathname === "/physique" ? (
            <>
              <div className="tabs">
                {[
                  ["ranking", "ランキング"],
                  ["distribution", "分布"],
                  ["divisions", "階級比較"],
                ].map(([v, l]) => (
                  <button
                    key={v}
                    className={
                      (params.get("tab") || "ranking") === v ? "active" : ""
                    }
                    onClick={() => {
                      const p = new URLSearchParams(params);
                      p.set("tab", v);
                      setParams(p);
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
              {params.get("tab") === "distribution" ? (
                <Distribution rows={rows} />
              ) : params.get("tab") === "divisions" ? (
                <Boxes rows={all} />
              ) : (
                <Ranking rows={rows} add={add} />
              )}
              <DivisionPanel rows={all} />
            </>
          ) : loc.pathname === "/performance" ? (
            <Performance rows={rows} all={all} add={add} />
          ) : loc.pathname === "/compare" ? (
            <Compare ids={ids} add={add} remove={remove} />
          ) : loc.pathname === "/methodology" ? (
            <Methodology />
          ) : loc.pathname === "/styles" ? (
            <Panel title="決まり手分析は準備中">
              <p>期間と取組母数、利用条件を確認できるまで有効化しません。</p>
            </Panel>
          ) : (
            <div className="empty">
              ページが見つかりません。<Link to="/">概要へ</Link>
            </div>
          )}
          <footer>
            <span>
              SUMO PHYSIQUE LAB <small>大相撲フィジカル研究所</small>
            </span>
            <p>出典：Sumo API · 非公式サイト</p>
            <Link to={`/methodology?${query}`}>データと定義 ↗</Link>
          </footer>
        </main>
      </div>
      {ids.length > 0 && (
        <div className="compare-tray">
          <span>
            <GitCompareArrows size={18} />
            比較リスト <strong>{ids.length}/4</strong>
          </span>
          <Link to={`/compare?${query}`}>
            比較する <ArrowUpRight size={17} />
          </Link>
          <button
            aria-label="比較リストをクリア"
            onClick={() => {
              const p = new URLSearchParams(params);
              p.delete("compare");
              setParams(p);
            }}
          >
            <X size={17} />
          </button>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}
class AppBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main>
        <span className="demo-badge">実データ / Sumo API</span>
        <h1>データの表示に失敗しました</h1>
        <p>
          読み込み又は描画に失敗しました。0値として表示はしません。ページを再読み込みしてください。
        </p>
        <button onClick={() => window.location.reload()}>再読み込み</button>
      </main>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppBoundary>
      <HashRouter>
        <App />
      </HashRouter>
    </AppBoundary>
  </React.StrictMode>,
);
