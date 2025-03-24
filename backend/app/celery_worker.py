from celery import Celery

celery_app = Celery(
    "bitcoin_app",
    broker="redis://localhost:16379/0",
    backend="redis://localhost:16379/0"
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    imports=["app.tasks.tasks"]
)

