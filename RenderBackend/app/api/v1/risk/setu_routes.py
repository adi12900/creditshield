from typing import Any

from fastapi import APIRouter, HTTPException

from app.schemas.setu import (
    CreateConsentRequest,
    CreateConsentResponse,
    CreateFIDataFetchRequest,
    CreateFIDataFetchResponse,
    FetchDataResponse,
    FetchTransactionsRequest,
    FetchTransactionsResponse,
    GenerateTokenRequest,
    GenerateTokenResponse,
    WebhookPayload,
    WebhookResponse,
)
from app.services.risk.setu_aa_service import SetuServiceError, setu_aa_service

router = APIRouter(tags=["setu-account-aggregator"])


def _setu_error_to_http_exception(exc: SetuServiceError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=str(exc))


@router.post("/token", response_model=GenerateTokenResponse)
async def generate_token(payload: GenerateTokenRequest | None = None) -> GenerateTokenResponse:
    """Generate Setu access token"""
    force_refresh = payload.force_refresh if payload else False
    try:
        token_data = await setu_aa_service.generate_access_token(force_refresh=force_refresh)
        return GenerateTokenResponse(**token_data)
    except SetuServiceError as exc:
        raise _setu_error_to_http_exception(exc) from exc


@router.post("/consents", response_model=CreateConsentResponse)
async def create_consent(payload: CreateConsentRequest) -> CreateConsentResponse:
    """Create consent request using Setu AA v2 API"""
    try:
        consent_data = await setu_aa_service.create_consent(
            vua=payload.vua,
            data_range={
                "from": payload.dataRange.from_date,
                "to": payload.dataRange.to_date,
            },
            fi_types=payload.fiTypes,
            consent_types=payload.consentTypes,
            consent_duration={
                "unit": payload.consentDuration.unit,
                "value": payload.consentDuration.value,
            },
            purpose={
                "code": payload.purpose.code,
                "text": payload.purpose.text,
                "refUri": payload.purpose.refUri,
                "category": {"type": payload.purpose.category.type},
            },
        )
        return CreateConsentResponse(**consent_data)
    except SetuServiceError as exc:
        raise _setu_error_to_http_exception(exc) from exc


@router.post("/consents/{consent_id}/data-fetch", response_model=CreateFIDataFetchResponse)
async def fetch_fi_data(consent_id: str, payload: CreateFIDataFetchRequest) -> CreateFIDataFetchResponse:
    """Fetch FI data using Setu AA v2 Sessions API"""
    try:
        session_data = await setu_aa_service.fetch_fi_data(
            consent_id=consent_id,
            data_range={
                "from": payload.dataRange.from_date,
                "to": payload.dataRange.to_date,
            },
            format=payload.format,
        )
        return CreateFIDataFetchResponse(**session_data)
    except SetuServiceError as exc:
        raise _setu_error_to_http_exception(exc) from exc


@router.get("/sessions/{session_id}", response_model=FetchDataResponse)
async def get_fi_data(session_id: str) -> FetchDataResponse:
    """Get FI data from session"""
    try:
        data = await setu_aa_service.get_fi_data(session_id)
        return FetchDataResponse(**data)
    except SetuServiceError as exc:
        raise _setu_error_to_http_exception(exc) from exc


@router.post("/webhook", response_model=WebhookResponse)
async def webhook_callback(payload: WebhookPayload) -> WebhookResponse:
    """Receive webhook notifications from Setu"""
    try:
        webhook_data = setu_aa_service.handle_webhook(payload.model_dump(exclude_none=True))
        return WebhookResponse(**webhook_data)
    except SetuServiceError as exc:
        raise _setu_error_to_http_exception(exc) from exc


# Legacy endpoint for backward compatibility
@router.post("/fetch-transactions", response_model=FetchTransactionsResponse)
async def fetch_transactions(payload: FetchTransactionsRequest) -> FetchTransactionsResponse:
    """Legacy: Fetch transactions (uses v2 session-based flow internally)"""
    try:
        transactions_data: dict[str, Any] = await setu_aa_service.fetch_transactions(
            consent_id=payload.consent_id,
            from_date=payload.from_date,
            to_date=payload.to_date,
        )
        return FetchTransactionsResponse(**transactions_data)
    except SetuServiceError as exc:
        raise _setu_error_to_http_exception(exc) from exc
