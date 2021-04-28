from app import app
from app.celery_tasks import celery_instance as celery

app.app_context().push()

# Note: to run worker in local dev in windows:
# celery -A celery_worker.celery worker --pool=solo -l INFO
