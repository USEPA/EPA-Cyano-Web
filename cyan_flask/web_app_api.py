"""
NOTE: From qed_cyan/cyan_app django application.

Handles user account interactions.
"""

import hashlib
import binascii
import uuid
import datetime
import sqlite3
import mysql.connector
import json
import os
import logging



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


def query_database(query, values):
	conn = mysql.connector.connect(
		host=os.environ.get('DB_HOST'),
		port=os.environ.get('DB_PORT'),
		user=os.environ.get('DB_USER'),
		passwd=os.environ.get('DB_PASS'),
		database=os.environ.get('DB_NAME')
	)
	c = conn.cursor()
	try:
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


# @csrf_exempt
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


# @csrf_exempt
def login_user(post_data):
	try:
		user = post_data['user']
		password = post_data['password']
	except KeyError:
		return {"error": "Invalid key in request"}, 200
	query = 'SELECT username, email, password, created FROM User WHERE username = %s'
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
		date = users[0][3]
		if not test_password(users[0][2], password):
			return {"error": "Invalid password"}, 200
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
			return {'user': user_data, 'locations': data}, 200
		except KeyError as e:
			logging.warning("login_user key error: {}".format(e))
			return {"error": "Invalid key in database data"}, 200
		except Exception as e:
			logging.warning("login_user exception: {}".format(e))
			return {'user': user_data, 'locations': None}, 200


# @csrf_exempt
# @require_POST
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


# @require_GET
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


# @csrf_exempt
# @require_POST
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