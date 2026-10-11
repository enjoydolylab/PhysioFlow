"""Single bounded RPC, using the official SDK. Secrets arrive through stdin only."""
import asyncio
from datetime import datetime
import json
import sys
from uuid import UUID

import httpx2
from pydantic import BaseModel, ValidationError
from physiodb.api.client import ApiClient

READ_OPERATIONS = {"me", "researches", "experiments", "participants", "streams", "stream", "samples", "events"}
WRITE_OPERATIONS = {"createResearch", "createExperiment", "createParticipant", "createStream", "appendSamples", "createEvent"}


def encode(value):
    if isinstance(value, BaseModel):
        return value.model_dump(mode="json")
    if isinstance(value, list):
        return [encode(item) for item in value]
    return value


async def dispatch(client, operation, args):
    if operation not in READ_OPERATIONS | WRITE_OPERATIONS:
        raise ValueError("Unsupported operation")
    ids = {key: UUID(args[key]) for key in ("researchId", "experimentId", "participantId", "streamId") if key in args}
    if operation == "me":
        return await client.get_me()
    if operation == "researches":
        return await client.list_researches()
    if operation == "experiments":
        return await client.list_experiments(ids["researchId"])
    if operation == "participants":
        return await client.list_participants(ids["researchId"])
    if operation == "streams":
        return await client.list_streams(ids["experimentId"], ids["participantId"])
    if operation == "stream":
        return await client.get_stream(ids["streamId"])
    if operation == "events":
        return await client.list_events(ids["experimentId"], ids["participantId"])
    if operation == "samples":
        start, end = (datetime.fromisoformat(args[key].replace("Z", "+00:00")) for key in ("start", "end"))
        if start.tzinfo is None or end.tzinfo is None or start >= end or (end-start).total_seconds() > 300:
            raise ValueError("Invalid sample window")
        samples = await client.list_samples(ids["streamId"], start=start, end=end)
        if len(samples) > 100000:
            raise ValueError("Sample window too large")
        return samples
    if operation == "createResearch":
        return await client.create_research(**args["research"])
    if operation == "createExperiment":
        return await client.create_experiment(ids["researchId"], **args["experiment"])
    if operation == "createParticipant":
        return await client.create_participant(ids["researchId"], **args["participant"])
    if operation == "createStream":
        return await client.create_stream(ids["experimentId"], ids["participantId"], **args["stream"])
    if operation == "appendSamples":
        return await client.write_samples(ids["streamId"], args["samples"], compress=True)
    event = dict(args["event"])
    for key in ("started_at", "ended_at"):
        if event.get(key):
            event[key] = datetime.fromisoformat(event[key].replace("Z", "+00:00"))
    return await client.create_event(ids["experimentId"], ids["participantId"], **event)


async def main():
    try:
        rpc = json.load(sys.stdin)
        async with ApiClient(rpc["apiUrl"], token=rpc["token"], timeout=30) as client:
            result = await dispatch(client, rpc["operation"], rpc.get("args", {}))
        reply = {"result": encode(result)}
    except httpx2.HTTPStatusError as error:
        reply = {"error": {"status": error.response.status_code, "message": "PhysioDB rejected the request"}}
    except httpx2.TimeoutException:
        reply = {"error": {"status": 504, "message": "PhysioDB timed out; verify writes before retrying"}}
    except (ValueError, TypeError, KeyError, ValidationError):
        reply = {"error": {"status": 400, "message": "Invalid PhysioDB request or response schema"}}
    except Exception:
        reply = {"error": {"status": 502, "message": "PhysioDB SDK request failed"}}
    print(json.dumps(reply))


if __name__ == "__main__":
    asyncio.run(main())
