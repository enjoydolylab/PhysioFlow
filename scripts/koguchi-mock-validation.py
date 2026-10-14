"""Runs the existing reference acquisition code in forced mock mode on loopback."""
import json
import sys
import time
from pathlib import Path

source = Path(sys.argv[1]).resolve()
output = Path(sys.argv[2]).resolve()
sys.path.insert(0, str(source))
from monitoring import SensorMonitorManager, ReadOnlyAdminServer

output.mkdir(parents=True, exist_ok=True)
manager = SensorMonitorManager({"openbci": {"enabled": True, "channels": 4, "expected_rate_hz": 100, "display_points": 80}, "mybeat": {"enabled": True, "display_points": 80}}, source, mode="mock")
server = ReadOnlyAdminServer(html_path=source / 'web/admin_monitor.html', snapshot_provider=manager.snapshot, host='127.0.0.1', port=0, access_token='pf-reference-mock-validation')
try:
    manager.start()
    manager.begin_session_logging(output)
    time.sleep(2.2)
    server.start()
    print(json.dumps({'baseUrl': f'http://127.0.0.1:{server.port}', 'synthetic': True}), flush=True)
    sys.stdin.readline()
    (output / 'final-snapshot.json').write_text(json.dumps(manager.snapshot(), indent=2))
finally:
    server.stop()
    manager.stop()
