"""Check launcher protocol wiring without starting acquisition or networking."""
import importlib.util
import json
from pathlib import Path
import unittest
root = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('demo_launcher', root / 'scripts/launch-integrated-demo.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class DemoTests(unittest.TestCase):
    def test_all_five_patterns_use_board_manifest_and_distinct_experiments(self):
        folder = root / 'examples/lab-meeting-2026-09-25'
        paths = [folder / '01_READY_TO_RUN.protocol.json', *sorted((folder / 'patterns').glob('*.protocol.json'))]
        manifest = {'connectorId':'org.physioflow.brainflow', 'version':'1.0.0', 'permissions':['device.connect','device.read','device.write'], 'channels':[{'id':'eeg_7','sampleRateHz':512}], 'brainflow':{'boardId':123,'previewRows':[7]}}
        experiments = set()
        for path in paths:
            source = json.loads(path.read_text())
            before = json.dumps(source)
            result = module.connect_protocol(source, manifest)
            self.assertEqual(json.dumps(source), before)
            self.assertEqual(result['deviceConnectors'][0]['channels'], manifest['channels'])
            self.assertEqual(result['deviceConnectors'][0]['brainflow'], manifest['brainflow'])
            self.assertEqual(result['biodb']['experimentId'], result['protocolId'])
            self.assertTrue(any(n['config'].get('deviceRequired') for n in result['graph']['nodes']))
            self.assertNotIn('token', result['deviceConnectors'][0])
            experiments.add(result['protocolId'])
        self.assertEqual(len(experiments), 5)

if __name__ == '__main__':
    unittest.main()
