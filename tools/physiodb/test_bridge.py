import asyncio
import gzip
import json
import unittest
from uuid import UUID

import httpx2
from physiodb.api.client import ApiClient
from bridge import dispatch, encode

ID = '01999999-9999-7999-8999-999999999999'


class BridgeTests(unittest.TestCase):
    def test_current_participant_code_contract(self):
        def handler(request):
            body = json.loads(request.content)
            self.assertEqual(body, {"code": "PF-SYNTHETIC-01", "metadata": {"physioflow": {"schema_version": 1}}})
            return httpx2.Response(201, json={"id": ID, "research_id": ID, **body})

        async def scenario():
            async with ApiClient('https://db.test/api/v1', token='test', transport=httpx2.MockTransport(handler)) as client:
                result = encode(await dispatch(client, 'createParticipant', {"researchId": ID, "participant": {"code": "PF-SYNTHETIC-01", "metadata": {"physioflow": {"schema_version": 1}}}}))
                self.assertEqual(result['code'], 'PF-SYNTHETIC-01')
                self.assertNotIn('email', result)
        asyncio.run(scenario())

    def test_official_sdk_paths_models_and_compressed_samples(self):
        seen = []

        def handler(request):
            seen.append(request)
            self.assertEqual(request.headers['authorization'], 'Bearer db-test')
            if request.method == 'POST':
                self.assertEqual(request.headers['content-encoding'], 'gzip')
                self.assertEqual(json.loads(gzip.decompress(request.content))[0]['values'], [1.5])
                return httpx2.Response(204)
            return httpx2.Response(200, json=[{'time': '2026-10-04T00:00:00Z', 'values': [1.5]}])

        async def scenario():
            async with ApiClient('https://db.test/api/v1', token='db-test', transport=httpx2.MockTransport(handler)) as client:
                self.assertIsNone(await dispatch(client, 'appendSamples', {'streamId': ID, 'samples': [{'time': '2026-10-04T00:00:00Z', 'values': [1.5]}]}))
                result = encode(await dispatch(client, 'samples', {'streamId': ID, 'start': '2026-10-04T00:00:00Z', 'end': '2026-10-04T00:05:00Z'}))
                self.assertEqual(result[0]['values'], [1.5])
                with self.assertRaises(ValueError):
                    await dispatch(client, 'deleteResearch', {})
                with self.assertRaises(ValueError):
                    await dispatch(client, 'stream', {'streamId': 'not-a-uuid'})
        asyncio.run(scenario())
        self.assertEqual(seen[0].url.path, f'/api/v1/streams/{UUID(ID)}/samples')
        self.assertEqual(len(seen), 2)


if __name__ == '__main__':
    unittest.main()
