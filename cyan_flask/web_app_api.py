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
import auth


BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def query_database(query, values, execution_type=None):
	conn = mysql.connector.connect(
		host=os.environ.get('DB_HOST'),
		port=os.environ.get('DB_PORT'),
		user=os.environ.get('DB_USER'),
		passwd=os.environ.get('DB_PASS'),
		database=os.environ.get('DB_NAME')
	)
	c = conn.cursor()
	try:
		if execution_type == 'multi':
			c.executemany(query, values)
		else:
			c.execute(query, values)
	except mysql.connector.Error as e:
		conn.close()
		logging.warning("query_database error: {}".format(e))
		return {"error": "Error accessing database"}

	if "INSERT" in query or "UPDATE" in query or "DELETE" in query:
		results = []  # todo: investigate why INSERT is throwing exception for c.fetchall()
	else:
		results = c.fetchall()
	conn.commit()
	conn.close()
	return results



def register_user(post_data):
	try:
		user = post_data['user']
		email = post_data['email']
		password = post_data['password']
	except KeyError:
		return {"error": "Invalid key in request"}, 200
	query = 'SELECT * FROM User WHERE username = %s'
	values = (user,)
	users = query_database(query, values)
	if len(users) != 0:
		return {"error": "Username already exists"}, 200
	else:
		date = datetime.date.today().isoformat()
		password_salted = auth.hash_password(password)
		query = 'INSERT INTO User(id, username, email, password, created, last_visit) VALUES (%s, %s, %s, %s, %s, %s)'
		values = (None, user, email, password_salted, date, date,)
		register = query_database(query, values)
		return {"status": "success", "username": user, "email": email}, 200

def login_user(post_data):
	try:
		user = post_data['user']
		password = post_data['password']
		data_type = post_data['dataType']
	except KeyError as e:
		logging.error(e)
		return {"error": "Invalid key in request"}, 200
	query = 'SELECT username, email, password, created, last_visit FROM User WHERE username = %s'
	values = (user,)
	users = query_database(query, values)
	if len(users) == 0:
		return {"error": "Invalid user credentials."}, 200
	elif type(users) is dict:
		if "error" in users.keys():
			return users, 200
		else:
			return {"status": "success"}, 200
	else:
		# date = users[0][3]

		if not auth.test_password(users[0][2], password):
			return {"error": "Invalid password"}, 200


		last_visit = users[0][4]  # gets user's last visit date
		last_visit_unix = time.mktime(last_visit.timetuple())

		notifications = get_notifications(user, last_visit_unix)

		query = 'UPDATE User SET last_visit = %s WHERE username = %s'
		date = datetime.date.today().isoformat()
		values = (date, user)
		query_database(query, values)

		try:
			users = users[0]
			user_data = {
				'username': users[0],
				'email': users[1],
				'auth_token': auth.encode_auth_token(user)
			}
			data = get_user_locations(user, data_type)

			return {'user': user_data, 'locations': data, 'notifications': notifications}, 200
		except KeyError as e:
			logging.warning("login_user key error: {}".format(e))
			return {"error": "Invalid key in database data"}, 200
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
		notes = post_data['notes'] or []
	except KeyError:
		return {"error": "Invalid key in request"}, 200

	# Checks if location already exists for user:
	query = 'SELECT * FROM Location WHERE id = %s AND owner = %s AND type = %s'
	values = (_id, user, data_type,)
	location = query_database(query, values)  # returns list of tuples (user, id, name, lat, lon, marked, notes)
	if isinstance(location, list) and len(location) > 0:
		return {"Record with same key exists"}, 409  # location already exists for owner

	# Inserts new location into database:
	query = 'INSERT INTO Location(owner, id, name, type, latitude, longitude, marked, notes) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)'
	values = (user, _id, name, data_type, latitude, longitude, marked, json.dumps(notes),)
	location = query_database(query, values)
	if type(location) is dict:
		if "error" in location.keys():
			return {"error": "Specified location for this user already exists"}, 200
		else:
			return {"status": "success"}, 201
	else:
		return {"status": "success"}, 201


def delete_location(user='', _id='', data_type=''):
	query = 'DELETE FROM Location WHERE id = %s AND owner = %s AND type = %s'
	values = (_id, user, data_type,)
	delete = query_database(query, values)
	if type(delete) is dict:
		if "error" in delete.keys():
			return {"error": "Error accessing database"}, 500
		else:
			return {"status": "success"}, 200
	else:
		return {"status": "success"}, 200

def edit_location(post_data):
	try:
		user = post_data['owner']
		_id = post_data['id']
		data_type = post_data['type']
		name = post_data['name']
		marked = post_data['marked']
		notes = post_data['notes'] or []  # array of strings in json format
	except KeyError:
		return {"error": "Invalid key in request"}, 200
	query = 'UPDATE Location SET name = %s, marked = %s, notes = %s WHERE owner = %s AND id = %s AND type = %s'
	values = (name, marked, json.dumps(notes), user, _id, data_type,)
	query_database(query, values)
	return {"status": "success"}, 200


def get_user_locations(user='', data_type=''):
	"""
	Returns user locations based on user and data type.
	TODO: How to prevent any user getting user locations if they could guess a username?
	"""
	query = 'SELECT owner, id, type, name, latitude, longitude, marked, notes FROM Location WHERE owner = %s and type = %s'
	values = (user, data_type,)
	locations = query_database(query, values)
	results = []

	for location in locations:
		results.append(readLocationRow(location))

	return results

def readLocationRow(location):
	loc_data = {
		"owner": location[0],
		"id": location[1],
		"type": location[2],
		"name": location[3],
		"latitude": location[4],
		"longitude": location[5],
		"marked": location[6],
		"notes": json.loads(location[7])
	}
	if not loc_data['notes'] or loc_data['notes'] == '""':
		loc_data['notes'] = []

	return loc_data


def get_location(user='', _id='', data_type=''):
	"""
	Returns user location based on user and location ID.
	TODO: How to prevent any user getting user locations if they could guess a username?
	"""
	query = 'SELECT owner, id, type, name, latitude, longitude, marked, notes FROM Location WHERE id = %s AND owner = %s AND type = %s'
	values = (_id, user, data_type,)
	location = query_database(query, values)
	if type(location) is dict:
		if "error" in location.keys():
			return {"error": "Error getting location from database."}, 500
		else:
			return readLocationRow(location), 200
	elif type(location) is list and len(location) > 0:
		return readLocationRow(location[0]), 200
	else:
		return "Not Found", 404



def get_notifications(user, last_visit):
	"""
	Populates the notifications list.
	Populate with all notifications if new user / registered??
	"""

	all_notifications = get_users_notifications(user)  # gets any existing notifications from user

	# Sets minimum time for getting notifications from cyano endpoint:
	latest_time = None
	if len(all_notifications) > 0:
		latest_time = convert_to_unix(all_notifications[-1][2])
	else:
		latest_time = last_visit

	new_notifications = make_notifications_request(latest_time)  # gets all notifications at /cyan/cyano/notifications

	db_values = parse_notifications_response(new_notifications, latest_time, user)
		
	if len(db_values) > 0:
		query = 'INSERT INTO Notifications (owner, id, date, subject, body, is_new) VALUES (%s, %s, %s, %s, %s, %s)'
		new_notifications = query_database(query, db_values, 'multi')

	all_notifications += [list(val) for val in db_values]  # converts tuples to lists

	return all_notifications

def get_users_notifications(user):
	# Gets existing notifications from user:
	query = 'SELECT * FROM Notifications WHERE owner = %s'
	values = (user,)
	user_notifications = query_database(query, values)
	_notifications = []
	for notification in user_notifications:
		notification = list(notification)
		notification[2] = notification[2].strftime('%Y-%m-%d %H:%M:%S')
		_notifications.append(notification)
	return _notifications

def parse_notifications_response(new_notifications, latest_time, user):
	values = []
	if new_notifications is None:
		return values

	for notification in new_notifications:
		# NOTE: Assuming ascending order of dates
		notification_time = int(str(notification['dateSent'])[:-3])  # NOTE: trimming off 3 trailing 0s
		if notification_time <= latest_time:
			continue
		val = (user, notification['id'], convert_to_timestamp(notification['dateSent']), notification['subject'], notification['message'], 1)
		values.append(val)
	return values

def edit_notifications(user, _id):
	"""
	Updates user's notification that has been read,
	e.g., sets is_new to false.
	"""
	query = 'UPDATE Notifications SET is_new = %s WHERE owner = %s AND id = %s'
	values = (0, user, _id)
	query_database(query, values)
	return {"status": "success"}, 200

def delete_notifications(user):
	"""
	Removes user's notifications (event: "Clear" button hit)
	"""
	query = 'DELETE FROM Notifications WHERE owner = %s'
	values = (user,)
	query_database(query, values)
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


def convert_to_timestamp(unix_time):
	"""
	Converts notifications endpoint's timestamps.
	"""
	trimmed_time = int(str(unix_time)[:-3])  # NOTE: trimming off 3 trailing 0s
	return datetime.datetime.fromtimestamp(trimmed_time).strftime('%Y-%m-%d %H:%M:%S')

def convert_to_unix(timestamp):
	"""
	Converts notification timestamp to unix time.
	"""
	dt = datetime.datetime.strptime(timestamp, '%Y-%m-%d %H:%M:%S')
	unix_time = dt.timetuple()
	unix_time = int(time.mktime(unix_time))
	return unix_time