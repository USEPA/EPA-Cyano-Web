import unittest

# from unittest.mock import Mock, patch
import sys
import os
import datetime
import inspect
import requests
import logging
import json
from flask import Flask, current_app
from pathlib import Path
import platform
import runpy
import subprocess
import time
import flask_migrate

PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))

# Loads environment based on deployment location:
sys.path.insert(1, PROJECT_ROOT)
sys.path.insert(1, os.path.join(PROJECT_ROOT, "..", ".."))

# Local imports:
from config.set_environment import DeployEnv
from cyan_flask.build_db import DBHandler
from cyan_flask.app.endpoints import Register
from cyan_flask.app.auth import JwtHandler
from cyan_flask.app import app as app_instance
from cyan_flask import manage
from cyan_flask.crypt import CryptManager

crypt_manager = CryptManager()


class TestApiIntegration(unittest.TestCase):
    """
    Integration tests for testing API.
    """

    test_db_name = "test_cyan_web_app_db"  # use env var?
    test_db_user = "test_db_user"
    test_db_host = "localhost"
    test_db_pass = "testdbpass123"

    test_user = "test_user"
    test_user_email = "test@email.com"
    test_user_pass = "testapipass123"
    test_user_pass_new = "testapipass123new"

    request_timeout = 10

    base_url = "http://{}:{}/cyan/app/api/".format(
        os.environ.get("FLASK_HOST"), os.environ.get("FLASK_PORT")
    )

    json_header = {"Content-Type": "application/json"}

    test_token = None

    test_datatype = 1
    test_id = 1
    test_location_obj = {
        "owner": test_user,
        "id": test_id,
        "type": test_datatype,
        "name": "Test Location Name",
        "latitude": 27.117601,
        "longitude": -80.775604,
        "marked": False,
        "compare": "",
        "notes": "",
    }
    test_comment_obj = {
        "id": 1,
        "title": "Test comment title.",
        "date": "2015-11-05 20:08:53",
        "username": test_user,
        "device": "Some operating system.",
        "browser": "Some browser.",
        "comment_text": "This is a test comment.",
        "comment_images": [
            {"name": "testimage.png", "source": "base64bytestringimage"}
        ],
        "replies": [],
    }
    test_reply_obj = {
        "comment_id": test_comment_obj["id"],
        "comment_user": test_user,
        "date": test_comment_obj["date"],
        "reply_user": test_user,
        "body": "This is a test reply.",
    }

    def _get_db_pass(self):
        return crypt_manager.decrypt_message(
            crypt_manager.get_key(), os.environ.get("DB_ROOT_PASS")
        )

    def _set_env(self):
        """
        Sets up runtime environment.
        """
        runtime_env = DeployEnv()
        runtime_env.load_deployment_environment()  # sets environment

        self.test_db_host = os.environ.get("DB_HOST", "localhost")

        current_env = dict(os.environ.copy())
        current_env.update(
            {
                "DB_NAME": self.test_db_name,
                "DB_USER": self.test_db_user,
                "DB_HOST": self.test_db_host,
            }
        )
        os.environ.update(current_env)  # updates environment with test values
        app_instance.config.update(
            TESTING=True,
            SQLALCHEMY_DATABASE_URI="mysql://{}:{}@{}/{}".format(
                "root", self._get_db_pass(), self.test_db_host, self.test_db_name
            ),
        )  # updates flask config with test values
        print("Current environment: {}".format(os.environ))

    def _setup_db(self):
        """
        Creates test database and tables.
        """
        if not self._get_db_pass():
            raise Exception("DB_ROOT_PASS must be set to execute integration tests.")

        db_handler = DBHandler(self.test_db_name, self._get_db_pass())
        attempts, max_retries = 0, 20

        while attempts < max_retries:
            try:
                db_handler.create_database()
                break
            except Exception as e:
                print(
                    "Exception creating test database: {}... Retrying connection...".format(
                        e
                    )
                )
                time.sleep(2)
                attempts += 1

        with app_instance.app_context():
            flask_migrate.upgrade()

        db_handler = DBHandler(self.test_db_name, self._get_db_pass())
        db_handler.create_user(self.test_db_user, self.test_db_pass, self.test_db_host)

    def _teardown_db(self):
        """
        Drops test database and tables, drops test user.
        """
        try:
            db_handler = DBHandler(self.test_db_name, self._get_db_pass())
            db_handler.delete_database()
            db_handler.delete_user(self.test_db_user, self.test_db_host)
        except Exception as e:
            logging.warning("Exception tearing down db: {}".format(e))
            return

    def _get_auth_headers(self):
        return {
            "Access-Control-Expose-Headers": "Authorization",
            "Access-Control-Allow-Headers": "Authorization",
            "Authorization": "Bearer {}".format(self.test_token),
            "Content-Type": "application/json",
            "Origin": os.getenv("HTTP_DOMAIN", ""),
            "App-Name": "Cyanweb",
        }

    def _make_request(self, url, data, headers):
        """
        Makes http request.
        """
        if not data:
            response = requests.get(url, timeout=self.request_timeout)
        else:
            response = requests.post(
                url,
                data=json.dumps(data),
                headers=headers,
                timeout=self.request_timeout,
            )
        results = json.loads(response.content)
        return results

    def _parse_reply_obj(self, reply_obj):
        reply_obj["username"] = reply_obj.pop("reply_user", self.test_user)
        del reply_obj["comment_user"]
        reply_obj["id"] = 1
        return reply_obj

    def register_user(self):
        """
        Registers test user.
        """
        print("~~~ Running test for registering user.")
        url = "/cyan/app/api/user/register"
        post_data = {
            "user": self.test_user,
            "email": self.test_user_email,
            "password": self.test_user_pass,
        }
        expected_response = {
            "status": "success",
            "username": self.test_user,
            "email": self.test_user_email,
        }
        with app_instance.test_client() as c:
            actual_response = c.post(
                url, json=post_data, headers=self._get_auth_headers()
            ).get_json()
            self.assertEqual(actual_response, expected_response)

    def login_user(self):
        """
        Logs test user in.
        """
        print("~~~ Running test for logging user in.")
        url = "/cyan/app/api/user"
        post_data = {
            "user": self.test_user,
            "dataType": self.test_datatype,
            "password": self.test_user_pass,
        }
        expected_response = {
            "user": {
                "username": self.test_user,
                "email": self.test_user_email,
                "auth_token": "",
            },
            "locations": [],
            "notifications": [],
            "settings": {
                "level_low": 100000,
                "level_medium": 300000,
                "level_high": 1000000,
                "enable_alert": False,
                "alert_value": 1000000,
            },
        }
        with app_instance.test_client() as c:
            actual_response = c.post(
                url, json=post_data, headers=self._get_auth_headers()
            ).get_json()
            self.test_token = actual_response["user"][
                "auth_token"
            ]  # sets auth token for subsequent requests
            expected_response["user"]["auth_token"] = self.test_token
            self.assertEqual(actual_response["user"], expected_response["user"])

    def add_location(self):
        """
        Adds a location.
        Calls /location/add endpoint.
        """
        print("~~~ Running test for adding location.")
        url = "/cyan/app/api/location/add"
        post_data = dict(self.test_location_obj)
        expected_response = {"status": "success"}
        with app_instance.test_client() as c:
            actual_response = c.post(
                url, json=post_data, headers=self._get_auth_headers()
            ).get_json()
            self.assertEqual(actual_response, expected_response)

    def edit_location(self):
        """
        Edits a location.
        """
        print("~~~ Running test for editing location.")
        url = "/cyan/app/api/location/edit"
        post_data = dict(self.test_location_obj)
        post_data["marked"] = False
        post_data["name"] = "Edited Test Location Name"
        expected_response = {"status": "success"}
        with app_instance.test_client() as c:
            actual_response = c.post(
                url, json=post_data, headers=self._get_auth_headers()
            ).get_json()
            self.assertEqual(actual_response, expected_response)

    def delete_location(self):
        """
        Deletes a location.
        """
        print("~~~ Running test for deleting location.")
        url = "/cyan/app/api/location/delete/{}".format(self.test_location_obj["id"])
        expected_response = {"status": "success"}
        with app_instance.test_client() as c:
            actual_response = c.get(url, headers=self._get_auth_headers()).get_json()
            self.assertEqual(actual_response, expected_response)

    def refresh_token(self):
        """
        Tests refresh token functionality.
        """
        print("~~~ Running test for refreshing token.")
        url = "/cyan/app/api/refresh"
        expected_response = {"status": "success"}
        with app_instance.test_client() as c:
            actual_response = c.get(url, headers=self._get_auth_headers()).get_json()
            self.assertEqual(actual_response, expected_response)

    def reset_password_request(self):
        """
        Tests reset password request (using SMTP) functionality.
        """
        print("~~~ Running test for making reset password request.")
        url = "/cyan/app/api/reset"
        post_data = {"email": self.test_user_email}
        expected_response = {"status": "Email sent to {}".format(self.test_user_email)}
        with app_instance.test_client() as c:
            actual_response = c.post(
                url, json=post_data, headers=self._get_auth_headers()
            ).get_json()
            self.assertEqual(actual_response, expected_response)

    def reset_password_update(self):
        """
        Tests reset password endpoint"s new password update functionality.
        """
        print(
            "~~~ Running test for updating new password after password reset request."
        )
        token_handler = JwtHandler()
        self.test_token = token_handler.encode_auth_token(self.test_user_email).decode(
            "utf-8"
        )  # sets token using "email" for password update endpoint
        url = "/cyan/app/api/reset"
        post_data = {
            "email": self.test_user_email,
            "newPassword": self.test_user_pass_new,
        }
        expected_response = {"status": "success"}
        with app_instance.test_client() as c:
            actual_response = c.put(
                url, json=post_data, headers=self._get_auth_headers()
            ).get_json()
            self.assertEqual(actual_response, expected_response)

    def add_comment(self):
        """
        Tests add comment functionality.
        """
        print("~~~ Running test for adding comment.")
        url = "/cyan/app/api/comment"
        token_handler = JwtHandler()
        self.test_token = token_handler.encode_auth_token(self.test_user).decode(
            "utf-8"
        )
        expected_response = dict(self.test_comment_obj)  # Update with test comment
        expected_response["comment_images"] = [
            expected_response["comment_images"][0]["source"]
        ]
        with app_instance.test_client() as c:
            actual_response = c.post(
                url, json=self.test_comment_obj, headers=self._get_auth_headers()
            ).get_json()
            self.assertEqual(actual_response, expected_response)

    def add_reply(self):
        """
        Tests add reply functionality.
        """
        print("~~~ Running test for adding reply.")
        url = "/cyan/app/api/reply"
        expected_response = self._parse_reply_obj(dict(self.test_reply_obj))
        with app_instance.test_client() as c:
            actual_response = c.post(
                url, json=self.test_reply_obj, headers=self._get_auth_headers()
            ).get_json()
            self.assertEqual(actual_response, expected_response)

    def get_comments(self):
        """
        Tests get comments functionality.
        """
        print("~~~ Running test for getting comments.")
        url = "/cyan/app/api/comment"
        expected_response = [dict(self.test_comment_obj)]
        expected_response[0]["replies"] = [
            self._parse_reply_obj(dict(self.test_reply_obj))
        ]
        expected_response[0]["comment_images"] = [
            self.test_comment_obj["comment_images"][0]["source"]
        ]
        with app_instance.test_client() as c:
            actual_response = c.get(url, headers=self._get_auth_headers()).get_json()
            self.assertEqual(actual_response, expected_response)

    def test_api_integration(self):
        """
        Runs integration tests in order.
        """
        print("*** Setting environment.")
        self._set_env()
        print("*** Tear down any existing test database and test user.")
        self._teardown_db()
        print("*** Setting up test database.")
        self._setup_db()
        print("*** Testing user registration.")
        self.register_user()
        print("*** Testing user login.")
        self.login_user()
        print("*** Testing adding a location.")
        self.add_location()
        print("*** Testing editing a location.")
        self.edit_location()
        print("*** Testing deleting a location.")
        self.delete_location()
        print("*** Testing token refresh.")
        self.refresh_token()
        print("*** Testing reset user password request.")
        self.reset_password_request()
        print("*** Testing new password update post-reset.")
        self.reset_password_update()
        print("*** Testing add comment feature.")
        self.add_comment()
        print("*** Testing add reply feature.")
        self.add_reply()
        print("*** Testing comments query.")
        self.get_comments()
        print("*** Removing test database and test user.")
        self._teardown_db()
