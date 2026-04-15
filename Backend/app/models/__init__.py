from app.models.user import User
from app.models.borrower import Borrower
from app.models.borrower_kyc_profile import BorrowerKycProfile
from app.models.document import Document
from app.models.education_loan_details import EducationLoanDetails
from app.models.gold_loan_details import GoldLoanDetails
from app.models.home_loan_details import HomeLoanDetails
from app.models.loan_application import LoanApplication

__all__ = [
	"User",
	"Borrower",
	"BorrowerKycProfile",
	"Document",
	"EducationLoanDetails",
	"GoldLoanDetails",
	"HomeLoanDetails",
	"LoanApplication",
]

