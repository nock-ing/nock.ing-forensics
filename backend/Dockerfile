FROM python:3.9-slim

WORKDIR /code

# Install system dependencies including curl for health checks
RUN apt-get update && apt-get install -y \
    curl \
    gcc \
    netcat-openbsd \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install requirements first (for better caching)
COPY requirements.txt /code/
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Verify critical installations
RUN python -c "import alembic; print('Alembic installed successfully')" && \
    python -c "import fastapi; print('FastAPI installed successfully')" && \
    python -c "import uvicorn; print('Uvicorn installed successfully')"

# Copy application files
COPY app /code/app
COPY alembic /code/alembic
COPY alembic.ini /code/

# Set Python path
ENV PYTHONPATH=/code

# Don't expose a specific port - let Coolify handle it
# EXPOSE directive is mainly for documentation anyway

# Add a health check that uses the PORT environment variable
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-3000}/health || exit 1

# Use shell form to allow environment variable expansion
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-3000}