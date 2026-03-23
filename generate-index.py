#!/usr/bin/env python3
"""
generate-index.py
=================
Run this script whenever you add new articles to the data/ folder.
It scans all .json files in data/ and creates data/index.json automatically.

Usage:
    python generate-index.py

Place this file in your project root (same level as index.html).
"""

import os
import json
from datetime import datetime

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
OUTPUT   = os.path.join(DATA_DIR, 'index.json')  # data/ folder లో — index.html fetch చేసే చోటు

SKIP = {'index.json', 'manifest.json'}

def main():
    if not os.path.isdir(DATA_DIR):
        print(f"❌  'data/' folder కనుగొనలేదు: {DATA_DIR}")
        return

    entries = []

    for fname in os.listdir(DATA_DIR):
        if not fname.endswith('.json'):
            continue
        if fname in SKIP:
            continue

        fpath = os.path.join(DATA_DIR, fname)
        try:
            with open(fpath, encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            print(f"  ⚠️  Skip {fname}: {e}")
            continue

        pub = data.get('published_date', '')
        try:
            ts = datetime.fromisoformat(pub.replace('Z', '+00:00')).timestamp() if pub else 0
        except Exception:
            ts = 0

        # published_date లేకపోతే file modification time fallback
        if ts == 0:
            ts = os.path.getmtime(fpath)

        entries.append({'file': fname, 'ts': ts})

    # Sort latest first (same as files.php)
    entries.sort(key=lambda x: x['ts'], reverse=True)
    file_list = [e['file'] for e in entries]

    result = {'files': file_list}
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"✅  data/index.json updated ({OUTPUT}) — {len(file_list)} articles found")
    for name in file_list[:5]:
        print(f"     • {name}")
    if len(file_list) > 5:
        print(f"     … and {len(file_list) - 5} more")

if __name__ == '__main__':
    main()