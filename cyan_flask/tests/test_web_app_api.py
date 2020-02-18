import unittest
from unittest.mock import Mock, patch
import sys
import os
import datetime
import inspect
from tabulate import tabulate
import requests

# Loads environment based on deployment location:
script_path = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(script_path, '..', '..'))  # adds EPA-Cyano-Web project to sys.path

# Local imports:
from config.set_environment import DeployEnv
from cyan_flask import web_app_api

# Sets up runtime environment:
runtime_env = DeployEnv()
runtime_env.load_deployment_environment()



class TestWebAppApi(unittest.TestCase):
	"""
	Unit test class for web_app_api.py module, which is the Flask app
	that defines the API endpoints.
	"""

	print("cyan_flask web_app_api.py unittests conducted at " + str(datetime.datetime.today()))

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

	# def test_hash_password(self):
	# 	expected_result = 192
	# 	actual_result = len(web_app_api.hash_password("password"))
	# 	try:
	# 		self.assertEqual(actual_result, expected_result)
	# 	finally:
	# 		tab = [["Actual:", actual_result], ["Expected:", expected_result]]
	# 		print("\n")
	# 		print(inspect.currentframe().f_code.co_name)
	# 		print(tabulate(tab, headers='keys', tablefmt='rst'))

	# def test_test_password(self):
	# 	test_hash = 'b4e8ced1a488722d8179a7294a2e27ecb07971e0bb24b32f55deeb417702dd5d309a180511a01758489e17ab93693ac0946332d4dd495c5b09421e7d754f1e3ecffd123afa5e009519ff6a543f028387a09c7aa8b4a27da2183b8299cac10f02'
	# 	result = web_app_api.test_password(test_hash, "password")
	# 	try:
	# 		self.assertTrue(result)
	# 	finally:
	# 		tab = [["Passwords equal:", result]]
	# 		print("\n")
	# 		print(inspect.currentframe().f_code.co_name)
	# 		print(tabulate(tab, headers='keys', tablefmt='rst'))

	# def test_query_database(self):
	# 	pass

	# @patch('cyan_flask.web_app_api.query_database')
	# def test_register_user(self, query_database_mock):
	# 	example_db_result = [("test", "test@email.com", "test", "created", "last_visit")]  # order: id, username, email, password, created, last_visited
	# 	test_request_1 = {
	# 		"wrongkey": "test",
	# 		"password": "test",
	# 		"email": "test@email.com"
	# 	}
	# 	test_request_2 = {
	# 		"user": "test",
	# 		"password": "test",
	# 		"email": "test@email.com"
	# 	}

	# 	# Test case 1:
	# 	expected_result_1 = {"error": "Invalid key in request"}, 200
	# 	actual_result_1 = web_app_api.register_user(test_request_1)
	# 	# Test case 2:
	# 	query_database_mock.return_value = example_db_result
	# 	expected_result_2 = {"error": "Username already exists"}, 200
	# 	actual_result_2 = web_app_api.register_user(test_request_2)
	# 	# Test case 3:
	# 	query_database_mock.return_value = []
	# 	expected_result_3 = {"status": "success", "username": test_request_2['user'], "email": test_request_2['email']}, 200
	# 	actual_result_3 = web_app_api.register_user(test_request_2)

	# 	try:
	# 		self.assertEqual(actual_result_1, expected_result_1)
	# 		self.assertEqual(actual_result_2, expected_result_2)
	# 		self.assertEqual(actual_result_3, expected_result_3)
	# 	finally:
	# 		tab = [
	# 			["Actual:", actual_result_1, actual_result_2, actual_result_3],
	# 			["Expected:", expected_result_1, expected_result_2, expected_result_3]
	# 		]
	# 		print("\n")
	# 		print(inspect.currentframe().f_code.co_name)
	# 		print(tabulate(tab, headers='keys', tablefmt='rst'))

	# @patch('cyan_flask.web_app_api.query_database')
	# def test_login_user(self, query_database_mock):
	# 	example_db_user_result = [("test", "test@email.com", "test", datetime.datetime.now(), datetime.datetime.now())]
	# 	example_user_data = {
	# 		"user": {
	# 			"username": "test",
	# 			"email": "test@email.com"
	# 		}, 
	# 		"locations": [],
	# 		"notifications": []
	# 	}
	# 	test_request_1 = {"wrongkey": "test", "password": "test"}
	# 	test_request_2 = {"user": "test", "password": "test"}
	# 	test_request_3 = {"error": "testing"}
	# 	test_request_4 = {"user": "test", "password": "wrongpassword"}

	# 	# Test case 1:
	# 	expected_result_1 = {"error": "Invalid key in request"}, 200
	# 	actual_result_1 = web_app_api.login_user(test_request_1)
	# 	# Test case 2:
	# 	query_database_mock.return_value = []
	# 	expected_result_2 = {"error": "Invalid user credentials."}, 200
	# 	actual_result_2 = web_app_api.login_user(test_request_2)
	# 	# Test case 3:
	# 	query_database_mock.return_value = test_request_3
	# 	expected_result_3 = test_request_3, 200
	# 	actual_result_3 = web_app_api.login_user(test_request_2)
	# 	# Test case 4:
	# 	query_database_mock.return_value = test_request_2
	# 	expected_result_4 = {"status": "success"}, 200
	# 	actual_result_4 = web_app_api.login_user(test_request_2)
	# 	# Test case 5:
	# 	query_database_mock.return_value = example_db_user_result
	# 	expected_result_5 = {"error": "Invalid password"}, 200
	# 	actual_result_5 = web_app_api.login_user(test_request_4)
	# 	# Test case 6:
	# 	with patch('cyan_flask.web_app_api.load_user_locations') as load_user_locations_mock:
	# 		with patch('cyan_flask.web_app_api.get_notifications') as get_notifications_mock:
	# 			with patch('cyan_flask.web_app_api.test_password') as test_password_mock:
	# 				query_database_mock.return_value = example_db_user_result
	# 				test_password_mock.return_value = True
	# 				get_notifications_mock.return_value = []
	# 				load_user_locations_mock.return_value = example_user_data, 200
	# 				expected_result_6 = example_user_data, 200
	# 				actual_result_6 = web_app_api.login_user(test_request_2)

	# 	try:
	# 		self.assertEqual(actual_result_1, expected_result_1)
	# 		self.assertEqual(actual_result_2, expected_result_2)
	# 		self.assertEqual(actual_result_3, expected_result_3)
	# 		self.assertEqual(actual_result_4, expected_result_4)
	# 		self.assertEqual(actual_result_5, expected_result_5)
	# 		self.assertEqual(actual_result_6, expected_result_6)
	# 	finally:
	# 		tab = [
	# 			["Actual:", actual_result_1, actual_result_2, actual_result_3, actual_result_4, actual_result_5, actual_result_6],
	# 			["Expected:", expected_result_1, expected_result_2, expected_result_3, expected_result_4, expected_result_5, expected_result_6]
	# 		]
	# 		print("\n")
	# 		print(inspect.currentframe().f_code.co_name)
	# 		print(tabulate(tab, headers='keys', tablefmt='rst'))

	@patch('cyan_flask.web_app_api.query_database')
	def test_load_user_locations(self, query_database_mock):
		example_db_user_result = [("test", "test@email.com", "test", datetime.datetime.now(), datetime.datetime.now())]
		example_location_obj = {"owner": "test", "id": None, "name": "", "latitude": None, "longitude": None, "marked": False, "notes": ""}
		example_location_db_result = ["test", None, "", None, None, False, ""]  # [owner, id, name, latitude, longitude, marked, notes]
		example_user_data_1 = {
			"user": {
				"username": "test",
				"email": "test@email.com"
			}, 
			"locations": [],
			"notifications": []
		}
		example_user_data_2 = {
			"user": {
				"username": "test",
				"email": "test@email.com"
			}, 
			"locations": [example_location_obj],
			"notifications": []
		}

		# Test case 1:
		query_database_mock.return_value = []  # no locations returned for user
		expected_result_1 = example_user_data_1, 200
		actual_result_1 = web_app_api.load_user_locations("test", example_db_user_result, [])
		# Test case 2:
		query_database_mock.return_value = [example_location_db_result]
		expected_result_2 = example_user_data_2, 200
		expected_result_2[0]['locations'][0]['notes'] = "[]"  # expecting this if location has no notes
		actual_result_2 = web_app_api.load_user_locations("test", example_db_user_result, [])
		# Test case 3:
		query_database_mock.return_value = [{"keyerror": "location"}]
		expected_result_3 = {"error": "Invalid key in database data"}, 200
		actual_result_3 = web_app_api.load_user_locations("test", example_db_user_result, [])
		# Test case 4:
		query_database_mock.return_value = []
		expected_result_4 = {"error": "Error getting user locations"}, 200
		actual_result_4 = web_app_api.load_user_locations("test", [("throws-general-exception",)], [])

		try:
			self.assertEqual(actual_result_1, expected_result_1)
			self.assertEqual(actual_result_2, expected_result_2)
			self.assertEqual(actual_result_3, expected_result_3)
			self.assertEqual(actual_result_4, expected_result_4)
		finally:
			tab = [
				["Actual:", actual_result_1, actual_result_2, actual_result_3, actual_result_4],
				["Expected:", expected_result_1, expected_result_2, expected_result_3, expected_result_4]
			]
			print("\n")
			print(inspect.currentframe().f_code.co_name)
			print(tabulate(tab, headers='keys', tablefmt='rst'))