"""
NOTE: From qed_cyan/cyan_app django application.

Handles user account interactions.
"""
import time
import datetime
import json
import logging
from sqlalchemy import desc
import os
import requests

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
    Report,
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

        user_id = User.query.filter_by(username=user).first().id

        default_settings = Settings.get_default_settings()
        new_user_settings = Settings(
            user_id=user_id,
            level_low=default_settings["level_low"],
            level_medium=default_settings["level_medium"],
            level_high=default_settings["level_high"],
            enable_alert=default_settings["enable_alert"],
            alert_value=default_settings["alert_value"],
        )
        db.session.add(new_user_settings)
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
        return Settings.get_default_settings()
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

    response = PasswordHandler().send_password_reset_email({"user_email": user_email, "username": user.username})
    if "error" in response:
        return response, 500

    return {
        "status": "An email has been sent to: {} from {}.\n\n \
                    Follow the link in the email to verify the password reset. This link \
                    will expire in {} minutes.\n\nThere is a chance the email will show up in \
                    your spam folder.".format(user_email, os.getenv("EMAIL"), int(os.getenv("SESSION_EXPIRE_SECONDS"))/60)}, 200


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


def get_all_reports(request_obj):
    """
    Gets all reports from a user.
    """
    username = request_obj["username"]

    user = User.query.filter_by(username=username).first()
    user_reports = Report.query.filter_by(user_id=user.id).all()

    reports = list(
        reversed(Report.create_reports_json(user_reports))
    )  # sorts in desc (latest report first)

    response_obj = dict(Report.user_reports_response())
    response_obj["status"] = "success"
    response_obj["reports"] = reports

    return response_obj, 200


def get_report(request_obj):
    """
    Gets a specific report.
    """
    report_id = request_obj["report_id"]
    username = request_obj["username"]

    # TODO: Error handling

    # user_reports = celery_handler.get_report_from_db(username, report_id)
    user = User.query.filter_by(username=username).first()  # gets user from db
    user_report = Report.query.filter_by(user_id=user.id, report_id=report_id).first()

    response_obj = dict(report.user_reports_response())
    response_obj["status"] = "success"
    response_obj["reports"] = Report.create_reports_json([user_reports])

    return response_obj, 200


def start_report(request_obj):
    """
    Starts a user's report generation.
    """
    try:
        username = request_obj["username"]
        date = request_obj["date"]
        tribes = ",".join(map(str, request_obj.get("tribes", [])))
        objectids = ",".join(map(str, request_obj.get("objectids", [])))
        counties = ",".join(map(str, request_obj.get("counties", [])))
        token = request_obj["token"]
        origin = request_obj["origin"]
        app_name = request_obj["app_name"]
    except KeyError:
        return {"error": "Invalid key in request"}, 400

    user = User.query.filter_by(username=username).first()  # gets user from db
    user_report = (
        Report.query.filter_by(user_id=user.id)
        .filter(
            (Report.report_status == "PENDING")
            | (Report.report_status == "RECEIVED")
            | (Report.report_status == "RETRY")
            | (Report.report_status == "STARTED")
        )
        .first()
    )

    user_settings = Settings.query.filter_by(user_id=user.id).first()

    response_obj = dict(Report.report_response())
    report_obj = None

    # Checks if user already has a report in progress:
    if user_report and user_report.report_status in celery_handler.pending_states:
        response_obj["status"] = "Failed - user already has a report in progress"
        response_obj["report_status"] = user_report.report_status
        response_obj["report_id"] = user_report.report_id
        return response_obj, 200

    try:
        request_params = {
            "year": date.split(" ")[0],
            "day": date.split(" ")[1],
        }
        if counties and len(counties) > 0:
            request_params["county"] = counties
        if tribes and len(tribes) > 0:
            request_params["tribe"] = tribes
        if objectids and len(objectids) > 0:
            request_params["objectids"] = objectids

        request_params["low"] = user_settings.level_low
        request_params["med"] = user_settings.level_medium
        request_params["high"] = user_settings.level_high

        request_params["username"] = username
        request_params["token"] = token
        request_params["origin"] = origin
        request_params["app_name"] = app_name

        # Makes request to wb-flask to start report generation:
        url = os.getenv("WATERBODY_URL") + "/waterbody/report"
        response = requests.get(url, params=request_params, timeout=15)
        if response.status_code != 200:
            raise
        request_obj["report_id"] = json.loads(response.content)["report_id"]

        user = User.query.filter_by(username=username).first()  # gets user from db
        user_reports = Report.query.filter_by(user_id=user.id).all()  # gets user jobs

        # Creates initial report entry:
        report_obj = Report(
            user_id=user.id,
            report_num=len(user_reports) + 1,
            report_id=request_obj["report_id"],
            report_status="RECEIVED",
            report_date=date,
            report_objectids=objectids,
            report_tribes=tribes,
            report_counties=counties,
            report_range_low=user_settings.level_low,
            report_range_medium=user_settings.level_medium,
            report_range_high=user_settings.level_high,
            received_datetime=datetime.datetime.utcnow(),
        )
        db.session.add(report_obj)
        db.session.commit()

        if not report_obj:
            logging.error(
                "No user report found for username '{}', report id '{}'".format(username, report_id)
            )
            # TODO: How to handle this in a way that user can be notified?
            return

        received_datetime = report_obj.received_datetime


    except Exception as e:
        logging.error("start_report exception: {}".format(e))
        response_obj["status"] = "Failed - error starting report"
        response_obj["report_status"] = report_obj.report_status
        response_obj["report_id"] = report_obj.report_id
        return response_obj, 500

    # Checks for report starting errors:
    if report_obj.report_status in celery_handler.fail_states:
        logging.warning("web_app_api start_report() - Report has failed")
        response_obj["status"] = "Failed - error starting report"
        response_obj["report_status"] = report_obj.report_status
        response_obj["report_id"] = report_obj.report_id
        return response_obj, 500

    response_obj["report"] = Report.create_reports_json([report_obj])[0]
    response_obj["report_status"] = report_obj.report_status
    response_obj["report_id"] = report_obj.report_id
    response_obj["status"] = True

    return response_obj, 202


def get_report_status(request_obj):
    try:
        report_id = request_obj["report_id"]
        username = request_obj["username"]
    except KeyError:
        return {"error": "Invalid key in request"}, 400

    user = User.query.filter_by(username=username).first()  # gets user from db
    user_report = Report.query.filter_by(user_id=user.id, report_id=report_id).first()

    # NOTE: If same celery instance, could directly make request to worker and not an api request

    # NOTE: Since wb celery updates cyanweb flask table with report status, a call to the wb report/status
    # endpoint seems unneccessary.
    # url = os.getenv("WATERBODY_URL") + "/waterbody/report/status"
    # user_report_status = requests.get(url, params={"report_id": user_report.report_id}, timeout=10)
    # logging.warning("User report status: {}".format(user_report_status.content))

    response_obj = dict(Report.report_response())

    # response_obj["job"] = Job.create_jobs_json([user_job])[0]

    if not user_report:
        response_obj["status"] = "Failed - report not found."
    elif user_report.report_status in celery_handler.fail_states:
        response_obj["status"] = "Failed - error processing report."
    else:
        response_obj["status"] = "success"

    response_obj["report_id"] = user_report.report_id
    response_obj["report_status"] = user_report.report_status
    response_obj["report"] = Report.create_reports_json([user_report])[0]
    return response_obj, 200


def cancel_report(request_obj):
    """
    Cancels a user's report.
    """
    try:
        report_id = request_obj["report_id"]
        username = request_obj["username"]
    except KeyError:
        return {"error": "Invalid key in request"}, 400

    # user_report = celery_handler.get_report_from_db(username, report_id)
    user = User.query.filter_by(username=username).first()  # gets user from db
    user_report = Report.query.filter_by(user_id=user.id, report_id=report_id).first()

    if not user_report:
        # No report to cancel, user doesn't have this report, skip revoking.
        return {"error": "User report not found"}, 200

    # cancel_response = celery_handler.revoke_report(report_id)

    # TODO: Make request to WB API to cancel report from user
    # NOTE: If same celery instance, could directly make request to worker and not an api request
    url = os.getenv("WATERBODY_URL") + "/waterbody/report/cancel"
    cancel_response = requests.get(url, params={"report_id": user_report.report_id}, timeout=10)

    # TODO: Add error handling to json and above request

    cancel_response_obj = json.loads(cancel_response.content)

    # Updates report status in DB.
    user_report.report_status = "REVOKED"
    db.session.commit()

    response_obj = dict(Report.report_response())
    response_obj["status"] = cancel_response_obj["status"]
    response_obj["report_status"] = "REVOKED"
    response_obj["report_id"] = report_id

    return response_obj, 200

def update_report(request_obj):
    """
    Updates report table. Items that would be updateable: report_status,
    finished_datetime, queue_time, exec_time.

    NOTE: Possibly just needed for updating report status. 
    """
    # expected_params = ["report_status", "finished_datetime", "exec_time"]
    try:
        report_id = request_obj["report_id"]
        username = request_obj["username"]
        report_status = request_obj["report_status"]
        finished_datetime = request_obj.get("finished_datetime")
    except KeyError:
        return {"error": "Invalid key in request"}, 400
    
    # Checks that request contains at least one of the expected params
    if set(request_obj).isdisjoint(list(request_obj.keys())):
        return {"error": "Missing keys in request"}, 400

    # Updates row in report table:
    user = User.query.filter_by(username=username).first()  # gets user from db
    user_report = Report.query.filter_by(user_id=user.id, report_id=report_id).first()

    if not user_report:
        return {"error": "User report not found"}, 200

    user_report.report_status = report_status
    user_report.finished_datetime = finished_datetime

    db.session.commit()

    response_obj = dict(Report.user_reports_response())
    response_obj["report_id"] = user_report.report_id
    response_obj["report_status"] = user_report.report_status
    response_obj["report"] = Report.create_reports_json([user_report])[0]
    return response_obj, 200