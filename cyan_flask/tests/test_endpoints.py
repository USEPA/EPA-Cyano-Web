import unittest
from unittest.mock import Mock, patch
import sys
import os
import datetime
import inspect
from tabulate import tabulate
import requests
import random
import string
import flask

script_path = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(1, os.path.join(script_path, '..', '..'))  # adds EPA-Cyano-Web project to sys.path

# Local imports:
from config.set_environment import DeployEnv
# from cyan_flask.app.endpoints import StatusTest, Register, Login, AddLocation, EditLocation, DeleteLocation, GetLocation, EditNotification, DeleteNotification
from cyan_flask.app import endpoints

# Sets up runtime environment:
runtime_env = DeployEnv()
runtime_env.load_deployment_environment()


def mock_decorator():
	"""
	Mock decorator for @login_required
	"""
	def decorator(f):
		@wraps(f)
		def decorated_function(*args, **kwargs):
			return f(*args, **kwargs)
		return decorated_function
	return decorator



class TestEndpoints(unittest.TestCase):
	"""
	Unit test class for app.py module, which is the Flask app
	that defines the API endpoints.
	"""

	print("cyan_flask endpoints.py unittests conducted at " + str(datetime.datetime.today()))

	def setUp(self):
		"""
		Setup routine called before each unit tests.
		:return:
		"""
		pass

	def tearDown(self):
		"""
		teardown called after each test
		:return:
		"""
		pass

	def test_statustest_get(self):
		"""
		Tests StatusTest endpoint GET request.
		"""
		expected_result = {"status": "cyan flask up and running."}
		actual_result = endpoints.StatusTest().get()
		self.assertEqual(actual_result, expected_result)

	def test_register_get(self):
		"""
		Tests Register endpoint GET request.
		"""
		expected_result = {"status": "register endpoint"}
		actual_result = endpoints.Register().get()
		self.assertEqual(actual_result, expected_result)

	@patch('cyan_flask.app.endpoints.web_app_api.register_user')
	@patch('cyan_flask.app.endpoints.Register.parser.parse_args')
	def test_register_post(self, parse_args_mock, register_user_mock):
		"""
		Tests Register endpoint POST request.
		"""
		test_request = {
			"user": "test",
			"password": "test",
			"email": "test@email.com"
		}
		expected_result_user_created = {
			"status": "success",
			"username": "test",
			"email": "test@email.com"
		}, 200
		parse_args_mock.return_value = test_request
		register_user_mock.return_value = expected_result_user_created
		actual_result_1 = endpoints.Register().post()

		self.assertEqual(actual_result_1, expected_result_user_created)

	def test_login_get(self):
		"""
		Tests Login endpoint GET request.
		"""
		expected_result = {"status": "login endpoint"}
		actual_result = endpoints.Login().get()
		self.assertEqual(actual_result, expected_result)

	# @patch('cyan_flask.app.endpoints.web_app_api.register_user')
	# @patch('cyan_flask.app.endpoints.request.get_json')
	# def test_login_post(self, parse_args_mock, get_json_mock):
	# 	"""
	# 	Tests Login endpoint POST request.
	# 	"""
	# 	test_request = {
	# 		"user": "test",
	# 		"password": "test",
	# 		"dataType": 1
	# 	}
	# 	test_locations = []
	# 	test_notifications = []
	# 	test_settings = {}

	# 	expected_result = {
	# 		'user': test_request['user'],
	# 		'locations': test_locations,
	# 		'notifications': test_notifications,
	# 		'settings': test_settings
	# 	}, 200

	# 	parse_args_mock.return_value = test_request
	# 	get_json_mock.return_value = expected_result
	# 	actual_result_1 = endpoints.Login().post()

	# 	self.assertEqual(actual_result_1, expected_result)

	def test_add_location_get(self):
		"""
		Tests AddLocation endpoint GET request.
		"""
		expected_result = {"status": "location endpoint"}
		actual_result = endpoints.AddLocation().get()
		self.assertEqual(actual_result, expected_result)

	# # @patch('cyan_flask.app.endpoints.request')
	# @patch('cyan_flask.app.endpoints.login_required')
	# def test_add_location_post(self, login_required_mock):
	# 	"""
	# 	Tests AddLocation endpoint POST request.
	# 	"""
	# 	user = "test"
	# 	request_obj = {
	# 		'owner': "test",
	# 		'id': None,
	# 		'type': 1,
	# 		'name': "location name",
	# 		'latitude': 80.00,
	# 		'longitude': -80.00,
	# 		'marked': False,
	# 		'compare': False,
	# 		'notes': []
	# 	}

	# 	request = flask.Response()
	# 	request.headers = {'authorizination': None}

	# 	login_required_mock\
	# 		.return_value = mock_decorator

	# 	# get_json_mock\
	# 	# 	.return_value.get_json\
	# 	# 	.return_value = request_obj

	# 	actual_result = endpoints.AddLocation().post()

	def test_edit_location_get(self):
		"""
		Tests EditLocation endpoint GET request.
		"""
		expected_result = {"status": "edit location endpoint"}
		actual_result = endpoints.EditLocation().get()
		self.assertEqual(actual_result, expected_result)

	def test_edit_location_post(self):
		"""
		Tests EditLocation endpoint POST request.
		"""
		pass

	def test_delete_location_get(self):
		"""
		Tests DeleteLocation endpoint GET request.
		"""
		pass

	def test_get_user_locations_get(self):
		"""
		Tests GetUserLocations endpoint GET request.
		"""
		pass

	def test_get_location_get(self):
		"""
		Tests GetLocation endpoint GET request.
		"""
		pass

	def test_edit_notification_get(self):
		"""
		Tests EditNotification endpoint GET request.
		"""
		pass

	def test_delete_notification_get(self):
		"""
		Tests DeleteNotification endpoint GET request.
		"""
		pass

	def test_edit_settings_get(self):
		"""
		Tests EditSettings endpoint GET request.
		"""
		pass

	def test_refresh_get(self):
		"""
		Tests Refresh endpoint GET request.
		"""
		pass

	def test_reset_post(self):
		"""
		Tests Reset endpoint POST request.
		"""
		pass

	def test_reset_put(self):
		"""
		Tests Reset endpoint PUT request.
		"""
		pass

	def test_comment_get(self):
		"""
		Tests Comment endpoint GET request.
		"""
		pass

	def test_comment_post(self):
		"""
		Tests Comment endpoint POST request.
		"""
		pass

	def test_reply_get(self):
		"""
		Tests Reply endpoint GET request.
		"""
		pass

	def test_reply_post(self):
		"""
		Tests Reply endpoint POST request.
		"""
		pass