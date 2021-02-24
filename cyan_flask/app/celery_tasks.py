"""
Celery instance and worker functions for
processing CSV data requests.
"""

import os
import sys
import logging
import time
from celery import Celery

PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(1, PROJECT_ROOT)
sys.path.insert(1, os.path.join(PROJECT_ROOT, "..", ".."))

# local imports:
from models import Job, User, Location
from config.set_environment import DeployEnv

runtime_env = DeployEnv()
runtime_env.load_deployment_environment()

redis_hostname = os.environ.get('REDIS_HOSTNAME', 'localhost')
redis_port = os.environ.get('REDIS_PORT', 6379)

logging.warning("REDIS_HOSTNAME: {}".format(redis_hostname))
logging.warning("REDIS_PORT: {}".format(redis_port))

celery_instance = Celery('tasks',
				broker='redis://{}:{}/0'.format(redis_hostname, redis_port),	
				backend='redis://{}:{}/0'.format(redis_hostname, redis_port))

celery_instance.conf.update(
	CELERY_ACCEPT_CONTENT=['json'],
	CELERY_TASK_SERIALIZER='json',
	CELERY_RESULT_SERIALIZER='json',
    CELERY_IGNORE_RESULT=False,  # LOOK INTO THESE SETTINGS
    CELERY_TRACK_STARTED=True,  # LOOK INTO THESE SETTINGS
    CELERYD_MAX_MEMORY_PER_CHILD=50000000,  # LOOK INTO THESE SETTINGS
)


@celery_instance.task(bind=True)
def run_batch_job(self, request_obj):
	"""
	Celery task that initiates processing of user batch request.

	NOTE 1: As data is returned, the user's location table can get populated
	with the results. There then needs to be a way to map the locations from that
	table to the job ID for sending results from job request back to user as a CSV.
	"""

	# 1. Create initial locations in location table (should it be separate table? 
	# will it collide with batch/background vs ui location requests? should the location
	# table be checked if location exists there before calling NCC?)

	# 2. Start calling cyano backend (currently on NCC) for data.

	# 3. Store cyano results by updating locations in location table.

	# 4. When results are all complete, send email to user that job is complete (note that if
	# frontend is up on user-end, a polling request could keep updating user of job status)

	# 5. 

	logging.warning("Celery request ID: {}".format(self.request.id))
	logging.warning("Request Object: {}".format(request_obj))
	status = check_job_status(self.request.id.__str__())
	logging.warning("Job status: {}".format(status))
	time.sleep(10)
	status = check_job_status(self.request.id.__str__())
	logging.warning("Job status: {}".format(status))
	return status

# def add_location(post_data):
#     try:
#         user = post_data["owner"]
#         _id = post_data["id"]
#         data_type = post_data["type"]
#         name = post_data["name"]
#         latitude = post_data["latitude"]
#         longitude = post_data["longitude"]
#         marked = post_data["marked"]
#         compare = post_data.get("compare") or False
#         notes = post_data["notes"] or []
#     except KeyError:
#         return {"error": "Invalid key in request"}, 400
#     # Checks if location already exists for user:
#     location_obj = Location.query.filter_by(id=_id, owner=user, type=data_type).first()
#     if location_obj:
#         return {"error": "Record with same key exists"}, 409
#     # Inserts new location into database:
#     location_obj = Location(
#         owner=user,
#         id=_id,
#         type=data_type,
#         name=name,
#         latitude=latitude,
#         longitude=longitude,
#         marked=marked,
#         notes=json.dumps(notes),
#         compare=compare,
#     )
#     db.session.add(location_obj)
#     db.session.commit()
#     return {"status": "success"}, 201


class CeleryHandler:

	def __init__(self):
		self.states = ["FAILURE", "REVOKED", "PENDING", "RECEIVED", "STARTED", "SUCCESS"]
		self.request_obj = {
			"locations": []
		}

	def start_task(self, request_obj):
		"""
		Starts celery task and saves job/task ID to job table.
		"""
		# task_id = sam_run.apply_async(args=(jobId, valid_input["inputs"]), queue="qed", taskset_id=jobId)
		job_obj = run_batch_job.apply_async(args=[request_obj], queue="celery")
		return job_obj.id

	def check_job_status(self, job_id):
		"""
		Checks the status of a celery job and returns 
		its status.
		Celery States: FAILURE, PENDING, RECEIVED, RETRY,
		REVOKED, STARTED, SUCCESS 
		"""
		job = celery_instance.AsyncResult(job_id)
		state = job.status

		logging.warning("JOB: {}".format(job))
		logging.warning("JOB STATE: {}".format(state))
		
		if state == "SUCCESS":
			message = "Job {} is complete.".format(job_id)
		elif state == "FAILURE":
			message = "Job {} has failed.".format(job_id)
		elif state == "REVOKED":
			message = "Job {} has been canceled or an error has occurred.".format(job_id)
		elif state in ["PENDING", "RECEIVED"]:
			message = "Job {} is in queue.".format(job_id)
		elif state == "STARTED":
			message = "Job {} is in progress.".format(job_id)
		else:
			# NOTE: Not going to set retry for tasks.
			message = "Error processing job {}".format(job_id)

		return message
