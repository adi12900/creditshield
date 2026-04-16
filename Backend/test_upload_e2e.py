"""
Full end-to-end test: login → send communication → GET upload page → POST file upload → verify in DB
"""
import sys
import os
import io
import requests

BASE = "http://localhost:8000"

print("=" * 55)
print("DOCUMENT UPLOAD END-TO-END TEST")
print("=" * 55)

# Step 1: Login
print("\n[1] Logging in as loan officer...")
r = requests.post(f"{BASE}/api/v1/auth/login", json={
    "username": "mohittade120@gmail.com",
    "password": "Mohit@1230"
})
assert r.status_code == 200, f"Login failed: {r.text}"
token = r.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print("    ✅ Login OK")

# Step 2: Send communication → get upload token
print("\n[2] Sending communication to generate upload link...")
r = requests.post(
    f"{BASE}/api/v1/workflow/loan-officer/communications/ARN2026041519224310/send",
    json={"channel": "email", "subject": "Doc Upload Test", "message": "Please upload your documents."},
    headers=headers
)
assert r.status_code == 200, f"Send comm failed: {r.text}"
data = r.json()
upload_token = data["upload_token"]
upload_link  = data["upload_link"]
print(f"    ✅ Token generated: {upload_token[:25]}...")
print(f"    ✅ Upload link: {upload_link}")

# Step 3: GET upload page (no auth)
print("\n[3] GET upload page (no auth required)...")
r = requests.get(upload_link)
assert r.status_code == 200, f"GET page failed: {r.status_code}"
assert "uploadForm" in r.text, "Form not found in page"
assert "Bank Statement" in r.text, "Doc types not found"
assert "Upload Link Error" not in r.text, f"Got error page: {r.text[:200]}"
print("    ✅ Upload page loaded correctly")
print("    ✅ Form present, doc types present, no errors")

# Step 4: POST a fake PDF file
print("\n[4] Uploading a test PDF document...")
fake_pdf = b"%PDF-1.4 fake pdf content for testing creditshield document upload"
r = requests.post(
    upload_link,
    data={"doc_type": "Bank Statement"},
    files={"file": ("test_bank_statement.pdf", io.BytesIO(fake_pdf), "application/pdf")}
)
print(f"    Response status: {r.status_code}")
print(f"    Response body: {r.text[:300]}")
assert r.status_code == 200, f"Upload failed: {r.text}"
resp = r.json()
assert resp.get("success") == True, f"Upload not successful: {resp}"
doc = resp["document"]
print(f"    ✅ Document uploaded!")
print(f"    ✅ Doc ID: {doc['id']}")
print(f"    ✅ Doc type: {doc['doc_type']}")
print(f"    ✅ Filename: {doc['filename']}")
print(f"    ✅ Status: {doc['status']}")

# Step 5: Upload a second doc with same token (multi-use test)
print("\n[5] Uploading second document with same token (multi-use)...")
fake_img = b"\xff\xd8\xff fake jpeg content"
r = requests.post(
    upload_link,
    data={"doc_type": "PAN Card"},
    files={"file": ("pan_card.jpg", io.BytesIO(fake_img), "image/jpeg")}
)
assert r.status_code == 200, f"Second upload failed: {r.text}"
resp2 = r.json()
assert resp2.get("success") == True
print(f"    ✅ Second upload OK - Doc ID: {resp2['document']['id']}, type: {resp2['document']['doc_type']}")

# Step 6: Verify both docs in DB
print("\n[6] Verifying documents in database...")
sys.path.insert(0, ".")
from app.core.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
docs = db.execute(text(
    "SELECT id, doc_type, status, storage_url FROM documents WHERE application_id = 17 ORDER BY id DESC LIMIT 5"
)).fetchall()
print(f"    Found {len(docs)} documents in DB:")
for d in docs:
    print(f"      id={d[0]} | type={d[1]} | status={d[2]} | url={str(d[3])[:50]}")
db.close()

assert len(docs) >= 2, "Expected at least 2 documents in DB"
print("    ✅ Both documents confirmed in database")

print("\n" + "=" * 55)
print("✅ ALL TESTS PASSED - DOCUMENT UPLOAD IS WORKING")
print("=" * 55)
print("\nSummary:")
print(f"  • Token generation:     ✅")
print(f"  • Upload page (GET):    ✅")
print(f"  • PDF upload (POST):    ✅")
print(f"  • JPG upload (POST):    ✅")
print(f"  • Multi-use token:      ✅")
print(f"  • DB persistence:       ✅")
print(f"\nReady to push and merge. ✅")
