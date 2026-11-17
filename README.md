# SUMO PHYSIQUE LAB

力士の身長・体重・通算成績を検索・比較する静的ダッシュボード。React / TypeScript / Vite / ECharts。

データは [Sumo API](https://sumo-api.com/) の現役力士一覧と通算成績を使用。日本相撲協会の公式サービスではありません。収録数・取得日時・提供元の更新期間は画面の「データと定義」で確認できます。

公開先: https://yutarowada0402.github.io/sumo-physique-lab/

## 起動

Node.js 22、Python 3.12以上を推奨。

```sh
npm ci
npm run dev
```

開発URL: http://127.0.0.1:5173/sumo-physique-lab/

## データ更新

```sh
python3 -m pipeline.collect
python3 pipeline/validate.py
```

公開APIへ1件ずつ、リクエスト間隔1秒以上でアクセス。エラー・429・不完全なレスポンスで停止し、既存スナップショットは維持します。当日分の成績キャッシュは `data/raw/stats/` に保存（Git対象外）。全件取得・検証後に `data/real/snapshot.json` を置き換えます。公式サイトの巡回、写真・HTML・文章の取得はしません。

手動の「Collect Sumo API snapshot」ワークフローでも取得でき、成果物をダウンロードできます。自動コミットや定期巡回はありません。スナップショットを更新・レビュー後、通常のPagesデプロイを実行します。

番付・体格には提供元の古い更新値が含まれる場合があります。協会の番付との照合は未実施です。通算成績の場所・日目ごとの確定時刻はAPIから確認できません。出身地は提供元の表記、読みがない力士はローマ字名でも検索できます。最高位・履歴・決まり手は未取得です。

## 検証

```sh
npm run typecheck
npm run lint
npm test
python3 -m unittest discover -s tests -p 'test_*.py'
python3 pipeline/validate.py
npm run build
npm run test:e2e
```

実データスナップショットのみビルド可能（`VITE_DATA_MODE=real` が既定）。架空データは `data/demo/` に開発履歴として残っていますが、アプリは読み込みません。

## 画面

- 概要：平均・中央値、身長と体重、体重と勝率、階級別集計
- 体格分析：ランキング、分布、箱ひげ図
- 体格×成績：階級別相関と通算成績
- 力士比較：全階級から2〜4人を選択
- データと定義：出典、更新日、収録状況、指標の計算方法

検索条件と比較リストはURLに保存されます。GitHub Pagesはmainへのpushで品質検査・E2E後に公開。`BASE_PATH` の既定は `/sumo-physique-lab/`。

[データ取得方針](docs/data-rights.md) / [データ辞書](docs/data-dictionary.md) / [集計方法](docs/methodology.md)
