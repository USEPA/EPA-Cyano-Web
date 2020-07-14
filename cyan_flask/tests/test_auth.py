import unittest
from unittest.mock import Mock, patch
import sys
import os
import datetime
import inspect
from tabulate import tabulate
import requests
from flask import Response

# Loads environment based on deployment location:
script_path = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(script_path, '..', '..'))  # adds EPA-Cyano-Web project to sys.path

# Local imports:
from config.set_environment import DeployEnv
from cyan_flask.app.auth import PasswordHandler, JwtHandler

# Sets up runtime environment:
runtime_env = DeployEnv()
runtime_env.load_deployment_environment()



class TestAuth(unittest.TestCase):
	"""
	Unit test class for web_app_api.py module, which is the Flask app
	that defines the API endpoints.
	"""

	print("cyan_flask auth.py unittests conducted at " + str(datetime.datetime.today()))

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

	@patch('cyan_flask.app.auth.PasswordHandler._create_reset_link')
	def test__create_email_message(self, password_handler_mock):
		"""
		_create_email_message
		"""
		server_email = "test@smtp.com"
		user_email = "test@email.com"
		subject = "Password reset for Cyano Web"
		test_reset_link = os.environ.get('HOST_DOMAIN') + "/reset?token=somerandomtokenvalue"

		password_handler_mock\
			.return_value = test_reset_link

		expected_result = "\r\n".join([
		  "From: {}".format(server_email),
		  "To: {}".format(user_email),
		  "Subject: {}".format(subject),
		  "",
		  "Follow link to reset password: {}".format(test_reset_link)
		])

		actual_result = PasswordHandler()._create_email_message(server_email, user_email)

		self.assertEqual(actual_result, expected_result)

	@patch('cyan_flask.app.auth.JwtHandler.encode_auth_token')
	def test__create_reset_link(self, encode_auth_token_mock):
		"""
		_create_reset_link
		"""
		user_email = "test@email.com"
		test_reset_link = os.environ.get('HOST_DOMAIN') + "/reset?token=somerandomtokenvalue"

		encode_auth_token_mock\
			.return_value = "somerandomtokenvalue".encode()

		expected_result = test_reset_link
		actual_result = PasswordHandler()._create_reset_link(user_email)

		self.assertEqual(actual_result, expected_result)

	@patch('cyan_flask.app.auth.smtplib.SMTP_SSL')
	def test__send_mail_1(self, smtp_mock):
		"""
		_send_mail
		"""
		smtp_email = "test@smtp.com"
		smtp_pass = "testpass"
		user_email = "test@email.com"
		subject = "Password reset for Cyano Web"
		test_reset_link = os.environ.get('HOST_DOMAIN') + "/reset?token=somerandomtokenvalue"
		msg = "\r\n".join([
		  "From: {}".format(smtp_email),
		  "To: {}".format(user_email),
		  "Subject: {}".format(subject),
		  "",
		  "Follow link to reset password: {}".format(test_reset_link)
		])

		expected_result = {"success": "Email sent."}
		actual_result = PasswordHandler()._send_mail(smtp_email, smtp_pass, user_email, msg)

		self.assertEqual(actual_result, expected_result)

	def test__send_mail_2(self):
		"""
		_send_mail
		"""
		smtp_email = "test@smtp.com"
		smtp_pass = "testpass"
		user_email = "test@email.com"
		subject = "Password reset for Cyano Web"
		test_reset_link = os.environ.get('HOST_DOMAIN') + "/reset?token=somerandomtokenvalue"
		msg = "\r\n".join([
		  "From: {}".format(smtp_email),
		  "To: {}".format(user_email),
		  "Subject: {}".format(subject),
		  "",
		  "Follow link to reset password: {}".format(test_reset_link)
		])

		expected_result = {"error": "Unable to send email."}
		actual_result = PasswordHandler()._send_mail(smtp_email, smtp_pass, user_email, msg)

		self.assertEqual(actual_result, expected_result)

	def test__handle_config_password(self):
		"""
		_handle_config_password
		"""
		smtp_pass = "testpass"
		smtp_pass_obscured = 'eNorSS0uKUgsLgYAD50DeA=='

		expected_result = smtp_pass
		actual_result = PasswordHandler()._handle_config_password(smtp_pass_obscured)

		self.assertEqual(actual_result, expected_result)

	@patch('cyan_flask.app.auth.hashlib.sha256')
	def test_hash_password(self, salt_mock):
		"""
		hash_password
		"""
		test_pass = "testpass"
		test_salt = b'57f2503ff578a334cc7de42a6270ee7a762a543c49ff286f1807ef791171daac'

		salt_mock\
			.return_value.hexdigest\
			.return_value.encode\
			.return_value = test_salt

		expected_result = '57f2503ff578a334cc7de42a6270ee7a762a543c49ff286f1807ef791171daac697900f85f1cfa8102863a3125cbe3fa437827732e2f3d4e1e8f5459af10bd8c30cef0c10c714863994eac2790e21e87971fac85fddbb3311c528ce4fa67c9b3'
		actual_result = PasswordHandler().hash_password(test_pass)

		self.assertEqual(actual_result, expected_result)

	def test_test_password(self):
		"""
		test_password
		"""
		test_pass = "testpass"
		test_salt = b'57f2503ff578a334cc7de42a6270ee7a762a543c49ff286f1807ef791171daac'
		salted_password = '57f2503ff578a334cc7de42a6270ee7a762a543c49ff286f1807ef791171daac697900f85f1cfa8102863a3125cbe3fa437827732e2f3d4e1e8f5459af10bd8c30cef0c10c714863994eac2790e21e87971fac85fddbb3311c528ce4fa67c9b3'
		
		expected_result = True
		actual_result = PasswordHandler().test_password(salted_password, test_pass)

		self.assertEqual(actual_result, expected_result)

	@patch('cyan_flask.app.auth.PasswordHandler._send_mail')
	@patch('cyan_flask.app.auth.PasswordHandler._create_email_message')
	@patch('cyan_flask.app.auth.PasswordHandler._handle_config_password')
	def test_send_password_reset_email(self, _handle_config_password_mock, _create_email_message_mock, _send_mail_mock):
		"""
		send_password_reset_email
		"""
		request_obj = {
			'user_email': "test@email.com"
		}
		email_response = {"success": "Email sent."}

		_send_mail_mock\
			.return_value = email_response

		expected_result = email_response
		actual_result = PasswordHandler().send_password_reset_email(request_obj)

		self.assertEqual(actual_result, expected_result)

	def test_encode_auth_token(self):
		"""
		encode_auth_token
		"""
		user = "test"

		actual_result = JwtHandler().encode_auth_token(user)

		self.assertIsInstance(actual_result, bytes)
		self.assertEqual(len(actual_result), 145)

	def test_decode_auth_token(self):
		"""
		decode_auth_token
		"""
		user = "test"

		token = JwtHandler().encode_auth_token(user)
		actual_result = JwtHandler().decode_auth_token(token)

		self.assertEqual(actual_result['sub'], user)

	@patch('cyan_flask.app.auth.time.time')
	def test_check_time_delta(self, time_mock):
		"""
		check_time_delta
		"""
		token_expiry = 1592964121.4339767

		time_mock\
			.return_value = token_expiry

		expected_result = 0
		actual_result = JwtHandler().check_time_delta(token_expiry)

		self.assertEqual(actual_result, expected_result)

	def test_get_user_from_token_1(self):
		"""
		get_user_from_token
		"""
		user = "test"
		token = "Bearer " + JwtHandler().encode_auth_token(user).decode()
		request = Response()
		request.headers = {}

		expected_result = None
		actual_result = JwtHandler().get_user_from_token(request)

		self.assertEqual(actual_result, expected_result)

	def test_get_user_from_token_2(self):
		"""
		get_user_from_token
		"""
		user = "test"
		token = "Bearer " + JwtHandler().encode_auth_token(user).decode()
		request = Response()
		request.headers = {
			'Authorization': token
		}

		expected_result = user
		actual_result = JwtHandler().get_user_from_token(request)

		self.assertEqual(actual_result, expected_result)

	def test_get_user_token(self):
		"""
		get_user_token
		"""
		os.environ.setdefault('SECRET_KEY', "testsecret")
		user = "test"
		token = JwtHandler().encode_auth_token(user).decode()
		request = Response()
		request.headers = {
			'Authorization': 'Bearer ' + token
		}

		expected_result = JwtHandler().decode_auth_token(token)
		actual_result = JwtHandler().get_user_token(request)

		self.assertEqual(actual_result, expected_result)