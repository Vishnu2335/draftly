import asyncio
import os
import sys

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///d:/antigravityyy/Draftly/backend/e2e_test.db"

from app.core.database import Base, get_engine
import app.models  # load all models


async def init_db():
    engine = get_engine()
    if engine is None:
        raise RuntimeError("Failed to initialize engine for e2e_test.db")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("E2E SQLite database tables created successfully.")


if __name__ == "__main__":
    asyncio.run(init_db())
