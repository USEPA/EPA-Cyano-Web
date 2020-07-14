import unittest
from unittest.mock import Mock, patch
import sys
import os
import datetime
import inspect
import flask
import time
from pathlib import Path

# Loads environment based on deployment location:
script_path = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(script_path, '..', '..'))  # adds EPA-Cyano-Web project to sys.path

# Local imports:
from config.set_environment import DeployEnv
from cyan_flask.app.middleware import _check_for_refresh, login_required
from cyan_flask.app.auth import JwtHandler

# Sets up runtime environment:
runtime_env = DeployEnv()
runtime_env.load_deployment_environment()

jwt_handler = JwtHandler()

app = flask.Flask(__name__)
app.testing = True



class TestAuth(unittest.TestCase):
	"""
	Unit test class for web_app_api.py module, which is the Flask app
	that defines the API endpoints.
	"""

	print("cyan_flask middleware.py unittests conducted at " + str(datetime.datetime.today()))

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

	def create_test_token(self, user):
		token = jwt_handler.encode_auth_token(user).decode('utf-8')
		token_obj = jwt_handler.decode_auth_token(token)
		return token, token_obj

	def test__check_for_refresh(self):
		"""
		Test _check_for_refresh.
		"""
		user = "test"
		token, token_obj = self.create_test_token(user)
		expected_result = token.encode()  # str -> bytes
		actual_result = _check_for_refresh(token_obj)
		self.assertEqual(actual_result, expected_result)
