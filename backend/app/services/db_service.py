import aiosqlite
import logging
from typing import List, Optional, Dict, Any
from app.core.exceptions import DatabaseError, NotFoundError

logger = logging.getLogger(__name__)

async def get_override_for_phrase(db: aiosqlite.Connection, text: str) -> Optional[Dict[str, Any]]:
    """Check if an exact override exists for the normalized phrase."""
    normalized_text = text.strip().lower()
    query = """
    SELECT id, phrase_pattern, corrected_valence, corrected_arousal, corrected_label
    FROM user_overrides
    WHERE LOWER(phrase_pattern) = ?
    LIMIT 1
    """
    async with db.execute(query, (normalized_text,)) as cursor:
        row = await cursor.fetchone()
        if row:
            return {
                "id": row["id"],
                "phrase_pattern": row["phrase_pattern"],
                "corrected_valence": row["corrected_valence"],
                "corrected_arousal": row["corrected_arousal"],
                "corrected_label": row["corrected_label"],
            }
    return None

async def get_recent_overrides(db: aiosqlite.Connection, limit: int = 5) -> List[Dict[str, Any]]:
    """Retrieve recent user overrides for Zero-RAG few-shot prompt context."""
    query = """
    SELECT phrase_pattern, corrected_valence, corrected_arousal, corrected_label
    FROM user_overrides
    ORDER BY created_at DESC
    LIMIT ?
    """
    async with db.execute(query, (limit,)) as cursor:
        rows = await cursor.fetchall()
        return [
            {
                "phrase_pattern": row["phrase_pattern"],
                "corrected_valence": row["corrected_valence"],
                "corrected_arousal": row["corrected_arousal"],
                "corrected_label": row["corrected_label"],
            }
            for row in rows
        ]

async def save_user_override(
    db: aiosqlite.Connection,
    phrase_pattern: str,
    corrected_valence: float,
    corrected_arousal: float,
    corrected_label: str
) -> Dict[str, Any]:
    """Insert or update a user override pattern."""
    normalized = phrase_pattern.strip()
    query = """
    INSERT INTO user_overrides (phrase_pattern, corrected_valence, corrected_arousal, corrected_label)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(phrase_pattern) DO UPDATE SET
        corrected_valence = excluded.corrected_valence,
        corrected_arousal = excluded.corrected_arousal,
        corrected_label = excluded.corrected_label,
        created_at = CURRENT_TIMESTAMP
    """
    await db.execute(query, (normalized, corrected_valence, corrected_arousal, corrected_label))
    await db.commit()

    override_data = await get_override_for_phrase(db, normalized)
    if not override_data:
        raise DatabaseError(f"Failed to retrieve saved override for phrase '{normalized}'")
    return override_data

async def create_message(
    db: aiosqlite.Connection,
    sender_role: str,
    text: str,
    valence: float,
    arousal: float,
    color_hex: str,
    emotion_label: str,
    is_corrected: bool = False
) -> Dict[str, Any]:
    """Insert a new message record."""
    query = """
    INSERT INTO messages (sender_role, text, valence, arousal, color_hex, emotion_label, is_corrected)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """
    cursor = await db.execute(
        query,
        (sender_role, text.strip(), valence, arousal, color_hex, emotion_label, 1 if is_corrected else 0)
    )
    await db.commit()
    message_id = cursor.lastrowid

    return await get_message_by_id(db, message_id)

async def get_message_by_id(db: aiosqlite.Connection, message_id: int) -> Dict[str, Any]:
    """Get a message by its ID."""
    query = """
    SELECT id, sender_role, text, valence, arousal, color_hex, emotion_label, is_corrected, created_at
    FROM messages
    WHERE id = ?
    """
    async with db.execute(query, (message_id,)) as cursor:
        row = await cursor.fetchone()
        if not row:
            raise NotFoundError(f"Message {message_id} not found")
        return {
            "id": row["id"],
            "sender_role": row["sender_role"],
            "text": row["text"],
            "valence": row["valence"],
            "arousal": row["arousal"],
            "color_hex": row["color_hex"],
            "emotion_label": row["emotion_label"],
            "is_corrected": bool(row["is_corrected"]),
            "created_at": str(row["created_at"])
        }

async def update_message_emotion(
    db: aiosqlite.Connection,
    message_id: int,
    valence: float,
    arousal: float,
    color_hex: str,
    emotion_label: str
) -> Dict[str, Any]:
    """Update a message's emotion scores and mark it as corrected."""
    query = """
    UPDATE messages
    SET valence = ?, arousal = ?, color_hex = ?, emotion_label = ?, is_corrected = 1
    WHERE id = ?
    """
    await db.execute(query, (valence, arousal, color_hex, emotion_label, message_id))
    await db.commit()
    return await get_message_by_id(db, message_id)

async def get_all_messages(db: aiosqlite.Connection) -> List[Dict[str, Any]]:
    """Retrieve all messages ordered by creation time."""
    query = """
    SELECT id, sender_role, text, valence, arousal, color_hex, emotion_label, is_corrected, created_at
    FROM messages
    ORDER BY id ASC
    """
    async with db.execute(query) as cursor:
        rows = await cursor.fetchall()
        return [
            {
                "id": row["id"],
                "sender_role": row["sender_role"],
                "text": row["text"],
                "valence": row["valence"],
                "arousal": row["arousal"],
                "color_hex": row["color_hex"],
                "emotion_label": row["emotion_label"],
                "is_corrected": bool(row["is_corrected"]),
                "created_at": str(row["created_at"])
            }
            for row in rows
        ]

async def clear_all_messages(db: aiosqlite.Connection) -> int:
    """Clear all messages from the database."""
    async with db.execute("SELECT COUNT(*) FROM messages") as cursor:
        row = await cursor.fetchone()
        count = row[0] if row else 0

    await db.execute("DELETE FROM messages")
    await db.commit()
    return count
