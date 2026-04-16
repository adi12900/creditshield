FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DEFAULT_TIMEOUT=300

ARG INSTALL_AI_HEAVY=false

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

COPY Backend/requirements.txt /tmp/requirements.txt
RUN if [ "$INSTALL_AI_HEAVY" = "true" ]; then \
            pip install -r /tmp/requirements.txt; \
        else \
            grep -v '^sentence-transformers' /tmp/requirements.txt > /tmp/requirements.runtime.txt && \
            pip install -r /tmp/requirements.runtime.txt; \
        fi

COPY otp-service/package*.json /app/otp-service/
RUN cd /app/otp-service && npm ci --omit=dev

COPY Backend /app/Backend
COPY loan_appraisal_model /app/loan_appraisal_model
COPY ai_agent /app/ai_agent
COPY dataset /app/dataset
COPY otp-service /app/otp-service

COPY Backend/docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

WORKDIR /app/Backend
ENV PYTHONPATH=/app:/app/Backend:/app/loan_appraisal_model

EXPOSE 8000 3001

ENTRYPOINT ["/entrypoint.sh"]
