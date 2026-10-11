"""Bundle the current built web app with the Japanese demo and local launcher."""
from pathlib import Path
import shutil,zipfile,hashlib,json,subprocess
root=Path(__file__).resolve().parents[1]
release=root/'release-demo';release.mkdir(exist_ok=True)
package=release/'PhysioFlow-LabDemo-2026-09-25'
if package.exists():shutil.rmtree(package)
shutil.copytree(root/'examples/lab-meeting-2026-09-25',package,ignore=shutil.ignore_patterns('CONNECTED'))
shutil.copytree(root/'dist',package/'APP')
(package/'scripts').mkdir()
(package/'tools/brainflow').mkdir(parents=True)
shutil.copy2(root/'scripts/launch-integrated-demo.py', package/'scripts/launch-integrated-demo.py')
for name in ['agent.py','requirements.txt']:
 shutil.copy2(root/'tools/brainflow'/name, package/'tools/brainflow'/name)
(package/'START_BRAINFLOW_MAC.command').write_text('#!/bin/sh\ncd "$(dirname "$0")"\nif [ ! -x .demo-venv/bin/python ]; then python3 -m venv .demo-venv || exit 1; fi\n.demo-venv/bin/python -c "import brainflow" 2>/dev/null || .demo-venv/bin/python -m pip install -r tools/brainflow/requirements.txt || exit 1\n.demo-venv/bin/python scripts/launch-integrated-demo.py\n',encoding='utf-8')
(package/'START_BRAINFLOW_MAC.command').chmod(0o755)
(package/'START_BRAINFLOW_WINDOWS.bat').write_text('@echo off\r\ncd /d "%~dp0"\r\nif not exist .demo-venv\\Scripts\\python.exe (py -3 -m venv .demo-venv)\r\n.demo-venv\\Scripts\\python.exe -m pip install -r tools/brainflow/requirements.txt\r\nif errorlevel 1 exit /b 1\r\n.demo-venv\\Scripts\\python.exe scripts/launch-integrated-demo.py\r\npause\r\n')
(package/'APP/start.py').write_text('''from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
import webbrowser,sys
root=Path(__file__).resolve().parent
url='http://127.0.0.1:8016/'
try:
 server=ThreadingHTTPServer(('127.0.0.1',8016),partial(SimpleHTTPRequestHandler,directory=str(root)))
except OSError:
 print('Port 8016 is already in use. Close the earlier demo server before restarting.');input('Enter to close');sys.exit(1)
print('PhysioFlow demo: '+url+'  /  Ctrl+C to stop')
if '--no-browser' not in sys.argv:webbrowser.open(url)
try:server.serve_forever()
except KeyboardInterrupt:pass
finally:server.server_close()
''',encoding='utf-8')
(package/'APP/start-mac.command').write_text('#!/bin/sh\ncd "$(dirname "$0")"\npython3 start.py\n',encoding='utf-8');(package/'APP/start-mac.command').chmod(0o755)
(package/'APP/start-windows.bat').write_text('@echo off\r\ncd /d "%~dp0"\r\nwhere py >nul 2>nul\r\nif %errorlevel%==0 (py -3 start.py) else (python start.py)\r\npause\r\n')
(package/'APP/start-linux.sh').write_text('#!/bin/sh\ncd "$(dirname "$0")"\npython3 start.py\n');(package/'APP/start-linux.sh').chmod(0o755)
files={str(p.relative_to(package)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(package.rglob('*')) if p.is_file()}
(package/'BUILD_MANIFEST.json').write_text(json.dumps({'label':'Development demonstration build; not the published beta.6 binaries','baseCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'workingTreeDiffSha256':hashlib.sha256(subprocess.check_output(['git','diff','HEAD'],cwd=root)).hexdigest(),'files':files},ensure_ascii=False,indent=2)+'\n')
archive=release/(package.name+'.zip')
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
 for p in sorted(package.rglob('*')):
  if p.is_file():z.write(p,Path(package.name)/p.relative_to(package))
with zipfile.ZipFile(archive) as z:assert z.testzip() is None
(release/'SHA256SUMS.txt').write_text(hashlib.sha256(archive.read_bytes()).hexdigest()+'  '+archive.name+'\n')
print(archive,archive.stat().st_size)
