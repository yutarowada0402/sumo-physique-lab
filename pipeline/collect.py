"""Import numeric facts from Sumo API serially, without scraping sumo.or.jp."""
import argparse
import json
import re
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from pipeline.validate import validate

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://sumo-api.com/api'
RANKS = dict(zip('Yokozuna Ozeki Sekiwake Komusubi Maegashira Juryo Makushita Sandanme Jonidan Jonokuchi'.split(), '横綱 大関 関脇 小結 前頭 十両 幕下 三段目 序二段 序ノ口'.split()))
HEYAS = dict(zip(
    'Ajigawa Arashio Asahiyama Asakayama Dewanoumi Fujishima Futagoyama Hakkaku Hanaregoma Hidenoyama Ikazuchi Isegahama Isenoumi Kasugano Kataonami Kise Kokonoe Minato Minatogawa Musashigawa Nakamura Naruto Nishiiwa Nishikido Nishonoseki Oitekaze Onoe Onomatsu Oshima Oshiogawa Otake Otowayama Sadogatake Sakaigawa Shibatayama Shikihide Shikoroyama Tagonoura Takadagawa Takasago Takekuma Tamanoi Tatsunami Tokitsukaze Yamahibiki'.split(),
    '安治川 荒汐 朝日山 浅香山 出羽海 藤島 二子山 八角 放駒 秀ノ山 雷 伊勢ヶ濱 伊勢ノ海 春日野 片男波 木瀬 九重 湊 湊川 武蔵川 中村 鳴戸 西岩 錦戸 二所ノ関 追手風 尾上 阿武松 大島 押尾川 大嶽 音羽山 佐渡ヶ嶽 境川 芝田山 式秀 錣山 田子ノ浦 高田川 高砂 武隈 玉ノ井 立浪 時津風 山響'.split()))

def fetch(path):
    req = urllib.request.Request(BASE + path, headers={'User-Agent': 'SumoPhysiqueLab/2.0 (snapshot import)', 'Accept': 'application/json'})
    # HTTP errors including 429 stop the run. No retries or parallel requests.
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.load(response)

def rank(value):
    parts = value.split()
    if not parts or parts[0] not in RANKS:
        raise ValueError(f'Unknown rank: {value}')
    side = '東' if 'East' in parts else '西' if 'West' in parts else ''
    number = next((p for p in parts if p.isdigit()), '')
    suffix = '' if not number else f'{number}枚目' if parts[0] in {'Maegashira', 'Juryo', 'Makushita', 'Sandanme', 'Jonidan', 'Jonokuchi'} else (number if number != '1' else '')
    return side + RANKS[parts[0]] + suffix

def normalize(r, stats, as_of):
    family = r['currentRank'].split()[0]
    if family not in RANKS:
        raise ValueError(f'Unknown rank: {family}')
    division = family.lower() if family in {'Juryo', 'Makushita', 'Sandanme', 'Jonidan', 'Jonokuchi'} else 'makuuchi'
    name = r.get('shikonaJp') or r['shikonaEn']
    yomi = re.search(r'[（(]([^）)]+)', name)
    return {
        'rikishi_id': f"sumo-api-{r['id']}", 'shikona': re.split(r'[\s（(]', name)[0],
        'shikona_kana': yomi.group(1) if yomi else r['shikonaEn'],
        'rank_raw': rank(r['currentRank']), 'division': division,
        'stable': HEYAS.get(r.get('heya'), r.get('heya') or '不明') + '部屋',
        'birthplace': r.get('shusshin') or '不明', 'birth_date': (r.get('birthDate') or '')[:10],
        'height_cm': r.get('height') or None, 'weight_kg': r.get('weight') or None,
        'highest_rank': '—', 'source_url': f"https://www.sumo.or.jp/ResultRikishiData/profile/{r['nskId']}/" if r.get('nskId') else None,
        'career_wins': stats.get('totalWins'), 'career_losses': stats.get('totalLosses'),
        'career_absences': stats.get('totalAbsences'), 'career_basho': stats.get('basho'),
        'makuuchi_wins': stats.get('winsByDivision', {}).get('Makuuchi'),
        'makuuchi_losses': stats.get('lossByDivision', {}).get('Makuuchi'),
        'performance_as_of': as_of, 'profile_updated_at': r.get('updatedAt'),
        'data_source_url': BASE + f"/rikishi/{r['id']}",
    }

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--profiles-file', type=Path)
    parser.add_argument('--delay', type=float, default=1.0)
    args = parser.parse_args()
    if args.delay < 0.25:
        parser.error('delay must be at least 0.25 seconds')
    profiles = json.loads(args.profiles_file.read_text()) if args.profiles_file else fetch('/rikishis?limit=1000&skip=0&intai=false')
    if not profiles.get('records') or len(profiles['records']) != profiles['total']:
        raise ValueError('Incomplete profiles; previous snapshot preserved')
    now = datetime.now(timezone.utc).isoformat()
    date = now[:10]
    cache = ROOT / 'data/raw/stats'
    cache.mkdir(parents=True, exist_ok=True)
    rows = []
    for i, r in enumerate(profiles['records']):
        cached = cache / f"{date}-{r['id']}.json"
        if cached.exists():
            stats = json.loads(cached.read_text())
        else:
            time.sleep(args.delay)
            stats = fetch(f"/rikishi/{r['id']}/stats")
            if not all(type(stats.get(k)) is int for k in ('totalWins', 'totalLosses', 'totalAbsences')):
                raise ValueError(f"Invalid statistics: {r['id']}")
            cached.write_text(json.dumps(stats))
        rows.append(normalize(r, stats, date))
        if (i + 1) % 25 == 0:
            print(f"Collected {i + 1}/{profiles['total']}", flush=True)
    report = validate(rows)
    if report['errors']:
        raise ValueError(report)
    updated = sorted(r['profile_updated_at'] for r in rows if r['profile_updated_at'])
    meta = {
        'snapshot_id': f'sumo-api-{date}', 'retrieved_at_utc': now, 'reference_date': date,
        'banzuke_basho': 'Sumo API掲載の現在番付（更新時点は力士ごとに異なります）',
        'performance_as_of': f'{date}取得のAPI通算成績（場所中は更新途中）',
        'data_mode': 'real', 'source_domains': ['sumo-api.com'], 'source_url': 'https://sumo-api.com/',
        'profile_updated_min': updated[0], 'profile_updated_max': updated[-1], 'count': len(rows),
        'coverage': {d: sum(r['division'] == d for r in rows) for d in sorted({r['division'] for r in rows})},
    }
    # Replace a single snapshot only after every response and validation succeed.
    out = ROOT / 'data/real'
    out.mkdir(parents=True, exist_ok=True)
    pending = out / 'snapshot.tmp'
    pending.write_text(json.dumps({'meta': meta, 'records': rows}, ensure_ascii=False, indent=2) + '\n')
    pending.replace(out / 'snapshot.json')
    print(json.dumps(report, ensure_ascii=False), flush=True)

if __name__ == '__main__':
    main()
