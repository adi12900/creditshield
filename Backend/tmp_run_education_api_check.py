import json
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app


def main() -> None:
    client = TestClient(app)
    statement_path = Path("../dataset/synthetic_users/studentshinde.csv")

    loan_details = {
        "course_name": "Btech CSE",
        "specialization": "Computer Science and Engineering",
        "college_name": "Lovely Professional University",
        "university_name": "Lovely Professional University",
        "admission_status": "confirmed",
        "academic_percentages": [
            {"level": "10th", "percentage": 80},
            {"level": "12th", "percentage": 70},
        ],
    }

    files = {
        "statement": (statement_path.name, statement_path.read_bytes(), "text/csv"),
    }
    form = {
        "loan_type": "education",
        "loan_amount": "600000",
        "use_bedrock": "false",
        "loan_details_json": json.dumps(loan_details),
    }

    analyze_resp = client.post("/api/v1/loan-appraisal/analyze-statement", data=form, files=files)
    print("ANALYZE_STATUS", analyze_resp.status_code)
    if analyze_resp.status_code != 200:
        print("ANALYZE_ERROR", analyze_resp.text)
        return

    analyze_data = analyze_resp.json()
    Path("/tmp/education_loan_analyze.json").write_text(json.dumps(analyze_data, indent=2))

    result = analyze_data.get("result", {})
    print("FINAL_SCORE", result.get("final_score"))
    print("RISK_LEVEL", result.get("risk_level"))
    print("RECOMMENDATION", result.get("recommendation"))
    print("SUMMARY", result.get("summary"))

    files2 = {
        "statement": (statement_path.name, statement_path.read_bytes(), "text/csv"),
    }
    form2 = {
        "loan_type": "education",
        "loan_amount": "600000",
        "use_bedrock": "false",
        "output_format": "text",
        "loan_details_json": json.dumps(loan_details),
    }

    report_resp = client.post("/api/v1/loan-appraisal/professional-report", data=form2, files=files2)
    print("REPORT_STATUS", report_resp.status_code)
    if report_resp.status_code != 200:
        print("REPORT_ERROR", report_resp.text)
        return

    report_text = report_resp.text
    Path("/tmp/education_loan_report.txt").write_text(report_text)
    print("REPORT_LEN", len(report_text))


if __name__ == "__main__":
    main()
