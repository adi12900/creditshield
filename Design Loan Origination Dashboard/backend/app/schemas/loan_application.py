from marshmallow import fields

from app.extensions import ma
from app.models.loan_application import LoanApplication


class LoanApplicationSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = LoanApplication
        load_instance = True


class PredictBodySchema(ma.Schema):
    arn = fields.String(required=True)
    persist = fields.Boolean(load_default=True)
