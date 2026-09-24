import json
from pathlib import Path
import tempfile
import threading
import time
import unittest
from http.server import ThreadingHTTPServer
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from brainflow.board_shim import BrainFlowInputParams
from agent import Acquisition, make_handler

class SyntheticIntegration(unittest.TestCase):
    def test_acquire_markers_authorization_and_recording(self):
        with tempfile.TemporaryDirectory() as directory:
            agent=Acquisition(-1, BrainFlowInputParams(), directory)
            server=ThreadingHTTPServer(('127.0.0.1',0),make_handler(agent,'test-token',{'http://localhost:5174'}))
            thread=threading.Thread(target=server.serve_forever,daemon=True)
            agent.start();thread.start()
            def request(path, body=None, token='test-token', origin='http://localhost:5174'):
                req=Request('http://127.0.0.1:'+str(server.server_port)+path,data=json.dumps(body).encode() if body is not None else None,headers={'Authorization':'Bearer '+token,'Origin':origin,'Content-Type':'application/json'})
                with urlopen(req,timeout=5) as response:return json.load(response)
            try:
                for kwargs in [{'token':'wrong'},{'origin':'https://untrusted.example'}]:
                    with self.assertRaises(HTTPError) as error:request('/status',**kwargs)
                    self.assertEqual(error.exception.code,403)
                status=request('/status');self.assertEqual(status['sampleRateHz'],250)
                attach=request('/attach',{'sessionId':'qa','participantId':'SYNTHETIC'})
                with self.assertRaises(HTTPError):request('/attach',{'sessionId':'another'})
                request('/marker',{'sessionId':'qa','markerId':7,'label':'stimulus','clientEpochMs':time.time()*1000})
                time.sleep(.6)
                batch=request('/samples?sessionId=qa&after='+str(attach['cursor']))
                self.assertGreater(len(batch['samples']),50)
                self.assertEqual(batch['gap'],0)
                self.assertEqual(batch['samples'][0]['sequence'],attach['cursor']+1)
                before=batch['cursor'];request('/detach',{'sessionId':'qa'})
                time.sleep(.2)
                self.assertGreater(request('/status')['sequence'],before)
            finally:
                server.shutdown();server.server_close();agent.close()
            rows=[json.loads(x) for x in (agent.directory/'samples.jsonl').read_text().splitlines()]
            marker_row=agent.board.get_marker_channel(-1)
            self.assertTrue(any(row['rows'][marker_row]==7 for row in rows))
            self.assertEqual(len(rows),rows[-1]['sequence'])
            self.assertTrue((agent.directory/'connector.json').exists())

if __name__=='__main__': unittest.main()
