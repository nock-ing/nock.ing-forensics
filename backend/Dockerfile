FROM python:3.10

WORKDIR /code

COPY requirements.txt /code/
RUN pip install --no-cache-dir -r requirements.txt

COPY ./app /code/app
COPY ./alembic /code/alembic
COPY alembic.ini /code/
COPY .env /code/

ENV PYTHONPATH=/code

EXPOSE 8080

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
