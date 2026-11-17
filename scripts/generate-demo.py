"""Reproducible synthetic data only. No network access."""
from pathlib import Path
import json, random
p=Path(__file__).resolve().parents[1]
def w(f,s):
    path=p/f
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(s,encoding="utf-8")
rng=random.Random(20261117);rows=[]
ds=['makuuchi','juryo','makushita','sandanme','jonidan','jonokuchi']; labels=['幕内','十両','幕下','三段目','序二段','序ノ口']; counts=[42,28,60,70,72,24]
for d,(div,count) in enumerate(zip(ds,counts)):
 for i in range(count):
  h=round(rng.gauss(184-d*1.6,5.2),1);wt=round(max(65,rng.gauss(162-d*9,21)),1);wins=rng.randint(0,650 if d<2 else 200);loss=rng.randint(0,600 if d<2 else 230)
  rows.append({'rikishi_id':f'demo-{d}-{i:03}','shikona':f"{['朱岳','金嶺','蒼峰','翠嵐','白潮','紫雲'][d]}{['山','海','龍','富士','川','丸','光'][i%7]}{i+1:02}",'shikona_kana':f'かくう{d}{i}','rank_raw':f'{"東" if i%2==0 else "西"}{labels[d]}{i//2+1}枚目（架空）','division':div,'stable':['朱岳部屋（架空）','金嶺部屋（架空）','蒼峰部屋（架空）'][i%3],'birthplace':['北海道（架空設定）','東京都（架空設定）','大阪府（架空設定）','福岡県（架空設定）'][i%4],'birth_date':f'{rng.randint(1987,2007)}-{rng.randint(1,12):02}-15','height_cm':None if i==13 else h,'weight_kg':None if i==17 else wt,'highest_rank':f'{labels[max(0,d-1)]}（架空）','source_url':None,'career_wins':None if i==11 else (0 if i==0 else wins),'career_losses':None if i==11 else (0 if i==0 else loss),'career_absences':rng.randint(0,40),'career_basho':rng.randint(2,70),'makuuchi_wins':None,'makuuchi_losses':None,'performance_as_of':'2026-11-17（架空・場所進行とは無関係）'})
w('data/demo/rikishi_demo.json',json.dumps(rows,ensure_ascii=False,indent=2))
meta={'snapshot_id':'demo-20261117-v1','retrieved_at_utc':None,'generated_at_utc':'2026-11-17T00:00:00Z','reference_date':'2026-11-17','banzuke_basho':'2026年11月・架空番付（実際の番付と無関係）','performance_as_of':'架空の生涯成績／実際の場所・日目に対応しない','data_mode':'demo','rights_status':'unconfirmed','source_domains':[]}
w('data/demo/manifest.json',json.dumps(meta,ensure_ascii=False,indent=2))
