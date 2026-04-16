"""
Creates the aadhaar_registry table and seeds Aadhaar entries.
Run: python seed_aadhaar_registry.py
"""
import asyncio
import hashlib
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))
import asyncpg


def hash_aadhaar(aadhaar: str) -> str:
    return hashlib.sha256(aadhaar.strip().replace(" ", "").encode()).hexdigest()


# Add team members here. Later your team lead will send more.
AADHAAR_ENTRIES = [
    {
        "aadhaar_number": "677665324088",  # Yash - for testing
        "email": "yashkalkhambkar@gmail.com",
        "full_name": "Yash Kalkhambkar",
    },
    # Add more entries here when team lead sends them:
    # { "aadhaar_number": "XXXXXXXXXXXX", "email": "member@example.com", "full_name": "Name" },
]


async def seed():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise ValueError("DATABASE_URL not found in .env")

    conn = await asyncpg.connect(db_url)
    print("Connected to database.")

    # Create table if not exists
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS aadhaar_registry (
            id SERIAL PRIMARY KEY,
            aadhaar_hash VARCHAR(64) UNIQUE NOT NULL,
            email VARCHAR(255) NOT NULL,
            full_name VARCHAR(120) NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    print("Table aadhaar_registry ready.")

    for entry in AADHAAR_ENTRIES:
        h = hash_aadhaar(entry["aadhaar_number"])
        existing = await conn.fetchrow("SELECT id FROM aadhaar_registry WHERE aadhaar_hash = $1", h)
        if existing:
            print(f"  Already exists: {entry['full_name']} ({entry['email']})")
        else:
            await conn.execute(
                """
                INSERT INTO aadhaar_registry (aadhaar_hash, email, full_name, is_active)
                VALUES ($1, $2, $3, TRUE)
                """,
                h, entry["email"], entry["full_name"],
            )
            print(f"  Added: {entry['full_name']} ({entry['email']})")

    await conn.close()
    print("\nDone! Aadhaar registry seeded.")
    print("\nNote: OTP_SERVICE_URL must be set in .env if not using default localhost:3001")


if __name__ == "__main__":
    asyncio.run(seed())
