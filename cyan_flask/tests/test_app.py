import unittest
from unittest.mock import Mock, patch
import sys
import os
import datetime
import inspect
from tabulate import tabulate
import requests

# Loads environment based on deployment location:
sys.path.insert(1, os.path.join(sys.path[0], '..'))
from config.set_environment import DeployEnv
from cyan_flask.app import StatusTest, Register, Login, AddLocation, EditLocation, DeleteLocation, GetLocation, EditNotification, DeleteNotification

# Sets up runtime environment:
runtime_env = DeployEnv()
runtime_env.load_deployment_environment()


class TestApp(unittest.TestCase):
	"""
	Unit test class for app.py module, which is the Flask app
	that defines the API endpoints.
	"""

	print("cyan_flask app.py unittests conducted at " + str(datetime.datetime.today()))

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
		print("\n\nTesting StatusTest endpoint's GET request:")
		expected_result = {"status": "cyan flask up and running."}
		actual_result = StatusTest().get()
		try:
			self.assertEqual(actual_result, expected_result)
		finally:
			tab = [["Actual:", actual_result], ["Expected:", expected_result]]
			print("\n")
			print(inspect.currentframe().f_code.co_name)
			print(tabulate(tab, headers='keys', tablefmt='rst'))

	def test_register_get(self):
		"""
		Tests Register endpoint GET request.
		"""
		print("\n\nTesting Register endpoint's GET request:")
		expected_result = {"status": "register endpoint"}
		actual_result = Register().get()
		try:
			self.assertEqual(actual_result, expected_result)
		finally:
			tab = [["Actual:", actual_result], ["Expected:", expected_result]]
			print("\n")
			print(inspect.currentframe().f_code.co_name)
			print(tabulate(tab, headers='keys', tablefmt='rst'))

	@patch('cyan_flask.app.web_app_api.register_user')
	@patch('cyan_flask.app.Register.parser.parse_args')
	def test_register_post(self, parse_args_mock, register_user_mock):
		"""
		Tests Register endpoint POST request.
		"""
		print("\n\nTesting Register endpoints' POST request:")
		test_request = {
			"user": "test",
			"password": "test",
			"email": "test@email.com"
		}
		expected_result_user_created = {
		    "status": "success",
		    "username": "test1",
		    "email": "test@email.com"
		}, 200
		expected_result_user_exist = {"error": "Username already exists"}, 200
		parse_args_mock.return_value = test_request
		register_user_mock.return_value = expected_result_user_exist
		actual_result_1 = Register().post()
		register_user_mock.return_value = expected_result_user_created
		actual_result_2 = Register().post()
		try:
			self.assertEqual(actual_result_1, expected_result_user_exist)
			self.assertEqual(actual_result_2, expected_result_user_created)
		finally:
			tab = [["Actual:", actual_result_1, actual_result_2], ["Expected:", expected_result_user_exist, expected_result_user_created]]
			print("\n")
			print(inspect.currentframe().f_code.co_name)
			print(tabulate(tab, headers='keys', tablefmt='rst'))

	def test_login_get(self):
		"""
		Tests Login endpoint GET request.
		"""
		print("\n\nTesting Login endpoints' GET request:")
		expected_result = {"status": "login endpoint"}
		actual_result = Login().get()
		try:
			self.assertEqual(actual_result, expected_result)
		finally:
			tab = [["Actual:", actual_result], ["Expected:", expected_result]]
			print("\n")
			print(inspect.currentframe().f_code.co_name)
			print(tabulate(tab, headers='keys', tablefmt='rst'))

	@patch('cyan_flask.app.web_app_api.login_user')
	@patch('cyan_flask.app.Login.parser.parse_args')
	def test_login_post(self, parse_args_mock, login_user_mock):
		"""
		Tests Login endpoint POST request.
		"""
		print("\n\nTesting Login endpoints' POST request:")

		# parse_args mock for mocking user requests:
		test_request_1 = {"wrongkey": "", "password": ""}
		test_request_2 = {"user": "wronguser", "password": "wrongpassword"}
		test_request_3 = {}
		test_request_4 = {"user": "test", "password": "wrongpassword"}
		test_request_5 = {"user": "test", "password": "test"}
		test_request_6 = {"user": "test", "password": "test", "email": "test@email.com"}

		# web_app_api login_user mock for mocking db responses:
		expected_result_1 = {"error": "Invalid key in request"}, 200
		expected_result_2 = {"error": "Invalid user credentials."}, 200
		expected_result_3 = {"error": "Some error in 'users' dict object."}, 200  # users as dict type test
		expected_result_4 = {"error": "Invalid password"}, 200
		expected_result_5 = {"status": "success"}, 200  # returned when: no 'error' in users, and users is dict
		expected_result_6 = {
			"user": {
				"username": test_request_6['user'],
				"email": test_request_6['email']
			}, 
			"locations": [],
			"notifications": []
		}, 200

		# Test case 1:
		parse_args_mock.return_value = test_request_1
		login_user_mock.return_value = expected_result_1
		actual_result_1 = Login().post()
		# Test case 2:
		parse_args_mock.return_value = test_request_2
		login_user_mock.return_value = expected_result_2
		actual_result_2 = Login().post()
		# Test case 3:
		parse_args_mock.return_value = test_request_3
		login_user_mock.return_value = expected_result_3
		actual_result_3 = Login().post()
		# Test case 4:
		parse_args_mock.return_value = test_request_4
		login_user_mock.return_value = expected_result_4
		actual_result_4 = Login().post()
		# Test case 5:
		parse_args_mock.return_value = test_request_5
		login_user_mock.return_value = expected_result_5
		actual_result_5 = Login().post()
		# Test case 6:
		parse_args_mock.return_value = test_request_6
		login_user_mock.return_value = expected_result_6
		actual_result_6 = Login().post()

		try:
			self.assertEqual(actual_result_1, expected_result_1)
			self.assertEqual(actual_result_2, expected_result_2)
			self.assertEqual(actual_result_3, expected_result_3)
			self.assertEqual(actual_result_4, expected_result_4)
			self.assertEqual(actual_result_5, expected_result_5)
			self.assertEqual(actual_result_6, expected_result_6)
		finally:
			tab = [
				["Actual:", actual_result_1, actual_result_2, actual_result_3, actual_result_4, actual_result_5, actual_result_6],
				["Expected:", expected_result_1, expected_result_2, expected_result_3, expected_result_4, expected_result_5, expected_result_6]
			]
			print("\n")
			print(inspect.currentframe().f_code.co_name)
			print(tabulate(tab, headers='keys', tablefmt='rst'))

	def test_addlocation_get(self):
		"""
		Tests AddLocation endpoint GET request.
		"""
		print("\n\nTesting AddLocation endpoints' GET request:")
		expected_result = {"status": "location endpoint"}
		actual_result = AddLocation().get()
		try:
			self.assertEqual(actual_result, expected_result)
		finally:
			tab = [["Actual:", actual_result], ["Expected:", expected_result]]
			print("\n")
			print(inspect.currentframe().f_code.co_name)
			print(tabulate(tab, headers='keys', tablefmt='rst'))

	@patch('cyan_flask.app.web_app_api.add_location')
	@patch('cyan_flask.app.AddLocation.parser.parse_args')
	def test_addlocation_post(self, parse_args_mock, add_location_mock):
		"""
		Tests AddLocation endpoint post request.
		"""
		print("\n\nTesting AddLocation endpoints' POST request:")

		test_request_1 = {"missing": "ownerkey", "id": None, "name": "", "latitude": None, "longitude": None, "marked": False, "notes": ""}
		test_request_2 = {"owner": "test", "id": None, "name": "", "latitude": None, "longitude": None, "marked": False, "notes": ""}
		test_request_3 = test_request_2
		test_request_4 = test_request_2
		test_request_5 = test_request_2

		expected_result_1 = {"error": "Invalid key in request"}, 200
		expected_result_2 = {"status", "success"}, 200
		expected_result_3 = {"error": "Specified location for this user already exists"}, 200
		expected_result_4 = {"status", "success"}, 201
		expected_result_5 = {"status", "success"}, 201

		# Test case 1:
		parse_args_mock.return_value = test_request_1
		add_location_mock.return_value = expected_result_1
		actual_result_1 = AddLocation().post("someuser", "someid")
		# Test case 2:
		parse_args_mock.return_value = test_request_2
		add_location_mock.return_value = expected_result_2
		actual_result_2 = AddLocation().post("someuser", "someid")
		# Test case 3:
		parse_args_mock.return_value = test_request_3
		add_location_mock.return_value = expected_result_3
		actual_result_3 = AddLocation().post("someuser", "someid")
		# Test case 4:
		parse_args_mock.return_value = test_request_4
		add_location_mock.return_value = expected_result_4
		actual_result_4 = AddLocation().post("someuser", "someid")
		# Test case 5:
		parse_args_mock.return_value = test_request_5
		add_location_mock.return_value = expected_result_5
		actual_result_5 = AddLocation().post("someuser", "someid")

		try:
			self.assertEqual(actual_result_1, expected_result_1)
			self.assertEqual(actual_result_2, expected_result_2)
			self.assertEqual(actual_result_3, expected_result_3)
			self.assertEqual(actual_result_4, expected_result_4)
			self.assertEqual(actual_result_5, expected_result_5)
		finally:
			tab = [
				["Actual:", actual_result_1, actual_result_2, actual_result_3, actual_result_4, actual_result_5],
				["Expected:", expected_result_1, expected_result_2, expected_result_3, expected_result_4, expected_result_5]
			]
			print("\n")
			print(inspect.currentframe().f_code.co_name)
			print(tabulate(tab, headers='keys', tablefmt='rst'))

	def test_editlocation_get(self):
		"""
		Tests EditLocation endpoint GET request.
		"""
		print("\n\nTesting EditLocation endpoints' GET request:")
		expected_result = {"status": "edit location endpoint"}
		actual_result = EditLocation().get()
		try:
			self.assertEqual(actual_result, expected_result)
		finally:
			tab = [["Actual:", actual_result], ["Expected:", expected_result]]
			print("\n")
			print(inspect.currentframe().f_code.co_name)
			print(tabulate(tab, headers='keys', tablefmt='rst'))

	@patch('cyan_flask.app.web_app_api.edit_location')
	@patch('cyan_flask.app.EditLocation.parser.parse_args')
	def test_editlocation_post(self, parse_args_mock, edit_location_mock):
		"""
		Tests EditLocation endpoint post request.
		"""
		print("\n\nTesting EditLocation endpoints' POST request:")
		test_request_1 = {"missing": "ownerkey", "id": None, "name": "", "marked": False, "notes": ""}
		test_request_2 = {"owner": "test", "id": None, "name": "", "marked": False, "notes": ""}
		expected_result_1 = {"error": "Invalid key in request"}, 200
		expected_result_2 = {"status", "success"}, 200
		# Test case 1:
		parse_args_mock.return_value = test_request_1
		edit_location_mock.return_value = expected_result_1
		actual_result_1 = EditLocation().post()
		# Test case 2:
		parse_args_mock.return_value = test_request_2
		edit_location_mock.return_value = expected_result_2
		actual_result_2 = EditLocation().post()
		try:
			self.assertEqual(actual_result_1, expected_result_1)
			self.assertEqual(actual_result_2, expected_result_2)
		finally:
			tab = [
				["Actual:", actual_result_1, actual_result_2],
				["Expected:", expected_result_1, expected_result_2]
			]
			print("\n")
			print(inspect.currentframe().f_code.co_name)
			print(tabulate(tab, headers='keys', tablefmt='rst'))

	@patch('cyan_flask.app.web_app_api.delete_location')
	def test_deletelocation_get(self, delete_location_mock):
		"""
		Tests DeleteLocation endpoint GET request.
		"""
		print("\n\nTesting DeleteLocation endpoints' GET request:")
		
		expected_result_1 = {"error": "Error accessing database"}, 200
		expected_result_2 = {"status": "success"}, 200

		# Test case 1:
		delete_location_mock.return_value = expected_result_1
		actual_result_1 = DeleteLocation().get("someuser", "someid")
		# Test case 2:
		delete_location_mock.return_value = expected_result_2
		actual_result_2 = DeleteLocation().get("someuser", "someid")

		try:
			self.assertEqual(actual_result_1, expected_result_1)
			self.assertEqual(actual_result_2, expected_result_2)
		finally:
			tab = [
				["Actual:", actual_result_1, actual_result_2],
				["Expected:", expected_result_1, expected_result_2]
			]
			print("\n")
			print(inspect.currentframe().f_code.co_name)
			print(tabulate(tab, headers='keys', tablefmt='rst'))

	@patch('cyan_flask.app.web_app_api.get_location')
	def test_getlocation_get(self, get_location_mock):
		"""
		Tests GetLocation endpoint GET request.
		"""
		print("\n\nTesting GetLocation endpoints' GET request:")
		
		test_location = ["test", None, "", None, None, False, ""]  # [owner, id, name, latitude, longitude, marked, notes]
		test_location_mock = test_location, 200

		expected_result_1 = {"error": "Error getting location from database."}, 200
		expected_result_2 = {
			'owner': test_location[0],
			'id': test_location[1],
			'name': test_location[2],
			'latitude': test_location[3],
			'longitude': test_location[4],
			'marked': test_location[5],
			'notes': test_location[6]
		}, 200

		# Test case 1:
		get_location_mock.return_value = expected_result_1
		actual_result_1 = GetLocation().get("someuser", "someid")
		# Test case 2:
		get_location_mock.return_value = test_location_mock
		actual_result_2 = GetLocation().get("someuser", "someid")

		try:
			self.assertEqual(actual_result_1, expected_result_1)
			self.assertEqual(actual_result_2, expected_result_2)
		finally:
			tab = [
				["Actual:", actual_result_1, actual_result_2],
				["Expected:", expected_result_1, expected_result_2]
			]
			print("\n")
			print(inspect.currentframe().f_code.co_name)
			print(tabulate(tab, headers='keys', tablefmt='rst'))

	@patch('cyan_flask.web_app_api.edit_notifications')
	def test_editnotification_get(self, edit_notifications_mock):
		"""
		Tests EditNotification endpoint GET request.
		"""
		print("\n\nTesting EditNotification endpoints' GET request:")
		expected_result = {"status": "success"}, 200
		edit_notifications_mock.return_value = expected_result
		actual_result = EditNotification().get("someuser", "someid")
		try:
			self.assertEqual(actual_result, expected_result)
		finally:
			tab = [["Actual:", actual_result], ["Expected:", expected_result]]
			print("\n")
			print(inspect.currentframe().f_code.co_name)
			print(tabulate(tab, headers='keys', tablefmt='rst'))

	@patch('cyan_flask.web_app_api.delete_notifications')
	def test_deletenotification_get(self, delete_notifications_mock):
		"""
		Tests DeleteNotification endpoint GET request.
		"""
		print("\n\nTesting DeleteNotification endpoints' GET request:")
		expected_result = {"status": "success"}, 200
		delete_notifications_mock.return_value = expected_result
		actual_result = DeleteNotification().get("someuser")
		try:
			self.assertEqual(actual_result, expected_result)
		finally:
			tab = [["Actual:", actual_result], ["Expected:", expected_result]]
			print("\n")
			print(inspect.currentframe().f_code.co_name)
			print(tabulate(tab, headers='keys', tablefmt='rst'))