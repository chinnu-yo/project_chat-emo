import sqlite3
import aiosqlite
import logging
from typing import AsyncGenerator
from app.core.config import settings

logger = logging.getLogger(__name__)

INIT_SQL = """
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_role TEXT NOT NULL,
    text TEXT NOT NULL,
    valence REAL NOT NULL,
    arousal REAL NOT NULL,
    color_hex TEXT NOT NULL,
    emotion_label TEXT NOT NULL,
    is_corrected BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_overrides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phrase_pattern TEXT UNIQUE NOT NULL,
    corrected_valence REAL NOT NULL,
    corrected_arousal REAL NOT NULL,
    corrected_label TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

async def init_db() -> None:
    """Initialize SQLite database and create tables if they do not exist."""
    try:
        async with aiosqlite.connect(settings.DB_PATH) as db:
            await db.executescript(INIT_SQL)
            await db.commit()
        logger.info(f"Database initialized successfully at {settings.DB_PATH}")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise

async def get_db() -> AsyncGenerator[aiosqlite.Connection, None]:
    """Dependency helper to yield an async database connection."""
    async with aiosqlite.connect(settings.DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        yield db
