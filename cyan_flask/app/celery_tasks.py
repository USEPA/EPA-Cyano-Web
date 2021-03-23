"""
Celery instance and worker functions for
processing CSV data requests.
"""
import os
import sys
import logging
import time
import requests
import json
from celery import Celery

# import mysql.connector
import datetime
from sqlalchemy import and_
import uuid

# Local imports:
from csv_handler import CSVHandler
from auth import PasswordHandler
from models import User, Job, db
from config.set_environment import DeployEnv
from cyan_flask.build_db import DBHandler
from cyan_flask.crypt import CryptManager

runtime_env = DeployEnv()
runtime_env.load_deployment_environment()

redis_hostname = os.environ.get("REDIS_HOSTNAME", "localhost")
redis_port = os.environ.get("REDIS_PORT", 6379)

logging.info("REDIS_HOSTNAME: {}".format(redis_hostname))
logging.info("REDIS_PORT: {}".format(redis_port))

celery_instance = Celery(
    "tasks",
    broker="redis://{}:{}/0".format(redis_hostname, redis_port),
    backend="redis://{}:{}/0".format(redis_hostname, redis_port),
)

celery_instance.conf.update(
    CELERY_BROKER_URL="redis://{}:{}/0".format(redis_hostname, redis_port),
    CELERY_RESULT_BACKEND="redis://{}:{}/0".format(redis_hostname, redis_port),
    CELERY_ACCEPT_CONTENT=["json"],
    CELERY_TASK_SERIALIZER="json",
    CELERY_RESULT_SERIALIZER="json",
    CELERY_IGNORE_RESULT=False,
    CELERY_TRACK_STARTED=True,
    CELERYD_MAX_MEMORY_PER_CHILD=50000000,
)

crypt_manager = CryptManager()
csv_handler = CSVHandler()
email_handler = PasswordHandler()


@celery_instance.task(bind=True)
def run_batch_job(self, request_obj):
    """
    Celery task that initiates processing of user batch request.

    TODO: More exception handling
    """
    celery_handler = CeleryHandler()
    username = request_obj["username"]
    locations = request_obj["locations"]
    filename = request_obj["filename"]
    job_id = request_obj["job_id"]

    user_job = celery_handler.get_job_from_db(username, job_id)

    logging.info("User job: {}".format(user_job))

    received_datetime = user_job.received_datetime
    started_datetime = datetime.datetime.utcnow()

    user_job.started_datetime = started_datetime  # sets job start time in db
    user_job.job_status = "STARTED"  # sets job status in db
    db.session.commit()

    # Makes requests for location data:
    location_responses = []
    for location in locations:
        time.sleep(0.1)  # little delay b/w calls
        response = celery_handler.make_cyano_request(location)
        location_responses.append(response)

    # Creates CSV object from location responses (list of rows):
    csv_data = csv_handler.create_csv(username, filename, location_responses)
    # logging.info("CSV created for {}: {}".format(username, filename))

    # Send email to user about job being complete, includes link (w/ token like reset endpoint):
    # token needs link to .csv file
    email_handler.send_batch_job_complete_email(request_obj)

    # Removes CSV from disk after it has been sent as email attachment:
    csv_handler.remove_csv_file(filename)

    # Updates user job in db:
    user_job.job_status = "SUCCESS"  # updates job status in db
    user_job.finished_datetime = (
        datetime.datetime.utcnow()
    )  # sets job complete datetime
    db.session.commit()
    user_job.queue_time = celery_handler.calculate_queue_time(
        user_job
    )  # sets job's queue time (s)
    user_job.exec_time = celery_handler.calculate_exec_time(
        user_job
    )  # sets job's execution time (s)
    db.session.commit()

    logging.info("Task complete.")

    return csv_data


class CeleryHandler:
    def __init__(self):
        self.states = [
            "FAILURE",
            "REVOKED",
            "RETRY",
            "PENDING",
            "RECEIVED",
            "STARTED",
            "SUCCESS",
        ]
        self.pending_states = ["RETRY", "PENDING", "RECEIVED", "STARTED"]
        self.fail_states = ["FAILURE", "REVOKED"]
        self.locations_limit = 1e4  # limit on num locations in job

    def start_task(self, request_obj):
        """
        Starts celery task and saves job/task ID to job table.
        """
        logging.info("Starting task, request: {}".format(request_obj))

        username = request_obj["username"]
        locations = request_obj["locations"]
        filename = request_obj["filename"]

        job_id = str(uuid.uuid4())

        request_obj["job_id"] = job_id

        user = User.query.filter_by(username=username).first()  # gets user from db

        # Creates initial job entry:
        job_obj = Job(
            user_id=user.id,
            job_id=job_id,
            job_status="RECEIVED",
            input_file=filename,
            output_file=csv_handler.generate_output_filename(filename),
            num_locations=len(locations),
            received_datetime=datetime.datetime.utcnow(),
        )
        db.session.add(job_obj)
        db.session.commit()

        # Runs job on celery worker:
        celery_job = run_batch_job.apply_async(
            args=[request_obj], queue="celery", task_id=job_id
        )

        return celery_job.id

    def get_active_user_job(self, username):
        """
        Gets current/active user job from job table.
        """
        user = User.query.filter_by(username=username).first()  # gets user from db
        active_user_job = (
            Job.query.filter_by(user_id=user.id)
            .filter(
                (Job.job_status == "PENDING")
                | (Job.job_status == "RECEIVED")
                | (Job.job_status == "RETRY")
                | (Job.job_status == "STARTED")
            )
            .first()
        )
        return active_user_job

    def get_job_from_db(self, username, job_id):
        """
        Checks celery job status in DB instead of
        from AsyncResult (see check_celery_job_status())
        """
        user = User.query.filter_by(username=username).first()  # gets user from db
        user_job = Job.query.filter_by(user_id=user.id, job_id=job_id).first()
        return user_job

    def check_celery_job_status(self, job_id):
        """
        Checks the status of a celery job and returns
        its status.
        Celery States: FAILURE, PENDING, RECEIVED, RETRY,
        REVOKED, STARTED, SUCCESS
        """
        job = celery_instance.AsyncResult(job_id)
        logging.warning("JOB: {}".format(job))
        logging.warning("JOB Type: {}".format(type(job)))
        return job.status

    def update_db_job_status(self, username):
        """
        Updates job status in job table using
        actual state from celery.
        """
        user_job = self.get_active_user_job(username)
        job_state = self.check_celery_job_status(
            user_job.job_id
        )  # gets current celery state

        if not user_job:
            return {"error": "job not found"}

        user_job.job_status = job_state  # updates job state in db table
        db.session.commit()

        return {"status": "success"}

    def make_cyano_request(self, request_data):
        """
        Gets cyano data for location using
        /cyan/cyano/location/data/{lat}/{lon}/all?type=olci&frequency={weekly,daily}
        """
        lat = request_data["lat"]
        lon = request_data["lon"]
        data_type = request_data["type"]

        url = (
            os.environ.get("TOMCAT_API")
            + "/cyan/cyano/location/data/"
            + "{}/{}/all?type=olci&frequency={}".format(lat, lon, data_type)
        )

        try:
            response = requests.get(url)
            return json.loads(response.content)
        except Exception as e:
            logging.warning("Unknown exception occurred: {}".format(e))
            return None

    def calculate_queue_time(self, user_job):
        """
        Calculates time user's job spent in celery queue.
        Units: seconds
        """
        return (user_job.started_datetime - user_job.received_datetime).total_seconds()

    def calculate_exec_time(self, user_job):
        """
        Calculates time user's job took to execute.
        Units: seconds
        """
        return (user_job.finished_datetime - user_job.received_datetime).total_seconds()
