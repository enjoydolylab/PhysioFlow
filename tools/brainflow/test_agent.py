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
    def test_passive_monitor_does_not_claim_or_refresh_session_ownership(self):
        with tempfile.TemporaryDirectory() as directory:
            agent = Acquisition(-1, BrainFlowInputParams(), directory)
            try:
                agent.owner = 'active-session'
                agent.owner_activity = 123.0
                snapshot = agent.request('/monitor', {}, {})
                self.assertEqual(snapshot['source'], 'synthetic')
                self.assertIn('lastSampleAgeMs', snapshot)
                self.assertFalse(snapshot['recordingActive'])
                self.assertEqual(agent.owner, 'active-session')
                self.assertEqual(agent.owner_activity, 123.0)
                agent.error = 'test acquisition failure'
                self.assertEqual(agent.request('/monitor', {}, {})['error'], agent.error)
            finally:
                agent.close()

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
                self.assertTrue(status['recordingActive'])
                self.assertTrue(attach['recordingActive'])
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

    def test_stale_owner_can_be_taken_over_but_active_owner_cannot(self):
        """A refreshed or closed tab never calls /detach. Once its owner goes silent
        past --owner-stale-seconds a new session may take over; a session that is
        still polling keeps exclusive ownership."""
        with tempfile.TemporaryDirectory() as directory:
            # Tiny threshold so the test does not have to sleep for the default 30 s.
            agent=Acquisition(-1, BrainFlowInputParams(), directory, owner_stale_seconds=.4)
            server=ThreadingHTTPServer(('127.0.0.1',0),make_handler(agent,'test-token',{'http://localhost:5174'}))
            thread=threading.Thread(target=server.serve_forever,daemon=True)
            agent.start();thread.start()
            def request(path, body=None, token='test-token'):
                req=Request('http://127.0.0.1:'+str(server.server_port)+path,data=json.dumps(body).encode() if body is not None else None,headers={'Authorization':'Bearer '+token,'Origin':'http://localhost:5174','Content-Type':'application/json'})
                with urlopen(req,timeout=5) as response:return json.load(response)
            try:
                # An owner that keeps polling is never released.
                request('/attach',{'sessionId':'live'})
                for _ in range(4):
                    request('/samples?sessionId=live&after=0')
                    time.sleep(.2)
                    with self.assertRaises(HTTPError) as error:request('/attach',{'sessionId':'rival'})
                    self.assertEqual(error.exception.code,400)
                    self.assertIn('owns acquisition',error.exception.read().decode())
                # Stop polling: the owner ages out and the rival takes over.
                time.sleep(.6)
                taken=request('/attach',{'sessionId':'rival'})
                self.assertEqual(taken['runId'],agent.run_id)
                self.assertEqual(agent.owner,'rival')
                # The released session no longer owns acquisition.
                with self.assertRaises(HTTPError) as error:request('/samples?sessionId=live&after=0')
                self.assertEqual(error.exception.code,400)
                # A fresh /detach frees the slot immediately, with no staleness wait.
                request('/detach',{'sessionId':'rival'})
                self.assertIsNone(agent.owner)
                self.assertEqual(request('/attach',{'sessionId':'third'})['runId'],agent.run_id)
                # The takeover is recorded so the ownership change is auditable.
                events=[json.loads(x) for x in (agent.directory/'events.jsonl').read_text().splitlines()]
                released=[e for e in events if e.get('type')=='session_owner_released']
                self.assertEqual(len(released),1)
                self.assertEqual(released[0]['previousSessionId'],'live')
                self.assertEqual(released[0]['reason'],'stale owner takeover')
                self.assertGreaterEqual(released[0]['idleSeconds'],.4)
            finally:
                server.shutdown();server.server_close();agent.close()

if __name__=='__main__': unittest.main()
