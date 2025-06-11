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
COPY main.py /code/

# Set Python path
ENV PYTHONPATH=/code

# Create startup script with proper variable expansion
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Set default port if not provided\n\
PORT=${PORT:-8080}\n\
\n\
echo "Using port: $PORT"\n\
echo "Waiting for database..."\n\
while ! nc -z psql 5432; do\n\
  sleep 1\n\
done\n\
echo "Database is up!"\n\
echo "Running migrations..."\n\
alembic upgrade head\n\
echo "Starting FastAPI application on port $PORT..."\n\
exec uvicorn main:app --host 0.0.0.0 --port "$PORT"' > /code/start.sh && \
    chmod +x /code/start.sh

# Add a health check endpoint test (use default port for build time)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8080}/health || exit 1

CMD ["/code/start.sh"]