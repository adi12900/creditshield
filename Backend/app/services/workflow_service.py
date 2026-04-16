from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from sqlalchemy import text
from app.core.database import SessionLocal
from app.models.document import Document
from app.models.loan_application import LoanApplication
from app.models.loan_appraisal_record import LoanAppraisalRecord
from app.models.credit_memo import CreditMemo
from app.models.field_verification_evidence import FieldVerificationEvidence
from app.models.user import User, UserRole
from app.schemas.workflow import AuditLogItem, RegulatoryReport
from app.services.s3 import extract_object_key_from_url, generate_presigned_url


class WorkflowServiceError(Exception):
    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.status_code = status_code


class WorkflowService:
    def __init__(self) -> None:
        self._applications: dict[str, dict[str, Any]] = {
            "ARN202600001": {
                "arn": "ARN202600001",
                "borrower_name": "Rajesh Kumar",
                "loan_amount": 500000,
                "stage": "Lead",
                "risk_grade": "A+",
                "credit_score": 730,
                "kyc_status": "Pending",
                "employment_type": "Salaried",
                "purpose": "Home Renovation",
            },
            "ARN202600004": {
                "arn": "ARN202600004",
                "borrower_name": "Vikram Singh",
                "loan_amount": 850000,
                "stage": "Submitted",
                "risk_grade": "A+",
                "credit_score": 720,
                "kyc_status": "Verified",
                "employment_type": "Salaried",
                "purpose": "Business Expansion",
            },
            "ARN202600005": {
                "arn": "ARN202600005",
                "borrower_name": "Neha Gupta",
                "loan_amount": 650000,
                "stage": "Documents Pending",
                "risk_grade": "B",
                "credit_score": 680,
                "kyc_status": "Pending",
                "employment_type": "Salaried",
                "purpose": "Medical Expenses",
            },
            "ARN202600009": {
                "arn": "ARN202600009",
                "borrower_name": "Rahul Verma",
                "loan_amount": 800000,
                "stage": "Underwriting",
                "risk_grade": "A+",
                "credit_score": 735,
                "kyc_status": "Verified",
                "employment_type": "Self Employed",
                "purpose": "Inventory Funding",
            },
            "ARN202600011": {
                "arn": "ARN202600011",
                "borrower_name": "Suresh Rao",
                "loan_amount": 1200000,
                "stage": "Offer Sent",
                "risk_grade": "A",
                "credit_score": 715,
                "kyc_status": "Verified",
                "employment_type": "Salaried",
                "purpose": "Debt Consolidation",
            },
            "ARN202600015": {
                "arn": "ARN202600015",
                "borrower_name": "Anil Kumar",
                "loan_amount": 1100000,
                "stage": "Rejected",
                "risk_grade": "C",
                "credit_score": 640,
                "kyc_status": "Verified",
                "employment_type": "Self Employed",
                "purpose": "Working Capital",
            },
        }

        self._documents: dict[str, list[dict[str, Any]]] = {
            arn: [
                {"id": "901", "type": "Aadhaar Card", "status": "Verified", "confidence": 98},
                {"id": "902", "type": "PAN Card", "status": "Verified", "confidence": 96},
                {"id": "903", "type": "Bank Statement", "status": "Verified", "confidence": 94},
            ]
            for arn in self._applications
        }

        self._communications: dict[str, list[dict[str, Any]]] = {
            arn: [
                {
                    "id": "c1",
                    "channel": "email",
                    "subject": "Application Received",
                    "message": f"Thank you for applying. ARN: {arn}",
                    "sent_at": datetime.now(tz=timezone.utc).isoformat(),
                }
            ]
            for arn in self._applications
        }

        self._credit_memos: dict[str, dict[str, Any]] = {}
        self._policy_overrides: dict[str, list[dict[str, Any]]] = {}
        self._underwriter_decisions: dict[str, list[dict[str, Any]]] = {}
        self._field_visit_status: dict[str, str] = {}
        self._field_visit_reports: dict[str, dict[str, Any]] = {}
        self._required_evidence_by_loan_type: dict[str, list[str]] = {
            "Personal Loan": ["house_front_photo"],
            "Business Loan": ["shop_front_photo", "shop_activity_photo"],
            "Gold Loan": ["gold_closeup_image"],
            "Education Loan": ["college_building_photo"],
            "Car Loan": ["parking_space_photo"],
            "Home Loan": ["property_exterior_photo"],
        }

        self._reports: list[RegulatoryReport] = [
            RegulatoryReport(
                id="REP-001",
                name="RBI NBFC Returns - Q1 2026",
                report_type="Quarterly",
                due_date="2026-04-15",
                status="In Progress",
                completeness=85,
            ),
            RegulatoryReport(
                id="REP-002",
                name="AML/KYC Compliance Summary",
                report_type="Monthly",
                due_date="2026-04-05",
                status="Submitted",
                completeness=100,
            ),
        ]

        self._audit_logs: list[AuditLogItem] = [
            AuditLogItem(
                timestamp=datetime.now(tz=timezone.utc),
                user="System",
                action="Workflow service initialized",
                resource="workflow",
                details="Role APIs bootstrapped",
                risk="Low",
            )
        ]

        self._allowed_stages = {
            "Lead",
            "Submitted",
            "Documents Pending",
            "KYC",
            "Underwriting",
            "Offer Sent",
            "Disbursed",
            "Rejected",
        }
        self._allowed_risk_grades = {"A+", "A", "B", "C"}
        self._allowed_kyc_statuses = {"Verified", "Pending"}
        self._allowed_employment_types = {"Salaried", "Self Employed"}

    def _to_workflow_application(self, row: LoanApplication) -> dict[str, Any]:
        stage = row.stage if row.stage in self._allowed_stages else "Submitted"
        risk_grade = row.risk_grade if row.risk_grade in self._allowed_risk_grades else "B"
        kyc_status = row.kyc_status if row.kyc_status in self._allowed_kyc_statuses else "Pending"
        employment_type = row.employment_type if row.employment_type in self._allowed_employment_types else "Salaried"
        loan_amount = float(row.loan_amount if isinstance(row.loan_amount, Decimal) else row.loan_amount or 0)

        return {
            "arn": row.arn,
            "borrower_name": row.borrower_name,
            "borrower_email": row.borrower_email,
            "borrower_phone": row.borrower_phone,
            "loan_amount": loan_amount,
            "loan_type": row.loan_type,
            "stage": stage,
            "risk_grade": risk_grade,
            "credit_score": int(row.credit_score or 700),
            "kyc_status": kyc_status,
            "employment_type": employment_type,
            "purpose": row.purpose or "General Purpose",
            "created_at": row.created_at,
        }

    def _update_application_fields(self, arn: str, **fields: Any) -> bool:
        try:
            with SessionLocal() as db:
                row = db.query(LoanApplication).filter(LoanApplication.arn == arn).first()
                if not row:
                    return False
                for field, value in fields.items():
                    if hasattr(row, field):
                        setattr(row, field, value)
                db.add(row)
                db.commit()
                return True
        except Exception:
            return False

    def _get_application(self, arn: str) -> dict[str, Any]:
        try:
            with SessionLocal() as db:
                row = db.query(LoanApplication).filter(LoanApplication.arn == arn).first()
                if row:
                    return self._to_workflow_application(row)
        except Exception:
            # Fallback to in-memory dataset when DB is unavailable.
            pass

        app = self._applications.get(arn)
        if not app:
            raise WorkflowServiceError(f"Application not found for ARN {arn}", 404)
        return app

    def list_applications(self, stage: str | None = None, require_submitted_memo: bool = False) -> list[dict[str, Any]]:
        try:
            with SessionLocal() as db:
                query = db.query(LoanApplication)
                if require_submitted_memo:
                    query = (
                        query.join(CreditMemo, CreditMemo.application_id == LoanApplication.id)
                        .filter(CreditMemo.is_submitted.is_(True))
                    )
                if stage:
                    query = query.filter(LoanApplication.stage == stage)
                rows = query.order_by(LoanApplication.id.asc()).all()
                if rows:
                    return [self._to_workflow_application(row) for row in rows]
        except Exception:
            # Fallback to in-memory dataset when DB is unavailable.
            pass

        applications = list(self._applications.values())
        if require_submitted_memo:
            applications = [app for app in applications if self._credit_memos.get(app["arn"], {}).get("submitted")]
        if stage:
            applications = [app for app in applications if app["stage"] == stage]
        return applications

    def get_application(self, arn: str) -> dict[str, Any]:
        return self._get_application(arn)

    def _get_application_row(self, arn: str, db) -> LoanApplication:
        row = db.query(LoanApplication).filter(LoanApplication.arn == arn).first()
        if not row:
            raise WorkflowServiceError(f"Application not found for ARN {arn}", 404)
        return row

    def _get_loan_officer_emails(self, db) -> list[str]:
        rows = (
            db.query(User)
            .filter(User.role == UserRole.LOAN_OFFICER)
            .filter(User.is_active.is_(True))
            .order_by(User.id.asc())
            .all()
        )
        return [row.email for row in rows if row.email]

    def _send_email_notification(self, to: str, subject: str, html: str) -> tuple[bool, str | None]:
        try:
            response = httpx.post(
                f"{settings.otp_service_url}/send-email",
                json={"to": to, "subject": subject, "html": html},
                timeout=12,
            )
            response.raise_for_status()
            return True, None
        except Exception as exc:  # noqa: BLE001
            return False, str(exc)

    def role_dashboard(self, role: str) -> dict[str, Any]:
        apps = self.list_applications()
        if role == "field_officer":
            pending = 0
            in_progress = 0
            completed = 0
            for app in apps:
                status = self._field_visit_status.get(app["arn"], "Pending Visit")
                if status == "Completed":
                    completed += 1
                elif status == "In Progress":
                    in_progress += 1
                else:
                    pending += 1
            return {
                "role": role,
                "stats": [
                    {"key": "assigned_cases", "value": len(apps)},
                    {"key": "pending_visit", "value": pending},
                    {"key": "in_progress", "value": in_progress},
                    {"key": "completed", "value": completed},
                ],
            }
        if role == "loan_officer":
            return {
                "role": role,
                "stats": [
                    {"key": "active_applications", "value": len([a for a in apps if a["stage"] not in {"Disbursed", "Rejected"}])},
                    {"key": "sla_breaches", "value": len([a for a in apps if a["stage"] == "Documents Pending"])},
                ],
            }
        if role == "credit_analyst":
            return {
                "role": role,
                "stats": [
                    {"key": "in_progress", "value": len([a for a in apps if a["stage"] in {"Submitted", "Documents Pending"}])},
                    {"key": "avg_credit_score", "value": int(sum(a["credit_score"] for a in apps) / len(apps))},
                ],
            }
        if role == "underwriter":
            return {
                "role": role,
                "stats": [
                    {"key": "underwriting_queue", "value": len([a for a in apps if a["stage"] == "Underwriting"])},
                    {"key": "approval_rate", "value": "78%"},
                ],
            }
        return {
            "role": role,
            "stats": [
                {"key": "kyc_pending", "value": len([a for a in apps if a["kyc_status"] == "Pending"])},
                {"key": "reports_due", "value": len([r for r in self._reports if r.status != "Submitted"])},
            ],
        }

    def _field_assignment_seed(self, value: str) -> int:
        return sum(ord(char) for char in value)

    def _get_assigned_field_cases(self, username: str) -> list[dict[str, Any]]:
        applications = [
            app for app in self.list_applications()
            if app["stage"] not in {"Disbursed", "Rejected"}
        ]
        if not applications:
            return []

        assigned = [
            app for app in applications
            if (self._field_assignment_seed(app["arn"]) + self._field_assignment_seed(username)) % 2 == 0
        ]
        if not assigned:
            assigned = applications[: min(3, len(applications))]
        return assigned

    def _ensure_field_assignment(self, username: str, arn: str) -> None:
        assigned_arns = {item["arn"] for item in self._get_assigned_field_cases(username)}
        if arn not in assigned_arns:
            raise WorkflowServiceError("Case is not assigned to this field officer", 403)

    def list_field_officer_cases(self, username: str, status: str | None = None, query: str | None = None) -> list[dict[str, Any]]:
        cases = []
        normalized_status = status.strip().lower() if status else None
        normalized_query = query.strip().lower() if query else None

        for app in self._get_assigned_field_cases(username):
            visit_status = self._field_visit_status.get(app["arn"], "Pending Visit")
            if normalized_status and visit_status.lower() != normalized_status:
                continue
            if normalized_query and normalized_query not in app["arn"].lower() and normalized_query not in app["borrower_name"].lower():
                continue

            cases.append({
                "arn": app["arn"],
                "borrower_name": app["borrower_name"],
                "loan_amount": app["loan_amount"],
                "status": visit_status,
            })

        return cases

    def get_field_officer_case_detail(self, username: str, arn: str) -> dict[str, Any]:
        self._ensure_field_assignment(username, arn)
        app = self._get_application(arn)

        borrower_phone = None
        borrower_address = f"Address on file for {app['borrower_name']}"
        try:
            with SessionLocal() as db:
                row = db.query(LoanApplication).filter(LoanApplication.arn == arn).first()
                if row:
                    borrower_phone = row.borrower_phone
                    if isinstance(row.co_applicant_details, dict):
                        borrower_address = str(
                            row.co_applicant_details.get("address")
                            or row.co_applicant_details.get("borrower_address")
                            or borrower_address
                        )
        except Exception:
            pass

        map_link = f"https://www.google.com/maps/search/?api=1&query={app['borrower_name'].replace(' ', '+')}"
        return {
            "arn": app["arn"],
            "borrower_name": app["borrower_name"],
            "borrower_phone": borrower_phone,
            "borrower_address": borrower_address,
            "loan_amount": app["loan_amount"],
            "loan_type": app.get("loan_type") or "personal_loan",
            "stage": app["stage"],
            "status": self._field_visit_status.get(arn, "Pending Visit"),
            "map_link": map_link,
            "report_submitted": arn in self._field_visit_reports,
        }

    def start_field_visit(self, username: str, arn: str) -> dict[str, Any]:
        self._ensure_field_assignment(username, arn)
        current_status = self._field_visit_status.get(arn, "Pending Visit")
        if current_status != "Completed":
            self._field_visit_status[arn] = "In Progress"

        self.add_audit_log(
            user="Field Officer",
            action="Field Visit Started",
            resource=arn,
            details=f"Started by {username}",
            risk="Low",
        )
        return {"arn": arn, "status": self._field_visit_status.get(arn, "In Progress")}

    def submit_field_visit_report(self, username: str, arn: str, payload: dict[str, Any]) -> dict[str, Any]:
        self._ensure_field_assignment(username, arn)
        app = self._get_application(arn)

        loan_type = str(payload.get("loan_type") or "").strip()
        required_evidence = self._required_evidence_by_loan_type.get(loan_type, [])
        evidence_types: set[str] = set()
        try:
            with SessionLocal() as db:
                application_row = db.query(LoanApplication).filter(LoanApplication.arn == arn).first()
                if application_row:
                    evidence_rows = (
                        db.query(FieldVerificationEvidence.evidence_type)
                        .filter(FieldVerificationEvidence.application_id == application_row.id)
                        .all()
                    )
                    evidence_types = {
                        str(row[0]).strip().lower()
                        for row in evidence_rows
                        if row and row[0]
                    }
        except Exception:
            evidence_types = set()

        missing_evidence = [item for item in required_evidence if item.lower() not in evidence_types]
        if missing_evidence:
            legacy_uploaded_docs = payload.get("uploaded_documents") or []
            legacy_types = {
                str(item.get("doc_type", "")).strip().lower()
                for item in legacy_uploaded_docs
                if isinstance(item, dict)
            }
            evidence_types.update(legacy_types)
            missing_evidence = [item for item in required_evidence if item.lower() not in evidence_types]

        if missing_evidence:
            raise WorkflowServiceError(
                f"Missing required field evidence for {loan_type}: {', '.join(missing_evidence)}",
                422,
            )

        self._field_visit_reports[arn] = {
            **payload,
            "arn": arn,
            "submitted_by": username,
            "submitted_at": datetime.now(tz=timezone.utc).isoformat(),
        }
        self._field_visit_status[arn] = "Completed"

        stage_progression = {
            "Lead": "Submitted",
            "Submitted": "Documents Pending",
            "Documents Pending": "KYC",
            "KYC": "Underwriting",
            "Underwriting": "Offer Sent",
        }
        next_stage = stage_progression.get(app["stage"], app["stage"])
        if next_stage != app["stage"]:
            self._update_application_fields(arn, stage=next_stage)

        self.add_audit_log(
            user="Field Officer",
            action="Field Report Submitted",
            resource=arn,
            details=f"Risk={((payload.get('risk_remarks') or {}).get('risk_level'))}; loan_type={loan_type}; next_stage={next_stage}",
            risk="Medium" if ((payload.get("risk_remarks") or {}).get("risk_level") == "High") else "Low",
        )

        return {
            "arn": arn,
            "status": "Completed",
            "next_stage": next_stage,
            "submitted_at": self._field_visit_reports[arn]["submitted_at"],
        }

    def get_documents(self, arn: str, db=None) -> list[dict[str, Any]]:
        self._get_application(arn)
        if db:
            from sqlalchemy import text
            rows = db.execute(text("""
                SELECT d.id, d.doc_type, d.status, d.confidence, d.agent_verdict, d.storage_url, d.uploaded_at
                FROM documents d
                JOIN loan_applications la ON d.application_id = la.id
                WHERE la.arn = :arn
                ORDER BY d.uploaded_at DESC
            """), {"arn": arn}).fetchall()

            def _to_percent(raw: Any) -> int:
                if raw is None:
                    return 0
                try:
                    value = float(raw)
                except (TypeError, ValueError):
                    return 0
                if value <= 1.0:
                    value *= 100.0
                return max(0, min(100, int(round(value))))

            return [
                {
                    "id": str(row[0]),
                    "type": row[1],
                    "status": row[2],
                    "confidence": _to_percent(row[3]),
                    "agent_verdict": row[4],
                    "storage_url": (
                        generate_presigned_url(extract_object_key_from_url(row[5]))
                        if row[5]
                        else None
                    ),
                    "uploaded_at": row[6].isoformat() if row[6] else None,
                }
                for row in rows
            ]
        return self._documents.get(arn, [])

    def review_document(self, arn: str, document_id: str, decision: str, reason: str | None, db=None) -> dict[str, Any]:
        if db:
            from sqlalchemy import text
            new_status = "Verified" if decision == "approve" else "Flagged"
            db.execute(text("""
                UPDATE documents SET status = :status
                WHERE id = :doc_id AND application_id = (
                    SELECT id FROM loan_applications WHERE arn = :arn
                )
            """), {"status": new_status, "doc_id": int(document_id), "arn": arn})
            db.commit()
            row = db.execute(text("""
                SELECT d.id, d.doc_type, d.status, d.confidence, d.agent_verdict
                FROM documents d
                JOIN loan_applications la ON d.application_id = la.id
                WHERE d.id = :doc_id AND la.arn = :arn
            """), {"doc_id": int(document_id), "arn": arn}).fetchone()
            if not row:
                raise WorkflowServiceError(f"Document {document_id} not found", 404)
            self.add_audit_log(
                user="Loan Officer",
                action=f"Document {decision.title()}",
                resource=f"{arn}:{document_id}",
                details=reason or "No reason provided",
                risk="Low" if decision == "approve" else "Medium",
            )
            return {"id": str(row[0]), "type": row[1], "status": row[2],
                    "confidence": int(round((float(row[3]) * 100.0) if row[3] is not None and float(row[3]) <= 1.0 else float(row[3] or 0))), "agent_verdict": row[4]}

        docs = self.get_documents(arn)
        target = next((doc for doc in docs if doc["id"] == document_id), None)
        if not target:
            raise WorkflowServiceError(f"Document {document_id} not found", 404)
        target["status"] = "Verified" if decision == "approve" else "Flagged"
        self.add_audit_log(
            user="Loan Officer",
            action=f"Document {decision.title()}",
            resource=f"{arn}:{document_id}",
            details=reason or "No reason provided",
            risk="Low" if decision == "approve" else "Medium",
        )
        return target

    def get_communications(self, arn: str) -> list[dict[str, Any]]:
        self._get_application(arn)
        return self._communications.get(arn, [])

    def send_communication(self, arn: str, channel: str, subject: str, message: str, db=None) -> dict[str, Any]:
        """
        Send communication to borrower with document upload link.
        
        Enhanced to:
        1. Generate secure upload token for email/sms channels
        2. Store communication in database (not just in-memory)
        3. Send actual email/SMS via CommunicationService
        4. Update status based on delivery result
        5. Create audit log
        
        Args:
            arn: Application Reference Number
            channel: Communication channel (email, sms, call)
            subject: Subject line
            message: Message content
            db: Database session (optional, for database storage)
            
        Returns:
            dict: Communication details including upload_token and upload_link
        """
        import os
        from app.services.token_service import TokenService
        from app.services.communication_service import CommunicationService
        
        # Get application details
        app = self._get_application(arn)
        
        # Get backend base URL from environment
        backend_url = os.getenv("BACKEND_BASE_URL", "http://localhost:8000")
        
        # Initialize response
        upload_token = None
        upload_link = None
        token_expires_at = None
        status = "Pending"
        delivery_error = None
        
        # Generate upload token for email/sms channels
        if channel in ["email", "sms"]:
            upload_token = TokenService.generate_upload_token()
            token_expires_at = TokenService.get_token_expiry()
            upload_link = f"{backend_url}/borrower/upload/{upload_token}"
        
        # If database session provided, store in database
        if db:
            try:
                from app.models.loan_application import LoanApplication
                
                # Get application_id from database
                application = db.query(LoanApplication).filter(
                    LoanApplication.arn == arn
                ).first()
                
                if not application:
                    raise WorkflowServiceError(f"Application not found for ARN {arn}", 404)
                
                # Get borrower contact info
                borrower_email = application.borrower_email
                borrower_phone = application.borrower_phone
                
                # Validate contact info based on channel
                if channel == "email" and not borrower_email:
                    raise WorkflowServiceError(
                        "Borrower email not found. Please update the application with borrower's email address.",
                        400
                    )
                
                if channel == "sms" and not borrower_phone:
                    raise WorkflowServiceError(
                        "Borrower phone number not found. Please update the application with borrower's phone number.",
                        400
                    )
                
                # Send actual email/SMS
                if channel == "email" and upload_link:
                    success, error = CommunicationService.send_email(
                        to_email=borrower_email,
                        subject=subject,
                        message=message,
                        upload_link=upload_link,
                        arn=arn,
                        expiry_hours=72
                    )
                    status = "Delivered" if success else "Failed"
                    delivery_error = error
                
                elif channel == "sms" and upload_link:
                    success, error = CommunicationService.send_sms(
                        to_phone=borrower_phone,
                        message=message,
                        upload_link=upload_link,
                        arn=arn
                    )
                    status = "Delivered" if success else "Failed"
                    delivery_error = error
                
                elif channel == "call":
                    # Call logs don't send anything, just record
                    status = "Delivered"
                
                # Insert communication record into database
                result = db.execute(
                    text("""
                    INSERT INTO communications (
                        application_id, channel, subject, message,
                        status, upload_token, token_expires_at, delivery_error, sent_at
                    )
                    VALUES (
                        :application_id, :channel, :subject, :message,
                        :status, :upload_token, :token_expires_at, :delivery_error, NOW()
                    )
                    RETURNING id, sent_at
                    """),
                    {
                        "application_id": application.id,
                        "channel": channel,
                        "subject": subject,
                        "message": message,
                        "status": status,
                        "upload_token": upload_token,
                        "token_expires_at": token_expires_at,
                        "delivery_error": delivery_error
                    }
                )
                # Must fetch BEFORE commit in SQLAlchemy 2.x
                row = result.fetchone()
                communication_id = row[0]
                sent_at = row[1]
                db.commit()
                
                # Create audit log
                self.add_audit_log(
                    user="Loan Officer",
                    action="Communication Sent",
                    resource=arn,
                    details=f"{channel.upper()} - {subject}",
                    risk="Low",
                )
                
                # Return communication details
                return {
                    "id": str(communication_id),
                    "channel": channel,
                    "subject": subject,
                    "message": message,
                    "sent_at": sent_at.isoformat() if sent_at else datetime.now(tz=timezone.utc).isoformat(),
                    "status": status,
                    "upload_token": upload_token,
                    "upload_link": upload_link,
                    "expires_at": token_expires_at.isoformat() if token_expires_at else None,
                    "delivery_error": delivery_error
                }
                
            except WorkflowServiceError:
                raise
            except Exception as e:
                db.rollback()
                print(f"Database communication storage failed: {e}")
                # Fall through to in-memory storage
        
        # Fallback to in-memory storage (for backward compatibility)
        history = self._communications.setdefault(arn, [])
        item = {
            "id": f"c{len(history) + 1}",
            "channel": channel,
            "subject": subject,
            "message": message,
            "sent_at": datetime.now(tz=timezone.utc).isoformat(),
            "status": status,
            "upload_token": upload_token,
            "upload_link": upload_link,
            "expires_at": token_expires_at.isoformat() if token_expires_at else None,
            "delivery_error": delivery_error
        }
        history.insert(0, item)
        
        self.add_audit_log(
            user="Loan Officer",
            action="Communication Sent",
            resource=arn,
            details=f"{channel.upper()} - {subject}",
            risk="Low",
        )
        
        return item

    def move_stage(self, arn: str, new_stage: str, action: str, actor: str) -> dict[str, Any]:
        app = self._get_application(arn)
        previous = app["stage"]
        updated_db = self._update_application_fields(arn, stage=new_stage)
        if not updated_db:
            app["stage"] = new_stage
        self.add_audit_log(
            user=actor,
            action=action,
            resource=arn,
            details=f"Stage moved from {previous} to {new_stage}",
            risk="Low",
        )
        return self._get_application(arn)

    def recalculate_ratios(
        self,
        monthly_income: float,
        existing_obligations: float,
        proposed_emi: float,
        loan_amount: float,
        asset_value: float,
    ) -> dict[str, Any]:
        dti = ((existing_obligations + proposed_emi) / monthly_income) * 100
        foir = (existing_obligations / monthly_income) * 100
        ltv = (loan_amount / asset_value) * 100
        return {
            "dti": round(dti, 2),
            "foir": round(foir, 2),
            "ltv": round(ltv, 2),
            "policy_pass": dti <= 45 and foir <= 40 and ltv <= 80,
        }

    def has_submitted_credit_memo(self, arn: str, db=None) -> bool:
        if db is not None:
            row = self._get_application_row(arn, db)
            memo = (
                db.query(CreditMemo)
                .filter(CreditMemo.application_id == row.id)
                .first()
            )
            return bool(memo and memo.is_submitted)

        try:
            with SessionLocal() as session:
                row = session.query(LoanApplication).filter(LoanApplication.arn == arn).first()
                if row:
                    memo = (
                        session.query(CreditMemo)
                        .filter(CreditMemo.application_id == row.id)
                        .first()
                    )
                    if memo is not None:
                        return bool(memo.is_submitted)
        except Exception:
            pass

        return bool(self._credit_memos.get(arn, {}).get("submitted"))

    def save_credit_memo(self, arn: str, payload: dict[str, Any], submitted: bool) -> dict[str, Any]:
        self._get_application(arn)
        payload = dict(payload)
        payload["submitted"] = submitted
        payload["updated_at"] = datetime.now(tz=timezone.utc).isoformat()
        self._credit_memos[arn] = payload

        try:
            with SessionLocal() as db:
                app_row = db.query(LoanApplication).filter(LoanApplication.arn == arn).first()
                if app_row:
                    memo = (
                        db.query(CreditMemo)
                        .filter(CreditMemo.application_id == app_row.id)
                        .first()
                    )
                    if memo is None:
                        memo = CreditMemo(application_id=app_row.id)

                    memo.summary = str(payload.get("summary") or "")
                    memo.strengths = str(payload.get("strengths") or "")
                    memo.risk_factors = str(payload.get("risk_factors") or "")
                    memo.recommendation = str(payload.get("recommendation") or "")
                    memo.conditions = payload.get("conditions")
                    memo.payload = payload
                    memo.is_submitted = bool(memo.is_submitted or submitted)
                    if submitted:
                        memo.submitted_at = datetime.now(tz=timezone.utc)

                    db.add(memo)
                    db.commit()
        except Exception:
            # Keep API resilient by falling back to in-memory storage if DB write fails.
            pass

        if submitted:
            self.move_stage(arn, "Underwriting", "Credit Memo Submitted", "Credit Analyst")
        return payload

    def generate_offer(self, arn: str, loan_amount: float, tenure_months: int, interest_rate: float) -> dict[str, Any]:
        self._get_application(arn)
        monthly_rate = interest_rate / 12 / 100
        emi = (loan_amount * monthly_rate * (1 + monthly_rate) ** tenure_months) / (((1 + monthly_rate) ** tenure_months) - 1)
        total_payable = emi * tenure_months
        total_interest = total_payable - loan_amount
        if not self._update_application_fields(arn, stage="Offer Sent"):
            app = self._get_application(arn)
            app["stage"] = "Offer Sent"
        self.add_audit_log(
            user="Underwriter",
            action="Loan Offer Generated",
            resource=arn,
            details=f"Amount {loan_amount}, tenure {tenure_months}, rate {interest_rate}",
            risk="Low",
        )
        return {
            "arn": arn,
            "emi": round(emi, 2),
            "total_interest": round(total_interest, 2),
            "total_payable": round(total_payable, 2),
        }

    def submit_policy_override(self, arn: str, payload: dict[str, Any]) -> dict[str, Any]:
        self._get_application(arn)
        overrides = self._policy_overrides.setdefault(arn, [])
        item = {
            "id": f"ovr-{len(overrides) + 1}",
            **payload,
            "submitted_at": datetime.now(tz=timezone.utc).isoformat(),
        }
        overrides.append(item)
        self.add_audit_log(
            user="Underwriter",
            action="Policy Override Submitted",
            resource=arn,
            details=payload["override_category"],
            risk="Medium",
        )
        return item

    def submit_underwriter_decision(self, arn: str, decision: str, reason: str | None = None, db=None) -> dict[str, Any]:
        self._get_application(arn)
        normalized = decision.strip().lower()
        if normalized not in {"approve", "reject", "manual_review"}:
            raise WorkflowServiceError("decision must be one of approve, reject, manual_review", 422)

        if normalized == "approve":
            new_stage = "Underwriting"
            status = "approved_for_structuring"
            risk = "Low"
        elif normalized == "reject":
            new_stage = "Rejected"
            status = "rejected"
            risk = "High"
        else:
            new_stage = "Underwriting"
            status = "manual_review"
            risk = "Medium"

        previous = self._get_application(arn)["stage"]
        if not self._update_application_fields(arn, stage=new_stage):
            app = self._get_application(arn)
            app["stage"] = new_stage

        history_entry = {
            "decision": normalized,
            "reason": reason,
            "status": status,
            "stage": new_stage,
            "decided_at": datetime.now(tz=timezone.utc).isoformat(),
        }
        self._underwriter_decisions.setdefault(arn, []).insert(0, history_entry)

        self.add_audit_log(
            user="Underwriter",
            action="Underwriter Decision Submitted",
            resource=arn,
            details=f"Decision={normalized}; stage {previous} -> {new_stage}; reason={reason or 'N/A'}",
            risk=risk,
        )

        email_status = None
        email_error = None
        if normalized in {"approve", "reject"} and db is not None:
            row = self._get_application_row(arn, db)
            if row.borrower_email:
                decision_label = "Approved" if normalized == "approve" else "Rejected"
                html = (
                    f"<h2>CreditShield Loan Decision</h2>"
                    f"<p>Application <strong>{arn}</strong> has been <strong>{decision_label}</strong>.</p>"
                    f"<p>Reason: {reason or 'As per underwriting review'}</p>"
                    f"<p>Thank you, CreditShield Team.</p>"
                )
                success, error = self._send_email_notification(
                    to=row.borrower_email,
                    subject=f"Loan Application {decision_label} - {arn}",
                    html=html,
                )
                email_status = "sent" if success else "failed"
                email_error = error
            else:
                email_status = "skipped"
                email_error = "Borrower email not available"

        return {
            "arn": arn,
            "decision": normalized,
            "status": status,
            "stage": new_stage,
            "reason": reason,
            "email_status": email_status,
            "email_error": email_error,
        }

    def underwriter_case_summary(self, arn: str, db) -> dict[str, Any]:
        app_row = self._get_application_row(arn, db)
        app = self._to_workflow_application(app_row)

        documents = (
            db.query(Document)
            .filter(Document.application_id == app_row.id)
            .order_by(Document.uploaded_at.desc(), Document.id.desc())
            .all()
        )
        docs_payload = [
            {
                "id": str(doc.id),
                "type": doc.doc_type,
                "doc_type": doc.doc_type,
                "status": doc.status,
                "confidence": doc.confidence,
                "storage_url": doc.storage_url,
                "uploaded_at": doc.uploaded_at.isoformat() if doc.uploaded_at else None,
            }
            for doc in documents
        ]

        appraisal = (
            db.query(LoanAppraisalRecord)
            .filter(LoanAppraisalRecord.application_id == app_row.id)
            .order_by(LoanAppraisalRecord.updated_at.desc(), LoanAppraisalRecord.id.desc())
            .first()
        )

        kpi_metrics = appraisal.kpi_metrics if appraisal and isinstance(appraisal.kpi_metrics, dict) else {}
        income = kpi_metrics.get("income_analysis") if isinstance(kpi_metrics.get("income_analysis"), dict) else {}
        liabilities = kpi_metrics.get("liability_analysis") if isinstance(kpi_metrics.get("liability_analysis"), dict) else {}
        cashflow = kpi_metrics.get("cashflow_analysis") if isinstance(kpi_metrics.get("cashflow_analysis"), dict) else {}
        behavioral = kpi_metrics.get("behavioral_risk") if isinstance(kpi_metrics.get("behavioral_risk"), dict) else {}

        monthly_income = float(income.get("monthly_income_estimate") or income.get("salary_mean") or 0)
        obligations = float(liabilities.get("monthly_obligations") or liabilities.get("total_monthly_emi") or 0)
        proposed_emi = float(liabilities.get("proposed_emi") or 0)
        dti = ((obligations + proposed_emi) / monthly_income * 100) if monthly_income > 0 else None
        foir = (obligations / monthly_income * 100) if monthly_income > 0 else None
        disposable_income = monthly_income - obligations if monthly_income > 0 else None
        emi_eligibility = max(0.0, monthly_income * 0.45 - obligations) if monthly_income > 0 else None

        red_flags: list[str] = []
        if dti is not None and dti > 45:
            red_flags.append("High debt ratio")
        if behavioral.get("income_mismatch"):
            red_flags.append("Income mismatch")
        if behavioral.get("fake_documents"):
            red_flags.append("Fake documents")

        audit_entries = [
            {
                "timestamp": item.timestamp.isoformat(),
                "action": item.action,
                "details": item.details,
                "risk": item.risk,
            }
            for item in self._audit_logs
            if item.resource == arn
        ]
        loan_officers = self._get_loan_officer_emails(db)

        return {
            "application": {
                **app,
                "borrower_email": app_row.borrower_email,
                "borrower_phone": app_row.borrower_phone,
                "co_applicant_details": app_row.co_applicant_details,
                "created_at": app_row.created_at.isoformat() if app_row.created_at else None,
                "updated_at": app_row.updated_at.isoformat() if app_row.updated_at else None,
            },
            "creditworthiness": {
                "credit_score": app["credit_score"],
                "risk_grade": app["risk_grade"],
                "existing_loans": liabilities.get("active_loans"),
                "past_defaults": liabilities.get("defaults_count"),
                "late_payments": liabilities.get("late_payments"),
                "credit_utilization_ratio": liabilities.get("credit_utilization_ratio"),
            },
            "risk_analysis": {
                "system_risk_score": float(appraisal.final_score) if appraisal and appraisal.final_score is not None else None,
                "risk_category": appraisal.risk_level if appraisal else None,
                "confidence_score": float(appraisal.confidence_score) if appraisal and appraisal.confidence_score is not None else None,
                "red_flags": red_flags,
            },
            "financial_ratios": {
                "dti": round(dti, 2) if dti is not None else None,
                "foir": round(foir, 2) if foir is not None else None,
                "emi_eligibility": round(emi_eligibility, 2) if emi_eligibility is not None else None,
                "disposable_income": round(disposable_income, 2) if disposable_income is not None else None,
            },
            "document_verification": {
                "documents": docs_payload,
                "ocr_status": cashflow.get("ocr_status"),
                "fraud_detection_flags": red_flags,
                "digilocker_fetch_status": "verified" if app["kyc_status"] == "Verified" else "pending",
            },
            "underwriting_notes": {
                "internal_comments": appraisal.report_text if appraisal else None,
                "risk_justification": appraisal.recommendation if appraisal else None,
                "exception_notes": [entry for entry in audit_entries if "Override" in entry["action"]],
                "previous_decisions": self._underwriter_decisions.get(arn, []),
            },
            "status_tracking": {
                "current_status": app["stage"],
                "stage_history": audit_entries,
                "assigned_officer": loan_officers[0] if loan_officers else None,
            },
            "kpi_metrics": kpi_metrics,
        }

    def underwriter_decision_history(self, arn: str) -> list[dict[str, Any]]:
        self._get_application(arn)
        return self._underwriter_decisions.get(arn, [])

    def send_back_for_clarification(self, arn: str, message: str, db) -> dict[str, Any]:
        app_row = self._get_application_row(arn, db)
        previous = app_row.stage
        self._update_application_fields(arn, stage="Documents Pending")

        officer_emails = self._get_loan_officer_emails(db)
        email_results: list[dict[str, str | None]] = []
        for email in officer_emails:
            html = (
                f"<h2>Clarification Required - {arn}</h2>"
                f"<p>Underwriter has sent this application back for clarification.</p>"
                f"<p><strong>Message:</strong> {message}</p>"
                f"<p>Please update the borrower case and resubmit.</p>"
            )
            success, error = self._send_email_notification(email, f"Clarification Required - {arn}", html)
            email_results.append({"email": email, "status": "sent" if success else "failed", "error": error})

        self.add_audit_log(
            user="Underwriter",
            action="Sent Back For Clarification",
            resource=arn,
            details=message,
            risk="Medium",
        )

        return {
            "arn": arn,
            "status": "clarification_requested",
            "stage": "Documents Pending",
            "previous_stage": previous,
            "message": message,
            "loan_officer_email_results": email_results,
        }

    def request_additional_documents(self, arn: str, required_documents: list[str], message: str | None, db) -> dict[str, Any]:
        app_row = self._get_application_row(arn, db)
        self._update_application_fields(arn, stage="Documents Pending")

        existing_docs = (
            db.query(Document)
            .filter(Document.application_id == app_row.id)
            .order_by(Document.uploaded_at.desc(), Document.id.desc())
            .all()
        )
        existing_doc_codes = [doc.doc_type for doc in existing_docs]

        officer_emails = self._get_loan_officer_emails(db)
        email_results: list[dict[str, str | None]] = []
        requested_html = "".join([f"<li>{doc}</li>" for doc in required_documents])
        existing_html = "".join([f"<li>{doc}</li>" for doc in existing_doc_codes]) or "<li>No documents uploaded yet</li>"

        for email in officer_emails:
            html = (
                f"<h2>Additional Documents Requested - {arn}</h2>"
                f"<p><strong>Underwriter note:</strong> {message or 'Please collect and upload the requested documents.'}</p>"
                f"<p><strong>Requested Documents:</strong></p><ul>{requested_html}</ul>"
                f"<p><strong>Currently Uploaded Documents:</strong></p><ul>{existing_html}</ul>"
            )
            success, error = self._send_email_notification(email, f"Additional Documents Needed - {arn}", html)
            email_results.append({"email": email, "status": "sent" if success else "failed", "error": error})

        self.add_audit_log(
            user="Underwriter",
            action="Requested Additional Documents",
            resource=arn,
            details=f"Requested: {', '.join(required_documents)}",
            risk="Medium",
        )

        return {
            "arn": arn,
            "status": "additional_documents_requested",
            "stage": "Documents Pending",
            "requested_documents": required_documents,
            "existing_documents": existing_doc_codes,
            "message": message,
            "loan_officer_email_results": email_results,
        }

    def get_kyc_aml(self, arn: str) -> dict[str, Any]:
        app = self._get_application(arn)
        return {
            "arn": arn,
            "kyc_status": app["kyc_status"],
            "aml_status": "Clear" if app["risk_grade"] in {"A+", "A", "B"} else "Pending Review",
            "fraud_score": 22 if app["risk_grade"] in {"A+", "A"} else 45,
            "can_clear_hold": app["kyc_status"] == "Verified",
        }

    def clear_compliance_hold(self, arn: str, reason: str) -> dict[str, Any]:
        self._get_application(arn)
        if not self._update_application_fields(arn, kyc_status="Verified"):
            app = self._get_application(arn)
            app["kyc_status"] = "Verified"
        self.add_audit_log(
            user="Compliance Officer",
            action="Compliance Hold Cleared",
            resource=arn,
            details=reason,
            risk="Medium",
        )
        return {"arn": arn, "status": "hold_cleared"}

    def get_fraud_signals(self, arn: str) -> dict[str, Any]:
        app = self._get_application(arn)
        score = 18 if app["risk_grade"] in {"A+", "A"} else 39
        return {
            "arn": arn,
            "aggregate_score": score,
            "risk_band": "Low" if score <= 30 else "Medium",
            "signals": [
                {"label": "Identity Fraud", "score": max(score - 8, 5), "severity": "Low"},
                {"label": "Document Fraud", "score": score, "severity": "Medium" if score > 30 else "Low"},
            ],
        }

    def mark_false_positive(self, arn: str, reason: str) -> dict[str, str]:
        self._get_application(arn)
        self.add_audit_log(
            user="Compliance Officer",
            action="Fraud Signal Marked False Positive",
            resource=arn,
            details=reason,
            risk="Low",
        )
        return {"arn": arn, "status": "false_positive_marked"}

    def list_audit_logs(
        self,
        action: str | None = None,
        user: str | None = None,
        resource: str | None = None,
        risk: str | None = None,
    ) -> list[AuditLogItem]:
        logs = self._audit_logs
        if action:
            logs = [item for item in logs if action.lower() in item.action.lower()]
        if user:
            logs = [item for item in logs if user.lower() in item.user.lower()]
        if resource:
            logs = [item for item in logs if resource.lower() in item.resource.lower()]
        if risk:
            logs = [item for item in logs if item.risk.lower() == risk.lower()]
        return logs

    def add_audit_log(self, user: str, action: str, resource: str, details: str, risk: str) -> None:
        item = AuditLogItem(
            timestamp=datetime.now(tz=timezone.utc),
            user=user,
            action=action,
            resource=resource,
            details=details,
            risk=risk,
        )
        self._audit_logs.insert(0, item)

    def list_reports(self) -> list[RegulatoryReport]:
        return self._reports

    def generate_report(self, name: str, report_type: str, reporting_period: str) -> RegulatoryReport:
        report = RegulatoryReport(
            id=f"REP-{len(self._reports) + 1:03d}",
            name=f"{name} ({reporting_period})",
            report_type=report_type,
            due_date=datetime.now(tz=timezone.utc).date().isoformat(),
            status="In Progress",
            completeness=5,
        )
        self._reports.insert(0, report)
        self.add_audit_log(
            user="Compliance Officer",
            action="Regulatory Report Generated",
            resource=report.id,
            details=report.name,
            risk="Low",
        )
        return report

    def get_rbi_compliance(self, arn: str) -> dict[str, Any]:
        app = self._get_application(arn)
        missing = 1 if app["kyc_status"] == "Pending" else 0
        return {
            "arn": arn,
            "score": 93 if missing == 0 else 81,
            "blocking_issues": missing,
            "items": [
                {
                    "id": "dl-001",
                    "clause": "3.2",
                    "requirement": "KFS disclosure before execution",
                    "status": "Compliant",
                    "value": "Provided",
                },
                {
                    "id": "dl-004",
                    "clause": "5.1",
                    "requirement": "KYC/AML must be verified",
                    "status": "Missing" if missing else "Compliant",
                    "value": app["kyc_status"],
                },
            ],
        }

    def get_rbi_audit_export(self, arn: str) -> dict[str, Any]:
        data = self.get_rbi_compliance(arn)
        return {
            "arn": arn,
            "exported_at": datetime.now(tz=timezone.utc).isoformat(),
            "rows": data["items"],
        }


workflow_service = WorkflowService()