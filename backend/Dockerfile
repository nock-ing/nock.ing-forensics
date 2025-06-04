
FROM python:3.10-slim

WORKDIR /code

# Install system dependencies including curl for health checks
RUN apt-get update && apt-get install -y \
    curl \
    gcc \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Copy and install requirements first (for better caching)
COPY requirements.txt /code/
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Verify alembic installation
RUN python -c "import alembic; print('Alembic installed successfully')"

# Copy application files
COPY app /code/app
COPY alembic /code/alembic
COPY alembic.ini /code/

# Set Python path
ENV PYTHONPATH=/code

EXPOSE 8080

# Add a health check endpoint test
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]