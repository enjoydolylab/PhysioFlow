"""Package only explicit application inputs; never include workspace credentials/data."""
from pathlib import Path
import json
import hashlib
import zipfile
import shutil
import os
root = Path(__file__).resolve().parent.parent
version = json.loads((root / 'package.json').read_text())['version']
name = 'PhysioFlow-Server-v' + version
out = root / 'release-web' / name
if (out.exists() or Path(str(out) + '.zip').exists()) and os.environ.get('PF_REPLACE_EXISTING_PACKAGE') != '1':
    raise SystemExit('Package already exists. Increment the version or explicitly set PF_REPLACE_EXISTING_PACKAGE=1.')
if out.exists():
    shutil.rmtree(out)
out.mkdir(parents=True)
for directory in ['src', 'server', 'dist']:
    shutil.copytree(root / directory, out / directory, ignore=shutil.ignore_patterns('.DS_Store', '__pycache__'))
for item in ['package.json', 'package-lock.json', 'index.html', 'vite.config.js', 'scripts/localDesk.mjs', 'tools/physiodb/bridge.py', 'tools/physiodb/pyproject.toml', 'tools/physiodb/uv.lock', 'docs/USER_TRIAL_JA_2026-10-14.md', 'docs/PHYSIODB_INTEGRATION.md']:
    target = out / item
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(root / item, target)
guide = root / 'docs' / ('OPERATOR_GUIDE_' + version.split('-')[1] + '_日本語.md')
if guide.exists():
    shutil.copyfile(guide, out / 'OPERATOR_GUIDE_日本語.md')
editor_guide = root / 'docs' / ('EDITOR_GUIDE_' + version.split('-')[1] + '_日本語.md')
if editor_guide.exists():
    shutil.copyfile(editor_guide, out / 'EDITOR_GUIDE_日本語.md')
(out / 'README_日本語.md').write_text(f'''# PhysioFlow {version} 本機サーバ試用

Node.js 22 以降、Python 3.12 以降、uv、Chrome / Edge が必要です。

1. このフォルダーで `npm ci` を実行します。
2. `uv sync --frozen --project tools/physiodb` を実行します。
3. `npm run desk` を実行し、表示された本機URLを開きます。
4. `.physioflow/local-desk/admin-access.txt` の私用リンクから管理画面へ接続します。参加者にこのリンクを渡しません。
5. DB トークンを設定する場合は `npm run desk:configure-db` を実行し、標準入力へ入力して終了します。macOS / Linux は Ctrl+D、Windows は Ctrl+Z と Enter で終了します。入力内容をログ・画面録画・共有記録へ残しません。その後サーバを再起動します。
6. 同じサーバの `/` で設計・実行、`/admin` で DB 保存と回看を行います。静的Web版とは保存Originが異なるため、既存データは選択フォルダーやエクスポート経由で開いてください。

`.physioflow` は試用者の私用データ・認証情報です。フォルダーごと再配布しません。DBのURL変更はPHYSIOFLOW_PHYSIODB_URL環境変数、機器快照はdocs/PHYSIODB_INTEGRATION.mdを参照してください。取得ソフト、正式な機器と映像は同梱しません。

同梱src/serverは未コミット変更を含む実際のビルド入力です。SOURCE_FILES_SHA256.jsonで内容を識別できます。真人試用結果は未取得です。手順はdocs/USER_TRIAL_JA_2026-10-14.mdにあります。
''')
manifest = {str(p.relative_to(out)): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(out.rglob('*')) if p.is_file()}
(out / 'SOURCE_FILES_SHA256.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False)+'\n')
archive = root / 'release-web' / (name + '.zip')
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for p in sorted(out.rglob('*')):
        if p.is_file():
            z.write(p, str(Path(name) / p.relative_to(out)))
print(archive)
