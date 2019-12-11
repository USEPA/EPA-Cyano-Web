"""
NOTE: From qed_cyan/cyan_app django application.

Handles user account interactions.
"""

import hashlib
import binascii
import uuid
import time
import datetime
import sqlite3
import mysql.connector
import json
import os
import logging
import requests



BASE_DIR = os.path.dirname(os.path.abspath(__file__))



def hash_password(password):
	salt = hashlib.sha256(os.urandom(60)).hexdigest().encode('ascii')
	password_hash = hashlib.pbkdf2_hmac('sha512', password.encode('utf-8'), salt, 100000)
	password_hex = binascii.hexlify(password_hash)
	password_salted = (salt + password_hex).decode('ascii')
	return password_salted

def test_password(password_0, password_1):
	salt = password_0[:64]
	password_1_hash = hashlib.pbkdf2_hmac('sha512', password_1.encode('utf-8'), salt.encode('ascii'), 100000)
	password_1_hex = binascii.hexlify(password_1_hash).decode('ascii')
	return password_0[64:] == password_1_hex

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
		password_salted = hash_password(password)
		query = 'INSERT INTO User(id, username, email, password, created, last_visit) VALUES (%s, %s, %s, %s, %s, %s)'
		values = (None, user, email, password_salted, date, date,)
		register = query_database(query, values)
		return {"status": "success", "username": user, "email": email}, 200

def login_user(post_data):
	try:
		user = post_data['user']
		password = post_data['password']
	except KeyError:
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

		if not test_password(users[0][2], password):
			return {"error": "Invalid password"}, 200

		notifications = get_notification(user)

		# TODO: Need to update the user table's last_visit after getting notifications.
		query = 'UPDATE User SET last_visit = %s WHERE username = %s AND password = %s'
		date = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
		values = (date, user, password)
		query_result = query_database(query, values)

		query = 'SELECT * FROM Location WHERE owner = %s'
		values = (user,)
		locations = query_database(query, values)
		data = []
		try:
			users = users[0]
			user_data = {
				"username": users[0],
				"email": users[1]
			}
			for location in locations:
				loc_data = {
					"owner": location[0],
					"id": location[1],
					"name": location[2],
					"latitude": location[3],
					"longitude": location[4],
					"marked": location[5],
					"notes": location[6]
				}
				data.append(loc_data)
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
		name = post_data['name']
		latitude = post_data['latitude']
		longitude = post_data['longitude']
		marked = post_data['marked']
		notes = post_data['notes']  # array of strings in json format
	except KeyError:
		return {"error": "Invalid key in request"}, 200
	query = 'INSERT INTO Location(owner, id, name, latitude, longitude, marked, notes) VALUES (%s, %s, %s, %s, %s, %s, %s)'
	values = (user, _id, name, latitude, longitude, marked, notes,)
	location = query_database(query, values)
	if type(location) is dict:
		if "error" in location.keys():
			return {"error": "Specified location for this user already exists"}, 200
		else:
			return {"status": "success"}, 201
	else:
		return {"status": "success"}, 201

def delete_location(user='', _id=''):
	query = 'DELETE FROM Location WHERE id = %s AND owner = %s'
	values = (_id, user,)
	delete = query_database(query, values)
	if type(delete) is dict:
		if "error" in delete.keys():
			return {"error": "Error accessing database"}, 200
		else:
			return {"status": "success"}, 200
	else:
		return {"status": "success"}, 200

def edit_location(post_data):
	try:
		user = post_data['owner']
		_id = post_data['id']
		name = post_data['name']
		marked = post_data['marked']
		notes = post_data['notes']  # array of strings in json format
	except KeyError:
		return {"error": "Invalid key in request"}, 200
	query = 'UPDATE Location SET name = %s, marked = %s, notes = %s WHERE owner = %s AND id = %s'
	values = (name, marked, notes, user, _id,)
	location = query_database(query, values)
	return {"status": "success"}, 200

def get_location(user='', _id=''):
	"""
	Returns user location based on user and location ID.
	TODO: How to prevent any user getting user locations if they could guess a username?
	"""
	query = 'SELECT * FROM Location WHERE id = %s AND owner = %s'
	values = (_id, user,)
	location = query_database(query, values)
	if type(location) is dict:
		if "error" in location.keys():
			return {"error": "Error getting location from database."}, 200
		else:
			return location, 200
	elif type(location) is list and len(location) > 0:
		return location[0], 200
	else:
		return location, 200



def add_notification():
	"""
	After notification call from last sync time.
	"""
	pass

def edit_notification():
	"""
	Set is_new false after read.
	"""
	pass

def delete_notification():
	"""
	When "Clear" notifications button is hit.
	"""
	pass

def get_notification(user):
	"""
	Populates the notifications list.
	Populate with all notifications if new user / registered??
	"""
	# get notifications since last_visit, then update last_visit
	notifications = get_all_notifications()  # gets all notifications at /cyan/cyano/notifications

	# TODO: Update user's notifications table with notifications.
	query = 'INSERT INTO Notifications (owner, id, date, subject, body, is_new) VALUES (%s, %s, %s, %s, %s, %s)'
	values = []
	# Consider refactoring for improved computation time.
	for notification in notifications:
		# values.append((user, None, convert_to_timestamp(notification['dateSent']), notification['subject'], notification['message'], 1))
		values.append((user, notification['id'], convert_to_timestamp(notification['dateSent']), notification['subject'], notification['message'], 1))
	notifications = query_database(query, values, 'multi')

	# return notifications  # returns DB array of notifications
	return values

	

def get_all_notifications():
	"""
	Gets all notifications from epa cyano endpoint.
	"""
	notification_url = 'https://cyan.epa.gov/cyan/cyano/notifications/'
	start_date = '2017-06-23T00-00-00-000-0000'
	try:
		notification_response = requests.get(notification_url + start_date)
		return json.loads(notification_response.content)
	except requests.exceptions.Timeout:
		logging.warning("Request to {} timed out.".format(notification_url))
		# TODO: Retry request.
		return None
	except requests.exceptions.RequestException:
		logging.warning("Error making request to {}.".format(notification_url))
		# TODO: Handle error.
		return None
	except Exception as e:
		logging.warning("Unknown exception occurred: {}".format(e))
		# TODO: Handle error.
		return None


def convert_to_timestamp(unix_time):
	mytime = time.time()
	trimmed_time = int(str(unix_time)[:-3])
	return datetime.datetime.fromtimestamp(trimmed_time).strftime('%Y-%m-%d %H:%M:%S')