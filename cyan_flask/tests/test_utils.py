import unittest
from unittest.mock import Mock, patch
import sys
import os
import datetime
import inspect
from tabulate import tabulate
import requests
from flask import Response
import time

# Loads environment based on deployment location:
script_path = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(script_path, '..', '..'))  # adds EPA-Cyano-Web project to sys.path

# Local imports:
from config.set_environment import DeployEnv
from cyan_flask.app import utils
from cyan_flask.app.models import Comment, Reply, CommentBody, CommentImages

# Sets up runtime environment:
runtime_env = DeployEnv()
runtime_env.load_deployment_environment()



class TestAuth(unittest.TestCase):
	"""
	Unit test class for web_app_api.py module, which is the Flask app
	that defines the API endpoints.
	"""

	print("cyan_flask utils.py unittests conducted at " + str(datetime.datetime.today()))

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

	def test_convert_to_timestamp(self):
		"""
		convert_to_timestamp
		"""
		unix_time = 1446772133000  # example timestamp from notifications endpoint

		expected_result = '2015-11-05 20:08:53'
		actual_result = utils.convert_to_timestamp(unix_time)

		self.assertEqual(actual_result, expected_result)

	def test_convert_to_unix(self):
		"""
		convert_to_unix
		"""
		unix_time = 1446772133
		timestamp = '2015-11-05 20:08:53'

		expected_result = unix_time
		actual_result = utils.convert_to_unix(timestamp)

		self.assertEqual(actual_result, expected_result)

	# @patch('cyan_flask.app.utils.requests.get')
	def test_make_notifications_request(self):
		"""
		make_notifications_request
		"""
		latest_time = time.time()
		notifications_response = """
		[
			{
			    "id": 1,
			    "subject": "Hello hello...",
			    "message": "Can anyone hear me?",
			    "dateSent": 1446772133000,
			    "image": {
			        "name": "epa-logo.png",
			        "width": 72,
			        "height": 72,
			        "format": "PNG",
			        "thumb": false
			    }
			}
		]
		"""

		actual_result = utils.make_notifications_request(latest_time)

		self.assertIsInstance(actual_result, list)

	@patch('cyan_flask.app.utils.build_replies_json')
	@patch('cyan_flask.app.utils.build_comment_body_json')
	def test_build_comments_json(self, build_comment_body_json_mock, build_replies_json_mock):
		"""
		build_comments_json
		"""
		comment_json = {
			'id': None,
			'title': "test title",
			'date': str(datetime.datetime.now()).split('.')[0],
			'username': "test",
			'device': "N/A",
			'browser': "N/A",
			'body': {},
			'replies': []
		}
		comment_obj = Comment(
			title=comment_json['title'],
			date=comment_json['date'],
			username=comment_json['username'],
			device=comment_json['device'],
			browser=comment_json['browser'],
		)

		build_comment_body_json_mock\
			.return_value = {}

		build_replies_json_mock\
			.return_value = []

		expected_result = [comment_json]
		actual_result = utils.build_comments_json([comment_obj])

		self.assertEqual(actual_result, expected_result)

	def test_build_replies_json(self):
		"""
		build_replies_json
		"""
		reply = Reply(
			id=1,
			comment_id=1,
			date=str(datetime.datetime.now()).split('.')[0],
			username="test",
			body="test reply body"
		)
		replies = [{
			'id': reply.id,
			'comment_id': reply.comment_id,
			'date': reply.date,
			'username': reply.username,
			'body': reply.body
		}]

		expected_result = replies
		actual_result = utils.build_replies_json([reply])

		self.assertEqual(actual_result, expected_result)

	def test_build_comment_body_json(self):
		"""
		build_comment_body_json
		"""
		comment_images = CommentImages(
			comment_image="test image filename"
		)
		comment_images_json = {
			'comment_image': comment_images.comment_image
		}

		comment_body = CommentBody(
			comment_text="test comment text",
			comment_images=[comment_images]
		)
		comment_body_json = {
			'comment_text': comment_body.comment_text,
			'comment_images': [comment_images_json['comment_image']]
		}

		expected_result = comment_body_json
		actual_result = utils.build_comment_body_json(comment_body)

		self.assertEqual(actual_result, expected_result)

	def test_get_datetime_string(self):
		"""
		get_datetime_string
		"""
		datetime_obj = datetime.datetime.now()
		datetime_str = str(datetime_obj)

		expected_result = datetime_str.split('.')[0]
		actual_result = utils.get_datetime_string(datetime_obj)

		self.assertEqual(actual_result, expected_result)