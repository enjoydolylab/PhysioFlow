"""Launch the built app and actual BrainFlow bridge; generate connected demo protocols."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import importlib.util
import json
from pathlib import Path
import secrets
import threading
import webbrowser


def connect_protocol(protocol, manifest):
    protocol = json.loads(json.dumps(protocol))
    protocol['protocolId'] += '_brainflow'
    protocol['projectId'] += '_brainflow'
    protocol['metadata']['name'] += '｜BrainFlow 統合'
    protocol['metadata']['description'] = 'QA 機能デモ。BrainFlow 原始記録・実験イベント・回答を ID で関連付けます。合成信号は研究データではありません。'
    protocol['biodb'] = {'experimentId': protocol['protocolId'], 'experimentLabel': protocol['metadata']['name']}
    protocol['deviceConnectors'] = [{**manifest, 'approvedPermissions': manifest['permissions']}]
    # Device requirements are collected for the session, not toggled per page.
    node = next(n for n in protocol['graph']['nodes'] if n['component']['type'] not in ['core.start', 'core.end', 'logic.loop', 'logic.random'])
    node['config']['deviceConnectorId'] = manifest['connectorId']
    node['config']['deviceConnectorVersion'] = manifest['version']
    node['config']['deviceRequired'] = True
    return protocol


def main():
    parser = argparse.ArgumentParser(description='PhysioFlow + BrainFlow integrated QA demo')
    parser.add_argument('--board-id', type=int, default=-1)
    parser.add_argument('--serial-port', default='')
    parser.add_argument('--web-port', type=int, default=8016)
    parser.add_argument('--agent-port', type=int, default=8765)
    parser.add_argument('--no-browser', action='store_true')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    packaged = (root / 'APP').exists()
    app = root / ('APP' if packaged else 'dist')
    examples = root if packaged else root / 'examples/lab-meeting-2026-09-25'
    agent_path = root / 'tools/brainflow/agent.py'
    if not (app / 'index.html').is_file():
        parser.error('Built app is missing. Run npm run build first.')
    spec = importlib.util.spec_from_file_location('physioflow_brainflow_agent', agent_path)
    bridge = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(bridge)
    params = bridge.BrainFlowInputParams()
    params.serial_port = args.serial_port
    origin = f'http://127.0.0.1:{args.web_port}'
    # Reserve both ports before starting acquisition, so failures do not leave it running.
    web = ThreadingHTTPServer(('127.0.0.1', args.web_port), partial(SimpleHTTPRequestHandler, directory=str(app)))
    acquisition = None
    api = None
    serving = False
    try:
        acquisition = bridge.Acquisition(args.board_id, params, root / 'brainflow-recordings')
        token = secrets.token_urlsafe(32)
        api = ThreadingHTTPServer(('127.0.0.1', args.agent_port), bridge.make_handler(acquisition, token, {origin}))
        acquisition.start()
        sources = [examples / '01_READY_TO_RUN.protocol.json', *sorted((examples / 'patterns').glob('*.protocol.json'))]
        connected = examples / 'CONNECTED'
        connected.mkdir(exist_ok=True)
        for source in sources:
            protocol = connect_protocol(json.loads(source.read_text()), acquisition.manifest)
            (connected / source.name).write_text(json.dumps(protocol, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        threading.Thread(target=api.serve_forever, daemon=True).start()
        threading.Thread(target=web.serve_forever, daemon=True).start()
        serving = True
        print(json.dumps({'app': origin, 'agent': f'http://127.0.0.1:{args.agent_port}', 'token': token, 'boardId': args.board_id, 'protocols': str(connected), 'recording': str(acquisition.directory)}, ensure_ascii=False), flush=True)
        print('CONNECTED の JSON を読み込み、参加者 ID → テスト実行 → token を入力。終了時は Ctrl+C。', flush=True)
        if not args.no_browser:
            webbrowser.open(origin)
        threading.Event().wait()
    except KeyboardInterrupt:
        pass
    finally:
        if serving:
            api.shutdown()
            web.shutdown()
        if api:
            api.server_close()
        web.server_close()
        if acquisition:
            acquisition.close()


if __name__ == '__main__':
    main()
