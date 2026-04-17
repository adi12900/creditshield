"""
Test: upload a document via the link, then verify the agent runs and updates the DB.
"""
import sys, time, requests

BASE = "http://localhost:8000"

print("=" * 55)
print("AGENT DOCUMENT VERIFICATION - END TO END TEST")
print("=" * 55)

# 1. Login
print("\n[1] Login...")
r = requests.post(f"{BASE}/api/v1/auth/login",
    json={"username": "mohittade120@gmail.com", "password": "Mohit@1230"})
assert r.status_code == 200, r.text
headers = {"Authorization": f"Bearer {r.json()['access_token']}"}
print("    ✅ Login OK")

# 2. Send communication → get upload token
print("\n[2] Generate upload token...")
r = requests.post(
    f"{BASE}/api/v1/workflow/loan-officer/communications/ARN2026041519224310/send",
    json={"channel": "email", "subject": "Doc Verify Test", "message": "Please upload."},
    headers=headers
)
assert r.status_code == 200, r.text
upload_link = r.json()["upload_link"]
print(f"    ✅ Upload link: {upload_link}")

# 3. Upload a PDF with real text content
print("\n[3] Uploading PDF with text content...")
import io
fake_pdf_text = b"""%PDF-1.4
PAN Card Details:
Name: Aditya Shinde
PAN Number: ABCDS1234F
Date of Birth: 15/03/1990
Father Name: Ramesh Shinde
This is a valid PAN card document issued by Income Tax Department of India.
"""
r = requests.post(
    upload_link,
    data={"doc_type": "PAN Card"},
    files={"file": ("pan_card.pdf", io.BytesIO(fake_pdf_text), "application/pdf")}
)
assert r.status_code == 200, r.text
doc = r.json()["document"]
doc_id = doc["id"]
print(f"    ✅ Uploaded doc_id={doc_id}, status={doc['status']}")

# 4. Wait for background agent verification to complete
print("\n[4] Waiting for agent verification (background task)...")
sys.path.insert(0, ".")
from app.core.database import SessionLocal
from sqlalchemy import text

for attempt in range(12):  # wait up to 60s
    time.sleep(5)
    db = SessionLocal()
    row = db.execute(text(
        "SELECT status, confidence, agent_verdict FROM documents WHERE id = :id"
    ), {"id": doc_id}).fetchone()
    db.close()

    status_val = row[0] if row else "unknown"
    print(f"    [{attempt+1}] status={status_val}", end="")

    if status_val not in ("Pending OCR",):
        print(" ← agent done!")
        break
    print(" (still processing...)")
else:
    print("\n    ⚠️  Agent took longer than 60s (may still be running)")

# 5. Show final result
print("\n[5] Final document state:")
db = SessionLocal()
row = db.execute(text(
    "SELECT id, doc_type, status, confidence, agent_verdict FROM documents WHERE id = :id"
), {"id": doc_id}).fetchone()
db.close()

if row:
    print(f"    Doc ID:     {row[0]}")
    print(f"    Type:       {row[1]}")
    print(f"    Status:     {row[2]}")
    print(f"    Confidence: {row[3]}")
    print(f"    Verdict:    {str(row[4])[:300] if row[4] else 'pending'}")

print("\n" + "=" * 55)
if row and row[2] not in ("Pending OCR", "Verification Failed"):
    print("✅ AGENT VERIFICATION WORKING")
else:
    print("⚠️  Check backend logs for agent output")
print("=" * 55)
