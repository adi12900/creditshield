import asyncio
import time
from datetime import datetime, timezone
from typing import Any

import httpx

from app.core.config import settings


class SetuServiceError(Exception):
    def __init__(self, message: str, status_code: int = 500) -> None:
        super().__init__(message)
        self.status_code = status_code


class SetuAAService:
    APPROVED_STATUSES = {"APPROVED", "ACTIVE", "READY", "SUCCESS"}

    def __init__(self) -> None:
        self._token_cache: dict[str, Any] = {}
        self._consent_store: dict[str, dict[str, Any]] = {}
        self._data_sessions: dict[str, dict[str, Any]] = {}
        self._token_lock = asyncio.Lock()
        self._client = httpx.AsyncClient(
            base_url=settings.setu_base_url,
            timeout=settings.setu_request_timeout_seconds,
        )

    async def close(self) -> None:
        await self._client.aclose()

    async def generate_access_token(self, force_refresh: bool = False) -> dict[str, Any]:
        if not settings.setu_client_id or not settings.setu_client_secret:
            raise SetuServiceError(
                "SETU_CLIENT_ID and SETU_CLIENT_SECRET must be configured in .env",
                status_code=500,
            )

        now = int(time.time())
        cached_token = self._token_cache.get("access_token")
        expires_at_epoch = int(self._token_cache.get("expires_at_epoch", 0))
        if cached_token and not force_refresh and now < expires_at_epoch - 30:
            return {
                "access_token": cached_token,
                "token_type": "Bearer",
                "expires_in": max(expires_at_epoch - now, 0),
                "expires_at": datetime.fromtimestamp(expires_at_epoch, tz=timezone.utc),
            }

        async with self._token_lock:
            now = int(time.time())
            cached_token = self._token_cache.get("access_token")
            expires_at_epoch = int(self._token_cache.get("expires_at_epoch", 0))
            if cached_token and not force_refresh and now < expires_at_epoch - 30:
                return {
                    "access_token": cached_token,
                    "token_type": "Bearer",
                    "expires_in": max(expires_at_epoch - now, 0),
                    "expires_at": datetime.fromtimestamp(expires_at_epoch, tz=timezone.utc),
                }

            data = await self._request_token_with_fallbacks()
            access_token = self._extract_value(
                data,
                ["access_token", "accessToken", "token", "jwtToken"],
            )
            if not access_token:
                raise SetuServiceError("Setu token response does not contain access token", 502)

            expires_in_raw = self._extract_value(data, ["expires_in", "expiresIn", "expiry"])
            expires_in = int(expires_in_raw) if str(expires_in_raw).isdigit() else 3600
            expires_at_epoch = int(time.time()) + expires_in

            self._token_cache = {
                "access_token": access_token,
                "expires_at_epoch": expires_at_epoch,
            }
            return {
                "access_token": access_token,
                "token_type": "Bearer",
                "expires_in": expires_in,
                "expires_at": datetime.fromtimestamp(expires_at_epoch, tz=timezone.utc),
            }

    async def _request_token_with_fallbacks(self) -> dict[str, Any]:
        """Setu AA v2 token generation via orgservice"""
        if not settings.setu_client_id or not settings.setu_client_secret:
            raise SetuServiceError("SETU_CLIENT_ID and SETU_CLIENT_SECRET must be configured", 500)

        payload = {
            "clientID": settings.setu_client_id,
            "secret": settings.setu_client_secret,
            "grant_type": "client_credentials",
        }
        headers = {"client": "bridge"}

        try:
            return await self._post_json_absolute(
                settings.setu_token_url,
                payload,
                headers_override=headers,
            )
        except SetuServiceError as exc:
            raise SetuServiceError(f"Token generation failed: {exc}", 502) from exc

    async def create_consent(
        self,
        vua: str,
        data_range: dict[str, str],
        fi_types: list[str],
        consent_types: list[str] | None = None,
        consent_duration: dict[str, Any] | None = None,
        purpose: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Setu AA v2 Consent Creation"""
        if not settings.setu_product_instance_id:
            raise SetuServiceError("SETU_PRODUCT_INSTANCE_ID must be configured", 500)

        access_token = (await self.generate_access_token())["access_token"]
        
        # Default purpose for loan underwriting
        if not purpose:
            purpose = {
                "code": "103",
                "text": "Loan underwriting and risk assessment",
                "refUri": "https://www.setu.co/purpose",
                "category": {"type": "LOAN"},
            }

        payload = {
            "vua": vua,
            "dataRange": data_range,
            "fiTypes": fi_types,
            "consentTypes": consent_types or ["PROFILE", "SUMMARY", "TRANSACTIONS"],
            "consentDuration": consent_duration or {"unit": "MONTH", "value": 24},
            "purpose": purpose,
        }

        headers = {
            "Authorization": f"Bearer {access_token}",
            "x-product-instance-id": settings.setu_product_instance_id,
            "Content-Type": "application/json",
        }

        try:
            response = await self._client.post(
                settings.setu_consent_path,
                json=payload,
                headers=headers,
            )
            data = self._parse_response(response)
        except (httpx.TimeoutException, httpx.RequestError) as exc:
            raise SetuServiceError(f"Setu consent creation failed: {exc}", 502) from exc

        consent_id = data.get("id") or data.get("consentId")
        status = data.get("status") or "PENDING"
        if not consent_id:
            raise SetuServiceError("Setu consent response does not contain consent id", 502)

        self._consent_store[consent_id] = {
            "status": str(status).upper(),
            "updated_at": datetime.now(tz=timezone.utc).isoformat(),
            "payload": data,
        }
        return {
            "id": consent_id,
            "url": data.get("url", ""),
            "status": str(status).upper(),
            "txnid": data.get("txnid"),
        }

    def handle_webhook(self, payload: dict[str, Any]) -> dict[str, str]:
        consent_id = self._extract_value(payload, ["consent_id", "consentId", "id"])
        status = self._extract_value(payload, ["status", "consentStatus", "state"])
        if not consent_id or not status:
            raise SetuServiceError("Webhook payload must include consent id and status", 400)

        self._consent_store[str(consent_id)] = {
            "status": str(status).upper(),
            "updated_at": datetime.now(tz=timezone.utc).isoformat(),
            "payload": payload,
        }
        return {
            "message": "Webhook processed",
            "consent_id": str(consent_id),
            "status": str(status).upper(),
        }

    async def fetch_fi_data(
        self,
        consent_id: str,
        data_range: dict[str, str],
        format: str = "json",
    ) -> dict[str, Any]:
        """Setu AA v2 FI Data Fetch via Session Creation"""
        if not settings.setu_product_instance_id:
            raise SetuServiceError("SETU_PRODUCT_INSTANCE_ID must be configured", 500)

        access_token = (await self.generate_access_token())["access_token"]

        payload = {
            "consentId": consent_id,
            "dataRange": data_range,
            "format": format,
        }

        headers = {
            "Authorization": f"Bearer {access_token}",
            "x-product-instance-id": settings.setu_product_instance_id,
            "Content-Type": "application/json",
        }

        try:
            response = await self._client.post(
                settings.setu_sessions_path,
                json=payload,
                headers=headers,
            )
            data = self._parse_response(response)
        except (httpx.TimeoutException, httpx.RequestError) as exc:
            raise SetuServiceError(f"Setu data fetch failed: {exc}", 502) from exc

        session_id = data.get("id") or data.get("sessionId")
        status = data.get("status") or "PENDING"

        self._data_sessions[session_id] = {
            "consent_id": consent_id,
            "status": status,
            "created_at": datetime.now(tz=timezone.utc).isoformat(),
            "payload": data,
        }

        return {
            "session_id": session_id,
            "consent_id": consent_id,
            "status": status,
            "txnid": data.get("txnid"),
        }

    async def get_fi_data(self, session_id: str) -> dict[str, Any]:
        """Setu AA v2 Retrieve FI Data from Session"""
        if not settings.setu_product_instance_id:
            raise SetuServiceError("SETU_PRODUCT_INSTANCE_ID must be configured", 500)

        access_token = (await self.generate_access_token())["access_token"]

        path = settings.setu_sessions_get_path_template.format(session_id=session_id)
        headers = {
            "Authorization": f"Bearer {access_token}",
            "x-product-instance-id": settings.setu_product_instance_id,
        }

        try:
            response = await self._client.get(path, headers=headers)
            data = self._parse_response(response)
        except (httpx.TimeoutException, httpx.RequestError) as exc:
            raise SetuServiceError(f"Setu data retrieval failed: {exc}", 502) from exc

        return data

    async def fetch_transactions(
        self,
        consent_id: str,
        from_date: str | None = None,
        to_date: str | None = None,
    ) -> dict[str, Any]:
        """Legacy: Fetch transactions using v2 session-based flow"""
        from_date = from_date or "2023-01-01T00:00:00Z"
        to_date = to_date or datetime.now(tz=timezone.utc).isoformat()

        # Create session
        session_data = await self.fetch_fi_data(
            consent_id,
            {"from": from_date, "to": to_date},
            format="json",
        )

        # Get session data
        session_id = session_data.get("session_id")
        await asyncio.sleep(1)  # Wait for data processing

        fi_data = await self.get_fi_data(session_id)

        # Normalize transactions
        transactions = self._extract_and_normalize_transactions(fi_data)

        return {
            "consent_id": consent_id,
            "session_id": session_id,
            "count": len(transactions),
            "transactions": transactions,
            "raw_response": fi_data,
        }

    async def _post_json(
        self,
        path: str,
        payload: dict[str, Any],
        include_auth: bool,
        access_token: str | None = None,
        headers_override: dict[str, str] | None = None,
    ) -> dict[str, Any]:
        headers = self._build_headers(access_token if include_auth else None)
        if headers_override:
            headers.update(headers_override)
        try:
            response = await self._client.post(path, json=payload, headers=headers)
            return self._parse_response(response)
        except httpx.TimeoutException as exc:
            raise SetuServiceError("Setu request timed out", 504) from exc
        except httpx.RequestError as exc:
            raise SetuServiceError(f"Setu request failed: {exc.__class__.__name__}", 502) from exc

    async def _post_json_absolute(
        self,
        url: str,
        payload: dict[str, Any],
        headers_override: dict[str, str] | None = None,
    ) -> dict[str, Any]:
        headers = self._build_headers(None)
        if headers_override:
            headers.update(headers_override)
        try:
            response = await self._client.post(url, json=payload, headers=headers)
            return self._parse_response(response)
        except httpx.TimeoutException as exc:
            raise SetuServiceError("Setu request timed out", 504) from exc
        except httpx.RequestError as exc:
            raise SetuServiceError(f"Setu request failed: {exc.__class__.__name__}", 502) from exc

    async def _get_json(
        self,
        path: str,
        params: dict[str, str],
        access_token: str,
    ) -> dict[str, Any]:
        headers = self._build_headers(access_token)
        try:
            response = await self._client.get(path, params=params, headers=headers)
            return self._parse_response(response)
        except httpx.TimeoutException as exc:
            raise SetuServiceError("Setu request timed out", 504) from exc
        except httpx.RequestError as exc:
            raise SetuServiceError(f"Setu request failed: {exc.__class__.__name__}", 502) from exc

    def _build_headers(self, access_token: str | None = None) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if access_token:
            headers["Authorization"] = f"Bearer {access_token}"
        return headers

    def _parse_response(self, response: httpx.Response) -> dict[str, Any]:
        body: dict[str, Any]
        try:
            body = response.json()
        except ValueError:
            body = {"message": response.text}

        if response.status_code >= 400:
            detail = self._extract_value(body, ["message", "error", "detail"]) or str(body)
            raise SetuServiceError(f"Setu API error ({response.status_code}): {detail}", response.status_code)
        return body

    def _extract_transactions(self, payload: dict[str, Any]) -> list[dict[str, Any]]:
        candidates = [
            payload.get("transactions"),
            payload.get("data", {}).get("transactions") if isinstance(payload.get("data"), dict) else None,
            payload.get("txns"),
            payload.get("accounts", {}).get("transactions") if isinstance(payload.get("accounts"), dict) else None,
        ]
        for item in candidates:
            if isinstance(item, list):
                return [txn for txn in item if isinstance(txn, dict)]
        return []

    def _extract_and_normalize_transactions(self, payload: dict[str, Any]) -> list[dict[str, Any]]:
        """Extract transactions from v2 FI data structure (fips > accounts > data > transactions)"""
        transactions = []
        
        # Traverse v2 structure: fips[] > accounts[] > data > transactions[]
        fips = payload.get("fips", [])
        if not isinstance(fips, list):
            return transactions

        for fip in fips:
            accounts = fip.get("accounts", [])
            if not isinstance(accounts, list):
                continue

            for account in accounts:
                data = account.get("data", {})
                if not isinstance(data, dict):
                    continue

                # Handle different FI types
                account_transactions = self._extract_transactions(data)
                for txn in account_transactions:
                    normalized = self._normalize_transaction(txn)
                    normalized["account_number"] = account.get("maskedAccNumber")
                    normalized["link_ref_number"] = account.get("linkRefNumber")
                    transactions.append(normalized)

        return transactions

    def _normalize_transaction(self, txn: dict[str, Any]) -> dict[str, Any]:
        amount_raw = self._extract_value(txn, ["amount", "txnAmount", "value"])
        balance_raw = self._extract_value(txn, ["currentBalance", "balance", "runningBalance"])
        return {
            "transaction_id": self._extract_value(txn, ["id", "txnId", "transactionId"]),
            "amount": self._safe_float(amount_raw),
            "currency": self._extract_value(txn, ["currency", "currencyCode"]),
            "transaction_type": self._extract_value(txn, ["type", "txnType", "mode"]),
            "narration": self._extract_value(txn, ["narration", "description", "remarks"]),
            "timestamp": self._extract_value(txn, ["timestamp", "txnDate", "date"]),
            "mode": self._extract_value(txn, ["mode", "channel"]),
            "current_balance": self._safe_float(balance_raw),
            "raw": txn,
        }

    def _safe_float(self, value: Any) -> float | None:
        if value is None:
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    def _extract_value(self, payload: dict[str, Any], keys: list[str]) -> Any:
        for key in keys:
            if key in payload and payload[key] not in (None, ""):
                return payload[key]
        nested = payload.get("data") if isinstance(payload.get("data"), dict) else None
        if nested:
            for key in keys:
                if key in nested and nested[key] not in (None, ""):
                    return nested[key]
        return None


setu_aa_service = SetuAAService()
