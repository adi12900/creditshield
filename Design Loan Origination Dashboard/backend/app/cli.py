from datetime import datetime, timezone
from decimal import Decimal

import click
from flask import Flask

from app.extensions import db
from app.models.loan_application import LoanApplication
from app.models.user import User
from app.security import hash_password


def register_cli(app: Flask) -> None:
    @app.cli.command("seed-db")
    def seed_db():
        """Load Indian demo users and loan applications (safe to re-run)."""
        click.echo("Seeding database...")

        users_spec = [
            ("priya.analyst@demo.creditshield.in", "Priya Sharma", "analyst", "DemoPass123!"),
            ("rahul.underwriter@demo.creditshield.in", "Rahul Verma", "underwriter", "DemoPass123!"),
            ("admin@demo.creditshield.in", "Amit Patel", "admin", "DemoAdmin123!"),
        ]

        for email, full_name, role, password in users_spec:
            existing = User.query.filter_by(email=email).first()
            if existing:
                click.echo(f"  User exists: {email}")
                continue
            u = User(
                email=email,
                full_name=full_name,
                role=role,
                password_hash=hash_password(password),
            )
            db.session.add(u)
        db.session.commit()

        apps_spec = [
            {
                "arn": "CS-2024-IN-00001",
                "borrower_name": "Ananya Iyer",
                "email": "ananya.iyer@example.in",
                "phone": "+91 98765 43210",
                "pan_last_four": "7821",
                "state": "Karnataka",
                "city": "Bengaluru",
                "employment_type": "salaried",
                "monthly_income_inr": Decimal("95000.00"),
                "requested_amount_inr": Decimal("850000.00"),
                "tenure_months": 48,
                "purpose": "debt_consolidation",
                "ml": {
                    "risk_score": 712.4,
                    "risk_tier": "low",
                    "default_probability": 0.081,
                    "decision": "approve",
                    "model_version": "demo-v1",
                    "shap_explanation": [
                        {"feature": "monthly_income_inr", "value": 95000, "contribution": -0.031},
                        {"feature": "requested_amount_inr", "value": 850000, "contribution": 0.018},
                    ],
                },
            },
            {
                "arn": "CS-2024-IN-00002",
                "borrower_name": "Vikram Singh",
                "email": "vikram.singh@example.in",
                "phone": "+91 91234 55678",
                "pan_last_four": "4412",
                "state": "Maharashtra",
                "city": "Pune",
                "employment_type": "salaried",
                "monthly_income_inr": Decimal("72000.00"),
                "requested_amount_inr": Decimal("1200000.00"),
                "tenure_months": 60,
                "purpose": "home_renovation",
                "ml": None,
            },
            {
                "arn": "CS-2024-IN-00003",
                "borrower_name": "Meera Nair",
                "email": "meera.nair@example.in",
                "phone": "+91 99887 76655",
                "pan_last_four": "9033",
                "state": "Kerala",
                "city": "Kochi",
                "employment_type": "self_employed",
                "monthly_income_inr": Decimal("110000.00"),
                "requested_amount_inr": Decimal("500000.00"),
                "tenure_months": 36,
                "purpose": "working_capital",
                "ml": {
                    "risk_score": 655.2,
                    "risk_tier": "medium",
                    "default_probability": 0.168,
                    "decision": "refer",
                    "model_version": "demo-v1",
                    "shap_explanation": [
                        {"feature": "employment_type", "value": "self_employed", "contribution": 0.042},
                    ],
                },
            },
            {
                "arn": "CS-2024-IN-00004",
                "borrower_name": "Karan Malhotra",
                "email": "karan.m@example.in",
                "phone": "+91 98100 22334",
                "pan_last_four": "2288",
                "state": "Delhi",
                "city": "New Delhi",
                "employment_type": "salaried",
                "monthly_income_inr": Decimal("145000.00"),
                "requested_amount_inr": Decimal("2000000.00"),
                "tenure_months": 72,
                "purpose": "education",
                "ml": None,
            },
            {
                "arn": "CS-2024-IN-00005",
                "borrower_name": "Sneha Reddy",
                "email": "sneha.reddy@example.in",
                "phone": "+91 93456 78901",
                "pan_last_four": "5510",
                "state": "Telangana",
                "city": "Hyderabad",
                "employment_type": "salaried",
                "monthly_income_inr": Decimal("88000.00"),
                "requested_amount_inr": Decimal("650000.00"),
                "tenure_months": 42,
                "purpose": "medical",
                "ml": {
                    "risk_score": 598.7,
                    "risk_tier": "high",
                    "default_probability": 0.241,
                    "decision": "decline",
                    "model_version": "demo-v1",
                    "shap_explanation": [
                        {"feature": "requested_amount_inr", "value": 650000, "contribution": 0.055},
                    ],
                },
            },
            {
                "arn": "CS-2024-IN-00006",
                "borrower_name": "Arjun Desai",
                "email": "arjun.desai@example.in",
                "phone": "+91 97654 32109",
                "pan_last_four": "6677",
                "state": "Gujarat",
                "city": "Ahmedabad",
                "employment_type": "salaried",
                "monthly_income_inr": Decimal("62000.00"),
                "requested_amount_inr": Decimal("400000.00"),
                "tenure_months": 24,
                "purpose": "two_wheeler",
                "ml": None,
            },
            {
                "arn": "CS-2024-IN-00007",
                "borrower_name": "Divya Krishnan",
                "email": "divya.k@example.in",
                "phone": "+91 94444 33221",
                "pan_last_four": "1199",
                "state": "Tamil Nadu",
                "city": "Chennai",
                "employment_type": "salaried",
                "monthly_income_inr": Decimal("102000.00"),
                "requested_amount_inr": Decimal("750000.00"),
                "tenure_months": 48,
                "purpose": "wedding",
                "ml": {
                    "risk_score": 689.0,
                    "risk_tier": "low",
                    "default_probability": 0.095,
                    "decision": "approve",
                    "model_version": "demo-v1",
                    "shap_explanation": [],
                },
            },
            {
                "arn": "CS-2024-IN-00008",
                "borrower_name": "Rohit Khanna",
                "email": "rohit.khanna@example.in",
                "phone": "+91 90011 45566",
                "pan_last_four": "3344",
                "state": "Punjab",
                "city": "Chandigarh",
                "employment_type": "salaried",
                "monthly_income_inr": Decimal("78000.00"),
                "requested_amount_inr": Decimal("550000.00"),
                "tenure_months": 36,
                "purpose": "travel",
                "ml": None,
            },
            {
                "arn": "CS-2024-IN-00009",
                "borrower_name": "Neha Kapoor",
                "email": "neha.kapoor@example.in",
                "phone": "+91 98222 77889",
                "pan_last_four": "8800",
                "state": "Rajasthan",
                "city": "Jaipur",
                "employment_type": "self_employed",
                "monthly_income_inr": Decimal("55000.00"),
                "requested_amount_inr": Decimal("300000.00"),
                "tenure_months": 18,
                "purpose": "inventory",
                "ml": None,
            },
            {
                "arn": "CS-2024-IN-00010",
                "borrower_name": "Sanjay Bose",
                "email": "sanjay.bose@example.in",
                "phone": "+91 93312 44556",
                "pan_last_four": "1029",
                "state": "West Bengal",
                "city": "Kolkata",
                "employment_type": "salaried",
                "monthly_income_inr": Decimal("67000.00"),
                "requested_amount_inr": Decimal("920000.00"),
                "tenure_months": 54,
                "purpose": "home_improvement",
                "ml": {
                    "risk_score": 621.3,
                    "risk_tier": "medium",
                    "default_probability": 0.192,
                    "decision": "refer",
                    "model_version": "demo-v1",
                    "shap_explanation": [
                        {"feature": "tenure_months", "value": 54, "contribution": 0.021},
                    ],
                },
            },
            {
                "arn": "CS-2024-IN-00011",
                "borrower_name": "Ishita Gupta",
                "email": "ishita.gupta@example.in",
                "phone": "+91 90190 12345",
                "pan_last_four": "7654",
                "state": "Uttar Pradesh",
                "city": "Noida",
                "employment_type": "salaried",
                "monthly_income_inr": Decimal("125000.00"),
                "requested_amount_inr": Decimal("1500000.00"),
                "tenure_months": 60,
                "purpose": "vehicle",
                "ml": None,
            },
            {
                "arn": "CS-2024-IN-00012",
                "borrower_name": "Manish Kulkarni",
                "email": "manish.k@example.in",
                "phone": "+91 98800 66778",
                "pan_last_four": "3210",
                "state": "Maharashtra",
                "city": "Mumbai",
                "employment_type": "salaried",
                "monthly_income_inr": Decimal("210000.00"),
                "requested_amount_inr": Decimal("2500000.00"),
                "tenure_months": 84,
                "purpose": "personal",
                "ml": {
                    "risk_score": 734.8,
                    "risk_tier": "low",
                    "default_probability": 0.067,
                    "decision": "approve",
                    "model_version": "demo-v1",
                    "shap_explanation": [
                        {"feature": "monthly_income_inr", "value": 210000, "contribution": -0.048},
                    ],
                },
            },
        ]

        for row in apps_spec:
            if LoanApplication.query.filter_by(arn=row["arn"]).first():
                click.echo(f"  Application exists: {row['arn']}")
                continue
            ml_payload = row.get("ml")
            decision_at = datetime.now(timezone.utc) if ml_payload else None
            la = LoanApplication(
                arn=row["arn"],
                borrower_name=row["borrower_name"],
                email=row["email"],
                phone=row["phone"],
                pan_last_four=row["pan_last_four"],
                state=row["state"],
                city=row["city"],
                employment_type=row["employment_type"],
                monthly_income_inr=row["monthly_income_inr"],
                requested_amount_inr=row["requested_amount_inr"],
                tenure_months=row["tenure_months"],
                purpose=row["purpose"],
                risk_score=ml_payload.get("risk_score") if ml_payload else None,
                risk_tier=ml_payload.get("risk_tier") if ml_payload else None,
                default_probability=ml_payload.get("default_probability") if ml_payload else None,
                decision=ml_payload.get("decision") if ml_payload else None,
                decision_at=decision_at,
                model_version=ml_payload.get("model_version") if ml_payload else None,
                shap_explanation=ml_payload.get("shap_explanation") if ml_payload else None,
            )
            db.session.add(la)
        db.session.commit()
        click.echo("Done.")
