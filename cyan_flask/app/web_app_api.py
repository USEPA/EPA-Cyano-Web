"""
NOTE: From qed_cyan/cyan_app django application.

Handles user account interactions.
"""
import uuid
import time
import datetime
import sqlite3
import mysql.connector
import json
import os
import logging
import requests
import simplejson

# Local imports:
from auth import PasswordHandler, JwtHandler
from models import User, Location, Notifications, Settings, db
import utils


BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def register_user(post_data):
	try:
		user = post_data['user']
		email = post_data['email']
		password = post_data['password']
	except KeyError:
		return {"error": "Invalid key in request"}, 400
	user_obj = User.query.filter_by(username=user).first()  # TODO: naming refactor
	if user_obj:
		return {"error": "Username already exists"}, 400
	else:
		date = datetime.date.today().isoformat()
		password_salted = PasswordHandler().hash_password(password)
		new_user = User(username=user, email=email, password=password_salted, created=date, last_visit=date)
		db.session.add(new_user)
		db.session.commit()
		if not new_user:
			return {"status": "failure", "username": user, "email": email}, 500
		return {"status": "success", "username": user, "email": email}, 200

def login_user(post_data):
	try:
		user = post_data['user']
		password = post_data['password']
		data_type = post_data['dataType']
	except KeyError as e:
		logging.error(e)
		return {"error": "Invalid key in request"}, 200
	user_obj = User.query.filter_by(username=user).first()
	if not user_obj:
		return {"error": "Invalid user credentials."}, 200
	else:
		if not PasswordHandler().test_password(user_obj.password, password):
			return {"error": "Invalid password"}, 200

	last_visit_unix = time.mktime(user_obj.last_visit.timetuple())
	notifications = get_notifications(user, last_visit_unix)

	settings = get_user_settings(user_obj.id)

	user_obj.last_visit = datetime.date.today().isoformat()  # updates 'last_visit'
	db.session.commit()
	
	try:
		user_data = {
			'username': user_obj.username,
			'email': user_obj.email,
			'auth_token': JwtHandler().encode_auth_token(user)
		}
		data = get_user_locations(user, data_type)
		return {'user': user_data, 'locations': data, 'notifications': notifications, 'settings': settings}, 200
	except KeyError as e:
		logging.warning("login_user key error: {}".format(e))
		return {"error": "Invalid key in database data"}, 500
	except Exception as e:
		logging.warning("login_user exception: {}".format(e))
		return {'user': user_data, 'locations': None}, 200


def add_location(post_data):
	try:
		user = post_data['owner']
		_id = post_data['id']
		data_type = post_data['type']
		name = post_data['name']
		latitude = post_data['latitude']
		longitude = post_data['longitude']
		marked = post_data['marked']
		compare = post_data.get('compare') or False
		notes = post_data['notes'] or []
	except KeyError:
		return {"error": "Invalid key in request"}, 200
	# Checks if location already exists for user:
	location_obj = Location.query.filter_by(id=_id, owner=user, type=data_type).first()
	if location_obj:
		return {"error": "Record with same key exists"}, 409
	# Inserts new location into database:
	location_obj = Location(
		owner=user,
		id=_id,
		type=data_type,
		name=name,
		latitude=latitude,
		longitude=longitude,
		marked=marked,
		notes=json.dumps(notes),
		compare=compare
	)
	db.session.add(location_obj)
	db.session.commit()
	return {"status": "success"}, 201

def delete_location(user='', _id='', data_type=''):
	Location.query.filter_by(id=_id, owner=user, type=data_type).delete()
	db.session.commit()
	# TODO: Exception handling.
	return {"status": "success"}, 200

def edit_location(post_data):
	try:
		user = post_data['owner']
		_id = post_data['id']
		data_type = post_data['type']
		name = post_data['name']
		marked = post_data['marked']
		compare = post_data.get('compare') or False  # need or? trying to account for pre-existing db without "compare" column
		notes = post_data['notes'] or []  # array of strings in json format
	except KeyError:
		return {"error": "Invalid key in request"}, 200
	updated_values = dict(name=name, marked=marked, compare=compare, notes=json.dumps(notes))
	location_obj = Location.query.filter_by(owner=user, id=_id, type=data_type).update(dict(is_new=False))
	db.session.commit()
	# TODO: Exception handling.
	return {"status": "success"}, 200


def get_user_locations(user='', data_type=''):
	"""
	Returns user locations based on user and data type.
	"""
	user_locations = Location.query.filter_by(owner=user, type=data_type).all()  # gets all locations for owner + data_type
	results = []
	for location in user_locations:
		results.append(read_location_row(location))
	return results

def read_location_row(location):
	loc_data = {
		"owner": location.owner,
		"id": location.id,
		"type": location.type,
		"name": location.name,
		"latitude": location.latitude,
		"longitude": location.longitude,
		"marked": location.marked,
		"compare": location.compare,
		"notes": json.loads(location.notes)
	}
	if not loc_data['notes'] or loc_data['notes'] == '""':
		loc_data['notes'] = []
	return loc_data	

def get_location(user='', _id='', data_type=''):
	"""
	Returns user location based on user and location ID.
	TODO: How to prevent any user getting user locations if they could guess a username?
	"""
	user_location = Location.query.filter_by(id=_id, owner=user, type=data_type).first()
	if not user_location:
		return {"error": "Location not found"}, 404
	return read_location_row(user_location), 200

def get_notifications(user, last_visit):
	"""
	Populates the notifications list.
	Populate with all notifications if new user / registered??
	"""

	all_notifications = get_users_notifications(user)  # gets any existing notifications from user

	# Sets minimum time for getting notifications from cyano endpoint:
	latest_time = None
	if len(all_notifications) > 0:
		latest_time = utils.convert_to_unix(all_notifications[-1][2])
	else:
		latest_time = last_visit

	new_notifications = make_notifications_request(latest_time)  # gets all notifications at /cyan/cyano/notifications

	db_values = parse_notifications_response(new_notifications, latest_time, user)
	db_values_list = []
		
	if len(db_values) > 0:
		for val in db_values:
			db.session.add(val)  # trying to add list of Notifications objects
			db_values_list.append(convert_notification_to_list(val))  # NOTE: cannot json serialize orm objects
		db.session.commit()

	all_notifications += db_values_list  # adds list of Notifications db vals to user's Notifications

	return all_notifications

def get_users_notifications(user):
	""" Gets existing notifications from database """
	user_notifications = Notifications.query.filter_by(owner=user).all()
	_notifications = []
	for notification in user_notifications:
		notification.date = notification.date.strftime('%Y-%m-%d %H:%M:%S')
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
		notification_obj.is_new
	]
	return notification_list

def parse_notifications_response(new_notifications, latest_time, user):
	values = []
	if new_notifications is None:
		return values

	for notification in new_notifications:
		# NOTE: Assuming ascending order of dates
		notification_time = int(str(notification['dateSent'])[:-3])  # NOTE: trimming off 3 trailing 0s
		if notification_time <= latest_time:
			continue
		val = Notifications(
			owner=user,
			id=notification['id'],
			date=utils.convert_to_timestamp(notification['dateSent']),
			subject=notification['subject'],
			body=notification['message'],
			is_new=True
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
			"alert_value": 1000000
		}
	else:
		return {
			"level_low": settings.level_low,
			"level_medium": settings.level_medium,
			"level_high": settings.level_high,
			"enable_alert": settings.enable_alert,
			"alert_value": settings.alert_value
		}

def edit_settings(post_data):
	try:
		user = post_data['owner']
		level_low = post_data['level_low']
		level_medium = post_data['level_medium']
		level_high = post_data['level_high']
		enable_alert = post_data['enable_alert']
		alert_value = post_data['alert_value']
	except KeyError:
		return {"error": "Invalid key in request"}, 400
	user_id = User.query.filter_by(username=user).first().id
	user_settings = Settings.query.filter_by(user_id=user_id).first()
	if not user_settings:
		db.session.add(Settings(
			user_id=user_id,
			level_low=level_low,
			level_medium=level_medium,
			level_high=level_high,
			enable_alert=enable_alert,
			alert_value=alert_value
		))
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
		user_email = request['email']
	except KeyError:
		return {"error": "No email provided."}, 400
	user = User.query.filter_by(email=user_email).first()

	if not user:
		# Send invalid email response
		return {'error': "User email address not found."}, 401

	response = PasswordHandler().send_password_reset_email({'user_email': user_email})
	if 'error' in response:
		return response, 500

	return {"status": "Email sent to {}".format(user_email)}, 200

def set_new_password(request):
	"""
	Sets new password for user.
	"""
	try:
		user_email = request['email']
	except KeyError:
		return {"error", "No email provided."}, 400

	password_salted = PasswordHandler().hash_password(request['newPassword'])
	
	result = User.query.filter_by(email=user_email).update(dict(password=password_salted))
	db.session.commit()

	# NOTE: Will updates, etc. return non-None values if successful?
	if not result:
		return {"error": "Failed to update password"}, 500

	return {"status": "success"}, 200
	

def make_notifications_request(latest_time):
	"""
	Gets all notifications from epa cyano endpoint.
	"""
	formatted_time = datetime.datetime.fromtimestamp(latest_time).strftime('%Y-%m-%d')

	notification_url = 'https://cyan.epa.gov/cyan/cyano/notifications/'
	start_date = '{}T00-00-00-000-0000'.format(formatted_time)
	try:
		notification_response = requests.get(notification_url + start_date)
		return json.loads(notification_response.content)
	except requests.exceptions.Timeout:
		logging.warning("Request to {} timed out.".format(notification_url))
		# TODO: Retry request.
		return None
	except requests.exceptions.RequestException as e:
		logging.warning("Error making request to {}.".format(notification_url))
		# TODO: Handle error.
		return None
	except Exception as e:
		logging.warning("Unknown exception occurred: {}".format(e))
		# TODO: Handle error.
		return None