# データ辞書

`data/real/snapshot.json` は `meta` と `records` を含みます。アプリはこのファイルのみをバンドルします。

| 列 | 定義 |
|---|---|
| rikishi_id | `sumo-api-{id}`。Sumo API独自ID。公式IDとは異なる |
| shikona | 日本語名から姓名区切り・括弧の読みを除去。日本語名なしはローマ字 |
| shikona_kana | 括弧内に読みがある場合はその読み。それ以外はAPIのローマ字名 |
| division | 6階級。横綱〜前頭をmakuuchiへ分類 |
| rank_raw | APIのcurrentRankを日本語に変換 |
| stable | 部屋名を対応表で日本語に変換 |
| birthplace | APIのshusshinを保持（主にローマ字） |
| birth_date | YYYY-MM-DD。年齢はmeta.reference_dateで計算。不明は空文字 |
| height_cm / weight_kg | 数値またはnull。未取得・0はnull |
| highest_rank | 未取得のため「—」 |
| source_url | APIのnskIdから構成した協会プロフィールURL。Sumo APIのidを使わない |
| data_source_url | 提供元の力士API URL |
| profile_updated_at | 提供元のプロフィール更新日時 |
| career_wins / career_losses / career_absences | statsのtotalWins / totalLosses / totalAbsences |
| career_basho | statsのbasho |
| makuuchi_wins / makuuchi_losses | statsの階級別通算勝敗。未収録はnull |
| performance_as_of | 取得日。場所・日目の確定基準ではない |

metaには取得日時・年齢基準日・提供元更新期間・収録人数・階級別件数・出典を保存します。取得日は番付の確定日や測定日とは別です。成績に0勝0敗を含む場合、勝率は欠損になります。
