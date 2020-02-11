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

	# @patch('cyan_flask.web_app_api.hash_password.hashlib.sha256')
	# def test_hash_password(self, salt_mock):
	# 	salt_mock.return_value = b'788dce3cfa121661ec06b3ae4bf1127c78a64535175b0752b3cd1de3f2ea92a6'
	# 	expected_result = '788dce3cfa121661ec06b3ae4bf1127c78a64535175b0752b3cd1de3f2ea92a6579b3b4337ea8f308b614b407bb14a89f8897b819cdba0338089a6c6e9bc93cd3fde25b7c1ed729dab14e4baa8593ecd97e0785981f5ed941635a2112e4ddf34'
	# 	actual_result = web_app_api.hash_password("password")
	# 	try:
	# 		self.assertEqual(actual_result, expected_result)
	# 	finally:
	# 		tab = [["Actual:", actual_result], ["Expected:", expected_result]]
	# 		print("\n")
	# 		print(inspect.currentframe().f_code.co_name)
	# 		print(tabulate(tab, headers='keys', tablefmt='rst'))