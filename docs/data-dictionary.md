# データ辞書

データモードdemo。JSONを静的バンドルに含める。1スナップショットの一人1行、デモ内ではrikishiとperformanceを結合。論理上はrikishi_idで結合可能。P1 techniquesは未格納。

|列|型・定義|
|---|---|
|rikishi_id|string。公式解禁時はURLの数値ID文字列、デモはdemo-階級-番号|
|shikona / shikona_kana|string。改名してもIDをキーとする|
|division|6階級の英語識別子|
|rank_raw|string 原文（デモは架空表記）|
|stable / birthplace|string 部屋・出身地（架空設定）|
|birth_date|string ISO日付。年齢はmanifest.reference_date基準|
|height_cm / weight_kg|numberまたはnull。小数を保持|
|highest_rank|stringまたはnull|
|source_url|stringまたはnull。デモはnull|
|career_wins / career_losses / career_absences / career_basho|非負integerまたはnull|
|makuuchi_wins / makuuchi_losses|非負integerまたはnull。デモは未使用|
|performance_as_of|string。取得日時とは別の成績基準|

manifest.json: snapshot_id, retrieved_at_utc（未取得のためnull）, generated_at_utc, reference_date, banzuke_basho, performance_as_of, data_mode, rights_status, source_domains（実ソースなしの空配列）。coverage.json: 階級ごとのexpected_count_if_known（公式未確認のnull）, discovered_count, parsed_count, physique_count（身長体重両有効）, performance_count（勝敗あり、0勝0敗も含む）, excluded_count。いずれもdemoの合成件数。勝率の有効件数は0勝0敗を除くためこれと異なる。

BMIと勝率・集計値は表示時に計算。summary.json・Parquet・公式データは生成しない。デモは実データIDと混同しない専用スキーマ。実HTML・和暦変換・ID長期安定性の検証は権利解禁後。非6階級の公式件数は未確認として画面に明示。
