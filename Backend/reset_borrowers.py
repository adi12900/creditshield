"""
Removes dummy borrowers and creates Yash's real account.
Run: python reset_borrowers.py (with venv activated)
"""
import asyncio
import hashlib
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))
import asyncpg
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

DUMMY_EMAILS = [
    "priya.sharma@example.com",
    "rahul.mehta@example.com",
    "anita.desai@example.com",
]

REAL_BORROWER = {
    "full_name": "Yash Kalkhambkar",
    "email": "yashkalkhambkar@gmail.com",
    "mobile_number": "8956279427",
    "password": "Test@1234",
}

AADHAAR_NUMBER = "677665324088"


def hash_aadhaar(aadhaar: str) -> str:
    return hashlib.sha256(aadhaar.strip().replace(" ", "").encode()).hexdigest()


async def reset():
    db_url = os.getenv("DATABASE_URL")
    conn = await asyncpg.connect(db_url)
    print("Connected.\n")

    # Remove dummy borrowers
    for email in DUMMY_EMAILS:
        row = await conn.fetchrow("SELECT id FROM borrowers WHERE email = $1", email)
        if row:
            bid = row["id"]
            await conn.execute("DELETE FROM borrower_kyc_profiles WHERE borrower_id = $1", bid)
            await conn.execute("DELETE FROM borrowers WHERE id = $1", bid)
            print(f"  Removed dummy borrower: {email}")
        else:
            print(f"  Not found (skipped): {email}")

    # Upsert real borrower
    existing = await conn.fetchrow(
        "SELECT id FROM borrowers WHERE email = $1 OR mobile_number = $2",
        REAL_BORROWER["email"], REAL_BORROWER["mobile_number"]
    )
    if existing:
        await conn.execute(
            """UPDATE borrowers SET full_name=$1, mobile_number=$2, updated_at=NOW()
               WHERE id=$3""",
            REAL_BORROWER["full_name"], REAL_BORROWER["mobile_number"], existing["id"]
        )
        borrower_id = existing["id"]
        print(f"\n  Updated borrower: {REAL_BORROWER['email']} (id={borrower_id})")
    else:
        password_hash = pwd_context.hash(REAL_BORROWER["password"])
        borrower_id = await conn.fetchval(
            """INSERT INTO borrowers (full_name, email, mobile_number, password_hash, is_active, created_at, updated_at)
               VALUES ($1, $2, $3, $4, TRUE, NOW(), NOW()) RETURNING id""",
            REAL_BORROWER["full_name"], REAL_BORROWER["email"],
            REAL_BORROWER["mobile_number"], password_hash,
        )
        print(f"\n  Created borrower: {REAL_BORROWER['email']} (id={borrower_id})")

    # Ensure KYC profile is reset to Pending so Yash goes through KYC flow
    kyc = await conn.fetchrow("SELECT id FROM borrower_kyc_profiles WHERE borrower_id = $1", borrower_id)
    if kyc:
        await conn.execute(
            "UPDATE borrower_kyc_profiles SET kyc_status='Pending', verified_at=NULL, updated_at=NOW() WHERE borrower_id=$1",
            borrower_id
        )
        print(f"  Reset KYC to Pending for borrower_id={borrower_id}")
    else:
        await conn.execute(
            """INSERT INTO borrower_kyc_profiles (borrower_id, kyc_status, kyc_provider, created_at, updated_at)
               VALUES ($1, 'Pending', 'aadhaar_email_otp', NOW(), NOW())""",
            borrower_id
        )
        print(f"  Created KYC profile (Pending) for borrower_id={borrower_id}")

    # Update aadhaar_registry to link to Yash's email
    h = hash_aadhaar(AADHAAR_NUMBER)
    reg = await conn.fetchrow("SELECT id FROM aadhaar_registry WHERE aadhaar_hash = $1", h)
    if reg:
        await conn.execute(
            "UPDATE aadhaar_registry SET email=$1, full_name=$2 WHERE aadhaar_hash=$3",
            REAL_BORROWER["email"], REAL_BORROWER["full_name"], h
        )
        print(f"  Updated aadhaar_registry for {REAL_BORROWER['full_name']}")

    await conn.close()
    print("\nDone!")
    print(f"\n  Login: {REAL_BORROWER['mobile_number']} / {REAL_BORROWER['password']}")


if __name__ == "__main__":
    asyncio.run(reset())
