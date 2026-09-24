"""Loopback BrainFlow acquisition bridge. Raw recording outlives browser sessions."""
import argparse
from collections import deque
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import math
from pathlib import Path
import secrets
import threading
import time
from urllib.parse import urlparse, parse_qs
import uuid

from brainflow.board_shim import BoardShim, BrainFlowInputParams


class Acquisition:
    def __init__(self, board_id, params, directory):
        self.board = BoardShim(board_id, params)
        self.board_id = board_id
        self.rate = BoardShim.get_sampling_rate(board_id)
        self.timestamp_row = BoardShim.get_timestamp_channel(board_id)
        self.rows = BoardShim.get_eeg_channels(board_id)[:4]
        if not self.rows:
            raise ValueError('This first bridge requires a board with EEG channels')
        self.run_id = str(uuid.uuid4())
        self.directory = Path(directory) / self.run_id
        self.directory.mkdir(parents=True, exist_ok=False)
        self.lock = threading.RLock()
        self.samples = deque(maxlen=self.rate * 30)
        self.sequence = 0
        self.owner = None
        self.error = None
        self.stop = threading.Event()
        self.started = False
        self.last_sample = time.monotonic()
        self.manifest = dict(sdkVersion='1.0.0', connectorId='org.physioflow.brainflow', version='1.0.0', name=f'BrainFlow board {board_id}', transport='network', permissions=['device.connect', 'device.read', 'device.write'], channels=[dict(id=f'eeg_{row}', direction='input', dataType='number', unit='uV', sampleRateHz=self.rate) for row in self.rows] + [dict(id='marker', direction='output', dataType='string')], brainflow=dict(boardId=board_id, previewRows=self.rows))
        (self.directory / 'connector.json').write_text(json.dumps(self.manifest, indent=2))
        (self.directory / 'metadata.json').write_text(json.dumps(dict(runId=self.run_id, boardId=board_id, samplingRateHz=self.rate, boardDescription=BoardShim.get_board_descr(board_id), timestampUnit='seconds since Unix epoch; board-specific acquisition provenance', previewRows=self.rows), indent=2))
        self.journal = open(self.directory / 'events.jsonl', 'a', buffering=1)
        self.raw = open(self.directory / 'samples.jsonl', 'a', buffering=1)

    def event(self, kind, **payload):
        self.journal.write(json.dumps(dict(type=kind, receivedEpochMs=time.time()*1000, runId=self.run_id, **payload), allow_nan=False) + '\n')

    def start(self):
        self.board.prepare_session()
        self.board.start_stream()
        self.started = True
        self.thread = threading.Thread(target=self.collect, daemon=True)
        self.thread.start()

    def drain(self):
        data = self.board.get_board_data()
        with self.lock:
            if data.shape[1]:
                self.last_sample = time.monotonic()
            elif time.monotonic() - self.last_sample > 5:
                raise RuntimeError('No samples received for 5 seconds')
            for column in data.T:
                self.sequence += 1
                values = [float(v) if math.isfinite(float(v)) else None for v in column]
                timestamp = values[self.timestamp_row]
                self.raw.write(json.dumps(dict(sequence=self.sequence, timestamp=timestamp, rows=values), allow_nan=False) + '\n')
                self.samples.append(dict(sequence=self.sequence, timestamp=timestamp, values={f'eeg_{row}':values[row] for row in self.rows}))

    def collect(self):
        while not self.stop.wait(.1):
            try:
                self.drain()
            except Exception as error:
                with self.lock:
                    self.error = str(error)
                    self.event('acquisition_failed', message=self.error)
                return

    def request(self, path, body, query):
        with self.lock:
            if path == '/status':
                return dict(runId=self.run_id, boardId=self.board_id, sampleRateHz=self.rate, sequence=self.sequence, error=self.error, manifest=self.manifest)
            if self.error:
                raise ValueError('Acquisition failed: ' + self.error)
            if path == '/attach':
                session = body.get('sessionId')
                if not isinstance(session, str) or not session or len(session) > 200:
                    raise ValueError('sessionId is required')
                if self.owner and self.owner != session:
                    raise ValueError('Another session owns acquisition; finish it or restart the agent')
                self.owner = session
                self.event('session_attached', session=body, atSequence=self.sequence)
                return dict(runId=self.run_id, cursor=self.sequence, boardId=self.board_id, sampleRateHz=self.rate)
            session = body.get('sessionId') or query.get('sessionId', [''])[0]
            if not self.owner or session != self.owner:
                raise ValueError('Session does not own acquisition')
            if path == '/samples':
                cursor = int(query.get('after', ['0'])[0])
                if cursor < 0 or cursor > self.sequence:
                    raise ValueError('Invalid sample cursor')
                oldest = self.samples[0]['sequence'] if self.samples else self.sequence + 1
                rows = [s for s in self.samples if s['sequence'] > cursor][:max(self.rate, 1)]
                return dict(runId=self.run_id, gap=max(0, oldest - cursor - 1), samples=rows, cursor=rows[-1]['sequence'] if rows else cursor)
            if path == '/marker':
                label = body.get('label')
                if not isinstance(label, str) or not label or len(label) > 2048:
                    raise ValueError('Marker label must be 1–2048 characters')
                marker_id = body.get('markerId')
                if not isinstance(marker_id, int) or isinstance(marker_id, bool) or marker_id <= 0 or marker_id > 2**31-1:
                    raise ValueError('markerId must be a positive 32-bit integer')
                self.board.insert_marker(marker_id)
                self.event('marker_accepted', sessionId=session, markerId=marker_id, label=label, clientEpochMs=body.get('clientEpochMs'))
                return dict(markerId=marker_id, acceptedEpochMs=time.time()*1000)
            if path == '/detach':
                self.event('session_detached', sessionId=session, atSequence=self.sequence)
                self.owner = None
                return dict(detached=True, rawRecordingContinues=True)
            raise ValueError('Unknown route')

    def close(self):
        self.stop.set()
        if hasattr(self, 'thread'):
            self.thread.join(timeout=5)
        try:
            if self.started:
                self.drain()
                self.board.stop_stream()
        finally:
            if self.board.is_prepared():
                self.board.release_session()
            self.raw.close()
            self.journal.close()


def make_handler(acquisition, token, origins):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass  # URLs may contain participant/session identifiers.

        def reply(self, code, data):
            payload = json.dumps(data, allow_nan=False).encode()
            self.send_response(code)
            origin = self.headers.get('Origin')
            if origin in origins:
                self.send_header('Access-Control-Allow-Origin', origin)
                self.send_header('Vary', 'Origin')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Access-Control-Allow-Headers', 'Authorization, Content-Type')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)

        def allowed(self):
            origin = self.headers.get('Origin')
            return origin is None or origin in origins

        def do_OPTIONS(self):
            self.reply(200 if self.allowed() else 403, {})

        def handle_api(self):
            if not self.allowed() or not secrets.compare_digest(self.headers.get('Authorization', ''), 'Bearer ' + token):
                self.reply(403, dict(error='Origin or token rejected'))
                return
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if length < 0 or length > 16384:
                    raise ValueError('Request too large')
                parsed = urlparse(self.path)
                if (self.command == 'GET' and parsed.path not in ['/status','/samples']) or (self.command == 'POST' and parsed.path not in ['/attach','/marker','/detach']):
                    raise ValueError('Unknown route or method')
                body = json.loads(self.rfile.read(length)) if length else {}
                if not isinstance(body, dict):
                    raise ValueError('Expected JSON object')
                self.reply(200, acquisition.request(parsed.path, body, parse_qs(parsed.query)))
            except (ValueError, TypeError, KeyError) as error:
                self.reply(400, dict(error=str(error)))
            except Exception as error:
                self.reply(503, dict(error=str(error)))
        do_GET = handle_api
        do_POST = handle_api
    return Handler


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--board-id', type=int, default=-1, help='-1 = BrainFlow Synthetic Board')
    parser.add_argument('--serial-port', default='')
    parser.add_argument('--port', type=int, default=8765)
    parser.add_argument('--origin', action='append', default=[])
    parser.add_argument('--output', default='brainflow-recordings')
    args = parser.parse_args()
    params = BrainFlowInputParams()
    params.serial_port = args.serial_port
    token = secrets.token_urlsafe(32)
    acquisition = Acquisition(args.board_id, params, args.output)
    server = ThreadingHTTPServer(('127.0.0.1', args.port), make_handler(acquisition, token, set(args.origin or ['http://127.0.0.1:5174','http://localhost:5174'])))
    try:
        acquisition.start()
        print(json.dumps(dict(url=f'http://127.0.0.1:{args.port}', token=token, directory=str(acquisition.directory.resolve()))), flush=True)
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        acquisition.close()

if __name__ == '__main__':
    main()
