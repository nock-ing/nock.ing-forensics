FROM python:3.10

WORKDIR /code

# Install system dependencies including curl for health checks
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /code/
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY app /code/app
COPY alembic /code/alembic
COPY alembic.ini /code/

ENV PYTHONPATH=/code

EXPOSE 8080

# Add a health check endpoint test
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]