# SUMO PHYSIQUE LAB

大相撲フィジカル研究所。React + TypeScript + Vite + Apache ECharts の静的ダッシュボード。**DEMO / 全件架空データ**。非公式サービスです。

## 起動と検証

Node.js 22、npm、Python 3.12以上を推奨。

```sh
npm ci
npm run dev
npm run typecheck
npm run lint
npm test
python3 -m unittest discover -s tests -p 'test_*.py'
python3 pipeline/validate.py
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
npm run preview
```

開発URL: http://127.0.0.1:5173/sumo-physique-lab/ 。本番プレビュー: http://127.0.0.1:4173/sumo-physique-lab/ 。画面は `#/physique` 等で直接アクセス。検索条件はハッシュ内のクエリに保存され、戻る／進むに追従します。比較リストも同じURLで共有可能。

## 画面

- Overview: 4 KPI（平均／中央値／人数）、体格と勝率の散布図、階級別回帰線、注目力士、全6階級比較、TOP10
- 体格分析: ランキング・ソート・ページ送り、切替可能なビン分布、5数要約の箱ひげ図
- 体格×成績: 身長／体重と勝率、階級別Pearson r、生涯成績一覧
- 力士比較: 全階級検索、2〜4人、差分バー、プロフィールと成績
- データと定義: カバレッジ、指標・欠損・制約、出典候補と権利状況

体格は筋力の測定値ではなく、相関は因果ではありません。写真は利用しません。

## データモードと権利ゲート

既定は `VITE_DATA_MODE=demo`。氏名・番付・部屋・数値は固定seedで独自生成した架空設定です。全6階級296人（公式人数ではありません）。公式プロフィールリンクは架空人物には割り当てません。公式取得日時はnullとし、デモ生成日時と区別します。

`VITE_DATA_MODE=official npm run build` は必ず失敗します。本体のアクセス・保存・再配布条件と全階級品質が未確認のためです。[調査記録](docs/data-rights.md) と [データ辞書](docs/data-dictionary.md) を参照。rights.jsonのみの変更では解除できません。実収集パーサーとofficialローダーは許諾後の別工程です。`collect-manual.yml` は手動実行のみで、ネットワーク接続やデータ書込前に失敗終了します。定期巡回はありません。

## GitHub Pages

GitHubリポジトリへ配置し Settings → Pages → Source を **GitHub Actions** にします。mainへのpush又は手動で Deploy DEMO ワークフローを実行。品質検査とE2E後にdistを公開します。公開内容はDEMOです。

`BASE_PATH=/repository-name/ npm run build` でサブパスを指定。既定 `/sumo-physique-lab/`。HashRouterのためPagesの404フォールバックは不要です。独自ドメインのルート配信は `BASE_PATH=/`。別名リポジトリではE2EのbaseURLとwebServer URLも変更してください。公開JSONを必要としない初版ではデモレコードを静的JSにバンドルしています。公式由来raw/processed/publicはGit対象外です。

## 画面プレビュー

[PC](docs/preview-desktop.png) / [360pxスマートフォン](docs/preview-mobile.png)

## 未解禁機能

実データの収集・保存・公開、正式APIと全階級人数確認、取組母数を検証した決まり手分析、直近6場所勝率、履歴・時系列。権利者への問い合わせ文案は調査記録にあります（未送信）。
