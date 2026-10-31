import os
import sys

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///d:/antigravityyy/Draftly/backend/e2e_test.db"

import uvicorn

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, log_level="info")

