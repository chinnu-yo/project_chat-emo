import pytest
import httpx
from app.main import app
from app.db.database import init_db

@pytest.mark.asyncio
async def test_full_e2e_flow():
    await init_db()

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health check
        res_health = await client.get("/api/v1/health")
        assert res_health.status_code == 200
        assert res_health.json()["status"] == "ok"

        # 2. Classify positive message as Sender
        res_msg1 = await client.post("/api/v1/messages/classify", json={
            "sender_role": "sender",
            "text": "I am super excited for our launch tomorrow! 🎉"
        })
        assert res_msg1.status_code == 201
        data1 = res_msg1.json()
        assert data1["sender_role"] == "sender"
        assert data1["valence"] > 0
        assert data1["color_hex"].startswith("#")
        msg1_id = data1["id"]

        # 3. Classify negative message as Recipient
        res_msg2 = await client.post("/api/v1/messages/classify", json={
            "sender_role": "recipient",
            "text": "That service was terrible and I am frustrated."
        })
        assert res_msg2.status_code == 201
        data2 = res_msg2.json()
        assert data2["sender_role"] == "recipient"
        assert data2["valence"] < 0
        assert data2["color_hex"].startswith("#")

        # 4. List messages from SQLite
        res_list = await client.get("/api/v1/messages")
        assert res_list.status_code == 200
        history = res_list.json()
        assert len(history) >= 2

        # 5. Submit override (drag dot correction) for message 1
        res_override = await client.post("/api/v1/overrides", json={
            "message_id": msg1_id,
            "phrase_pattern": "I am super excited for our launch tomorrow! 🎉",
            "corrected_valence": 0.95,
            "corrected_arousal": 0.90,
            "corrected_label": "Overjoyed"
        })
        assert res_override.status_code == 200
        ov_data = res_override.json()
        assert ov_data["corrected_valence"] == 0.95
        assert ov_data["corrected_label"] == "Overjoyed"
        assert ov_data["updated_message"]["is_corrected"] is True

        # 6. Verify Zero-RAG: sending the same phrase again returns the saved override directly!
        res_rag = await client.post("/api/v1/messages/classify", json={
            "sender_role": "sender",
            "text": "I am super excited for our launch tomorrow! 🎉"
        })
        assert res_rag.status_code == 201
        rag_data = res_rag.json()
        assert rag_data["valence"] == 0.95
        assert rag_data["arousal"] == 0.90
        assert rag_data["emotion_label"] == "Overjoyed"
        assert rag_data["is_corrected"] is True
