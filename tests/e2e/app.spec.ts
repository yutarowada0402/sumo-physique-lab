import { test, expect, type Page } from "@playwright/test";
async function open(page: Page, url: string) {
  await page.goto(url);
  await page.locator("h1").click({ force: true });
}

test("初期対象、フィルター、戻る、比較、直リンク", async ({
  page,
  isMobile,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page, "./");
  await expect(
    page.getByRole("heading", { name: /関取の体格を、\s*データで見る。/ }),
  ).toBeVisible();
  await expect(page.locator(".filter-summary")).toContainText("70人");
  await expect(page.locator(".demo-badge")).toBeVisible();
  const quick = page.getByRole("button", { name: "全階級", exact: true });
  // Dispatch inputs directly: this static UI has no transitions.
  // Verify resulting URLs/data; headless frame scheduling may otherwise idle.
  await expect(quick).toBeVisible();
  await expect(quick).toBeEnabled();
  if (isMobile) await quick.tap({ force: true });
  else await quick.click({ force: true });
  await expect(page.locator(".filter-summary")).toContainText("296人");
  await expect(page).toHaveURL(/divisions=makuuchi/);
  await page.goBack();
  await expect(page.locator(".filter-summary")).toContainText("70人");
  await page.locator(".chart").first().locator("svg").waitFor();
  const point = page
    .locator(".chart")
    .first()
    .locator('svg path[fill="#e46164"]')
    .first();
  if (isMobile) await point.tap({ force: true });
  else await point.click({ force: true });
  await expect(page.locator(".compare-tray")).toContainText("1/4");
  await open(page, "./#/compare");
  await expect(page.getByText("比較対象はまだありません。")).toBeVisible();
  await page.getByRole("textbox", { name: "比較する力士を検索" }).fill("紫雲");
  await expect(page.locator(".candidate-list")).toContainText("序ノ口");
  await page.getByRole("textbox", { name: "比較する力士を検索" }).fill("");
  for (let i = 0; i < 4; i++) {
    await page
      .locator(".candidate-list>button:enabled")
      .first()
      .click({ force: true });
    await expect(page.locator(".compare-tray")).toContainText(`${i + 1}/4`);
  }
  await expect(page.locator(".compare-tray")).toContainText("4/4");
  await expect(page.locator(".candidate-list>button:enabled")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "プロフィール・成績比較" }),
  ).toBeVisible();
  await open(page, "./#/physique?divisions=juryo&tab=distribution");
  await expect(
    page.getByRole("heading", { name: "体格の分布", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".filter-summary")).toContainText("28人");
  await open(page, "./#/performance");
  await expect(
    page.getByText("相関 ≠ 因果。", { exact: false }),
  ).not.toHaveCount(0);
  await open(page, "./#/methodology");
  await expect(
    page.getByRole("heading", { name: "カバレッジ（DEMO合成件数）" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("無データとモバイルスクリーン", async ({ page }, info) => {
  await open(page, "./#/");
  await page.getByRole("textbox", { name: "力士名検索" }).fill("該当なし架空");
  await expect(page.locator(".filter-summary")).toContainText("0人");
  await expect(
    page.getByText("該当データがありません。絞り込みを変更してください。"),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await open(page, "./#/");
  await page.locator(".chart svg").first().waitFor();
  await page.screenshot({
    path: `docs/preview-${info.project.name}.png`,
    fullPage: true,
  });
});

test("体格分析のタブ・ソート・ページと集計ビュー", async ({ page }) => {
  await open(page, "./#/physique");
  await page
    .getByRole("combobox", { name: "ランキング指標" })
    .selectOption("height_cm");
  await page.getByRole("button", { name: "降順 ↓" }).click({ force: true });
  await expect(page).toHaveURL(/order=asc/);
  await page
    .getByRole("button", { name: "次へ", exact: true })
    .click({ force: true });
  await expect(page).toHaveURL(/page=1/);
  await page
    .getByRole("button", { name: "階級比較", exact: true })
    .click({ force: true });
  await expect(
    page.getByRole("heading", { name: "全6階級の箱ひげ図" }),
  ).toBeVisible();
  await open(page, "./#/");
  await page
    .getByRole("button", { name: "全階級", exact: true })
    .click({ force: true });
  const panel = page.locator(".panel").first();
  await panel
    .getByRole("checkbox", { name: "個別点を表示" })
    .uncheck({ force: true });
  await expect(
    panel.getByText("個別点を非表示にした集計ビュー。", { exact: false }),
  ).toBeVisible();
  await expect(panel.locator("tbody tr")).toHaveCount(6);
  await page
    .getByRole("button", { name: "絞り込み", exact: true })
    .click({ force: true });
  await page.getByRole("spinbutton", { name: "体重（kg）下限" }).fill("180");
  await expect(page).toHaveURL(/minW=180/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
