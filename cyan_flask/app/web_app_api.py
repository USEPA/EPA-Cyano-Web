"""
NOTE: From qed_cyan/cyan_app django application.

Handles user account interactions.
"""
import time
import datetime
import json
import logging
from sqlalchemy import desc

# Local imports:
from auth import PasswordHandler, JwtHandler
from models import (
    User,
    Location,
    Notifications,
    Settings,
    Comment,
    CommentImages,
    Reply,
    Job,
    db,
)
import utils
from celery_tasks import CeleryHandler
from csv_handler import CSVHandler

celery_handler = CeleryHandler()
csv_handler = CSVHandler()


def register_user(post_data):
    try:
        user = post_data["user"]
        email = post_data["email"]
        password = post_data["password"]
    except KeyError:
        return {"error": "Invalid key in request"}, 400
    user_obj = User.query.filter_by(username=user).first()  # TODO: naming refactor
    if user_obj:
        return {"error": "Username already exists"}, 400
    user_obj = User.query.filter_by(email=email).first()
    if user_obj:
        return {"error": "Email address already taken"}, 400
    else:
        date = datetime.datetime.utcnow()
        password_salted = PasswordHandler().hash_password(password)
        new_user = User(
            username=user,
            email=email,
            password=password_salted,
            created=date,
            last_visit=date,
        )
        db.session.add(new_user)
        db.session.commit()
        if not new_user:
            return {"error": "Failed to register user"}, 500
        return {"status": "success", "username": user, "email": email}, 200


def login_user(post_data):
    try:
        user = post_data["user"]
        password = post_data["password"]
    except KeyError as e:
        logging.error(e)
        return {"error": "Invalid key in request"}, 400
    user_obj = User.query.filter_by(username=user).first()
    if not user_obj:
        return {"error": "Invalid user credentials."}, 401
    else:
        if not PasswordHandler().test_password(user_obj.password, password):
            return {"error": "Invalid username and/or password."}, 401

    last_visit_unix = time.mktime(user_obj.last_visit.timetuple())
    notifications = get_notifications(user, last_visit_unix)

    settings = get_user_settings(user_obj.id)

    user_obj.last_visit = datetime.datetime.utcnow()  # updates 'last_visit'
    db.session.commit()

    try:
        user_data = {
            "username": user_obj.username,
            "email": user_obj.email,
            "auth_token": JwtHandler().encode_auth_token(user),
        }
        data = get_user_locations(user)
        return (
            {
                "user": user_data,
                "locations": data,
                "notifications": notifications,
                "settings": settings,
            },
            200,
        )
    except KeyError as e:
        logging.warning("login_user key error: {}".format(e))
        return {"error": "Invalid key in database data"}, 500
    except Exception as e:
        logging.warning("login_user exception: {}".format(e))
        return {"error": "Failed to log user in"}, 500


def add_location(post_data):
    try:
        user = post_data["owner"]
        _id = Location.validate_id(post_data["id"])
        name = post_data["name"]
        latitude = post_data["latitude"]
        longitude = post_data["longitude"]
        marked = post_data["marked"]
        compare = post_data.get("compare") or False
        notes = post_data["notes"] or []
    except KeyError:
        return {"error": "Invalid key in request"}, 400

    if not _id:
        return {"error": "Invalid key in request"}, 400

    # Checks if location already exists for user:
    location_obj = Location.query.filter_by(id=_id, owner=user).first()
    if location_obj:
        return {"error": "Record with same key exists"}, 409
    # Inserts new location into database:
    location_obj = Location(
        owner=user,
        id=_id,
        name=name,
        latitude=latitude,
        longitude=longitude,
        marked=marked,
        notes=json.dumps(notes),
        compare=compare,
    )
    db.session.add(location_obj)
    db.session.commit()
    return {"status": "success"}, 201


def delete_location(user="", _id=""):
    Location.query.filter_by(id=_id, owner=user).delete()
    db.session.commit()
    # TODO: Exception handling.
    return {"status": "success"}, 200


def edit_location(post_data):
    try:
        user = post_data["owner"]
        _id = post_data["id"]
        name = post_data["name"]
        marked = post_data["marked"]
        compare = (
            post_data.get("compare") or False
        )  # need or? trying to account for pre-existing db without "compare" column
        notes = post_data["notes"] or []  # array of strings in json format
    except KeyError:
        return {"error": "Invalid key in request"}, 400
    updated_values = dict(
        name=name, marked=marked, compare=compare, notes=json.dumps(notes)
    )
    location_obj = Location.query.filter_by(owner=user, id=_id).update(updated_values)
    db.session.commit()
    # TODO: Exception handling.
    return {"status": "success"}, 200


def get_user_locations(user=""):
    """
    Returns user locations based on user and data type.
    """
    user_locations = Location.query.filter_by(owner=user).all()
    results = []
    for location in user_locations:
        results.append(read_location_row(location))
    return results


def read_location_row(location):
    loc_data = {
        "owner": location.owner,
        "id": location.id,
        "name": location.name,
        "latitude": location.latitude,
        "longitude": location.longitude,
        "marked": location.marked,
        "compare": location.compare,
        "notes": json.loads(location.notes),
    }
    if not loc_data["notes"] or loc_data["notes"] == '""':
        loc_data["notes"] = []
    return loc_data


def get_location(user="", _id=""):
    """
    Returns user location based on user and location ID.
    TODO: How to prevent any user getting user locations if they could guess a username?
    """
    user_location = Location.query.filter_by(id=_id, owner=user).first()
    if not user_location:
        return {"error": "Location not found"}, 404
    return read_location_row(user_location), 200


def get_notifications(user, last_visit):
    """
    Populates the notifications list.
    Populate with all notifications if new user / registered??
    """

    all_notifications = get_users_notifications(
        user
    )  # gets any existing notifications from user

    # Sets minimum time for getting notifications from cyano endpoint:
    latest_time = None
    if len(all_notifications) > 0:
        latest_time = utils.convert_to_unix(all_notifications[-1][2])
    else:
        latest_time = last_visit

    new_notifications = utils.make_notifications_request(
        latest_time
    )  # gets all notifications at /cyan/cyano/notifications

    db_values = parse_notifications_response(new_notifications, latest_time, user)
    db_values_list = []

    if len(db_values) > 0:
        for val in db_values:
            db.session.add(val)  # trying to add list of Notifications objects
            db_values_list.append(
                convert_notification_to_list(val)
            )  # NOTE: cannot json serialize orm objects
        db.session.commit()

    all_notifications += (
        db_values_list  # adds list of Notifications db vals to user's Notifications
    )

    return all_notifications


def get_users_notifications(user):
    """ Gets existing notifications from database """
    user_notifications = (
        Notifications.query.filter_by(owner=user).order_by(Notifications.date).all()
    )
    _notifications = []
    for notification in user_notifications:
        notification.date = notification.date.strftime("%Y-%m-%d %H:%M:%S")
        _notifications.append(convert_notification_to_list(notification))
    return _notifications


def convert_notification_to_list(notification_obj):
    """ Creates ordered list for noticiation object """
    notification_list = [
        notification_obj.owner,
        notification_obj.id,
        notification_obj.date,
        notification_obj.subject,
        notification_obj.body,
        notification_obj.is_new,
    ]
    return notification_list


def parse_notifications_response(new_notifications, latest_time, user):
    values = []
    if new_notifications is None:
        return values

    for notification in new_notifications:
        # NOTE: Assuming ascending order of dates
        notification_time = int(
            str(notification["dateSent"])[:-3]
        )  # NOTE: trimming off 3 trailing 0s
        if notification_time <= latest_time:
            continue
        val = Notifications(
            owner=user,
            id=notification["id"],
            date=utils.convert_to_timestamp(notification["dateSent"]),
            subject=notification["subject"],
            body=notification["message"],
            is_new=True,
        )
        values.append(val)
    return values


def edit_notifications(user, _id):
    """
    Updates user's notification that has been read,
    e.g., sets is_new to false.
    """
    Notifications.query.filter_by(owner=user, id=_id).update(dict(is_new=False))
    db.session.commit()
    return {"status": "success"}, 200


def delete_notifications(user):
    """
    Removes user's notifications (event: "Clear" button hit)
    """
    user_notifications = Notifications.query.filter_by(owner=user).delete()
    db.session.commit()
    return {"status": "success"}, 200


def get_user_settings(user_id):
    settings = Settings.query.filter_by(user_id=user_id).first()
    if not settings:
        # user does not have custom settings yet, use default one
        return {
            "level_low": 100000,
            "level_medium": 300000,
            "level_high": 1000000,
            "enable_alert": False,
            "alert_value": 1000000,
        }
    else:
        return {
            "level_low": settings.level_low,
            "level_medium": settings.level_medium,
            "level_high": settings.level_high,
            "enable_alert": settings.enable_alert,
            "alert_value": settings.alert_value,
        }


def edit_settings(post_data):
    try:
        user = post_data["owner"]
        level_low = post_data["level_low"]
        level_medium = post_data["level_medium"]
        level_high = post_data["level_high"]
        enable_alert = post_data["enable_alert"]
        alert_value = post_data["alert_value"]
    except KeyError:
        return {"error": "Invalid key in request"}, 400
    user_id = User.query.filter_by(username=user).first().id
    user_settings = Settings.query.filter_by(user_id=user_id).first()
    if not user_settings:
        db.session.add(
            Settings(
                user_id=user_id,
                level_low=level_low,
                level_medium=level_medium,
                level_high=level_high,
                enable_alert=enable_alert,
                alert_value=alert_value,
            )
        )
    else:
        user_settings.level_low = level_low
        user_settings.level_medium = level_medium
        user_settings.level_high = level_high
        user_settings.enable_alert = enable_alert
        user_settings.alert_value = alert_value
    db.session.commit()
    return {"status": "success"}, 200


def reset_password(request):
    """
    Resets user password routine using
    reset_password.py module.
    """
    try:
        user_email = request["email"]
    except KeyError:
        return {"error": "No email provided."}, 400
    user = User.query.filter_by(email=user_email).first()

    if not user:
        # Send invalid email response
        return {"error": "User email address not found."}, 401

    response = PasswordHandler().send_password_reset_email({"user_email": user_email})
    if "error" in response:
        return response, 500

    return {"status": "Email sent to {}".format(user_email)}, 200


def set_new_password(request):
    """
    Sets new password for user.
    """
    try:
        user_email = request["email"]
    except KeyError:
        return {"error", "No email provided."}, 400

    password_salted = PasswordHandler().hash_password(request["newPassword"])

    result = User.query.filter_by(email=user_email).update(
        dict(password=password_salted)
    )
    db.session.commit()

    # NOTE: Will updates, etc. return non-None values if successful?
    if not result:
        return {"error": "Failed to update password"}, 500

    return {"status": "success"}, 200


def get_comments():
    """
    Gets all user comments.
    """
    comments = Comment.query.order_by(
        desc(Comment.date)
    ).all()  # gets all users' comments
    if len(comments) < 1:
        return [], 200
    comments_json = utils.build_comments_json(comments)
    return comments_json, 200


def add_user_comment(post_data):
    """
    Adds user comment.
    """
    try:
        # _id = post_data['id']
        title = post_data["title"]
        date = post_data["date"]
        username = post_data["username"]
        device = post_data["device"] or "N/A"
        browser = post_data["browser"] or "N/A"
        # body = post_data['body']
        comment_text = post_data["comment_text"]
        comment_images = post_data["comment_images"]
    except KeyError:
        return {"error": "Invalid key in request"}, 400

    comment_obj = Comment(
        # id=_id,
        title=title,
        date=date,
        username=username,
        device=device,
        browser=browser,
        comment_text=comment_text
        # body=body
    )
    db.session.add(comment_obj)
    db.session.flush()

    image_sources = []
    for image in comment_images:

        image_file = utils.save_image_source(username, image["source"], image["name"])

        if "error" in image_file:
            continue  # skips storing image filename if error

        comment_images_obj = CommentImages(
            comment_id=comment_obj.id,
            comment_image=image_file,  # saving image path instead of source
        )
        db.session.add(comment_images_obj)

        image_sources.append(image["source"])

    db.session.commit()

    comment_json = utils.build_comments_json([comment_obj], image_sources)[
        0
    ]  # creates json object from comment db object

    return comment_json, 201


def add_comment_reply(post_data):
    """
    Adds reply to a user's comment.
    """
    try:
        comment_id = post_data["comment_id"]
        comment_user = post_data["comment_user"]
        date = post_data["date"]
        reply_user = post_data["username"]
        body = post_data["body"]
    except KeyError:
        return {"error": "Invalid key in request"}, 400

    # date = datetime.datetime.now()

    reply_obj = Reply(
        # id=_id  # auto increment id
        comment_id=comment_id,
        date=date,
        username=reply_user,
        body=body,
    )

    db.session.add(reply_obj)
    db.session.commit()

    # return {"status": "success"}, 201
    reply_json = utils.build_replies_json([reply_obj])[0]
    return reply_json, 201


def get_batch_status(response_obj):
    """
    Gets job ID from DB and returns the
    job's status from celery worker.
    """
    try:
        job_id = response_obj["job_id"]
        username = response_obj["username"]
    except KeyError:
        return {"error": "Invalid key in request"}, 400

    user_job = celery_handler.get_job_from_db(username, job_id)

    if not user_job:
        response_obj["status"] = "Failed - job not found."
    elif user_job.job_status in celery_handler.fail_states:
        response_obj["status"] = "Failed - error processing job."
    else:
        response_obj["status"] = ""

    response_obj["job_id"] = user_job.job_id
    response_obj["job_status"] = user_job.job_status
    response_obj["job"] = Job.create_jobs_json([user_job])[0]
    return response_obj, 200


def start_batch_job(request_obj):
    """
    Starts a user's batch request/job.
    """
    try:
        username = request_obj["username"]
        filename = request_obj["filename"]
        locations = request_obj["locations"]
    except KeyError:
        return {"error": "Invalid key in request"}, 400

    user = User.query.filter_by(username=username).first()  # gets user email from db
    user_job = celery_handler.get_active_user_job(
        username
    )  # gets any active job user may have

    request_obj["user_email"] = user.email

    response_obj = dict(Job.job_response())

    # Checks number of locations requested:
    if len(locations) > celery_handler.locations_limit:
        response_obj[
            "status"
        ] = "Failed - number of locations exceeds limit ({})".format(
            celery_handler.locations_limit
        )
        response_obj["job_status"] = ""
        response_obj["job_id"] = ""
        return response_obj, 200

    # Checks if user already has a job in progress:
    if user_job and user_job.job_status in celery_handler.pending_states:
        response_obj["status"] = "Failed - user already has a job in progress"
        response_obj["job_status"] = user_job.job_status
        response_obj["job_id"] = user_job.job_id
        return response_obj, 200

    try:
        job_obj = celery_handler.start_task(request_obj)  # starts a new job
        job_status = celery_handler.check_celery_job_status(job_obj.job_id)
    except Exception as e:
        logging.error("start_batch_job exception: {}".format(e))
        response_obj["status"] = "Failed - error starting job"
        response_obj["job_status"] = job_status
        response_obj["job_id"] = job_obj.job_id
        return response_obj, 500

    # Checks for job starting errors:
    if job_status in celery_handler.fail_states:
        response_obj["status"] = "Failed - error starting job"
        response_obj["job_status"] = job_status
        response_obj["job_id"] = job_obj.job_id
        return response_obj, 500

    # Returns info for successfully created job:
    response_obj[
        "status"
    ] = "Job started.\nAn email will be sent to {} \
		  when the job is complete".format(
        user.email
    )
    response_obj["job"] = Job.create_jobs_json([job_obj])[0]
    response_obj["job_status"] = job_status
    response_obj["job_id"] = job_obj.job_id

    return response_obj, 202


def cancel_batch_job(request_obj):
    """
    Cancels a user's batch job.
    """
    try:
        job_id = request_obj["job_id"]
        username = request_obj["username"]
    except KeyError:
        return {"error": "Invalid key in request"}, 400

    user_job = celery_handler.get_job_from_db(username, job_id)

    if not user_job:
        # No job to cancel, user doesn't have this job, skip revoking.
        return {"error": "User job not found"}, 200

    cancel_response = celery_handler.revoke_job(job_id)

    # Updates job status in DB.
    user_job.job_status = "REVOKED"
    db.session.commit()

    response_obj = dict(Job.user_jobs_response())
    response_obj["status"] = cancel_response["status"]
    response_obj["job_status"] = "REVOKED"

    return response_obj, 200


def get_all_batch_jobs(request_obj):
    """
    Gets all batch jobs from a user.
    """
    username = request_obj["username"]

    user_jobs = celery_handler.get_all_jobs(username)

    jobs = list(
        reversed(Job.create_jobs_json(user_jobs))
    )  # sorts in desc (latest job first)

    response_obj = dict(Job.user_jobs_response())
    response_obj["status"] = "success"
    response_obj["jobs"] = jobs

    return response_obj, 200


def get_batch_job(request_obj):
    """
    Gets a specific batch job.
    """
    job_id = request_obj["job_id"]
    username = request_obj["username"]

    user_jobs = celery_handler.get_job_from_db(username, job_id)

    # TODO: This endpoint is in progress.

    response_obj = dict(Job.user_jobs_response())
    response_obj["status"] = "success"
    response_obj["jobs"] = Job.create_jobs_json([user_jobs])

    return response_obj, 200
