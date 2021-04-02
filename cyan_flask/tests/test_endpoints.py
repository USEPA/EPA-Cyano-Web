import unittest
from unittest.mock import Mock, patch
import sys
import os
import datetime
import inspect
import requests
import random
import string
import flask

script_path = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(
    1, os.path.join(script_path, "..", "..")
)  # adds EPA-Cyano-Web project to sys.path

# Local imports:
from config.set_environment import DeployEnv
from cyan_flask.app import endpoints, auth

# Sets up runtime environment:
runtime_env = DeployEnv()
runtime_env.load_deployment_environment()

app = flask.Flask(__name__)
app.testing = True


def create_test_token(user):
    return auth.JwtHandler().encode_auth_token(user).decode("utf-8")


def create_test_headers(token):
    return {
        "Access-Control-Expose-Headers": "Authorization",
        "Access-Control-Allow-Headers": "Authorization",
        "Authorization": "Bearer {}".format(token),
    }


class TestEndpoints(unittest.TestCase):
    """
    Unit test class for app.py module, which is the Flask app
    that defines the API endpoints.
    """

    print(
        "cyan_flask endpoints.py unittests conducted at "
        + str(datetime.datetime.today())
    )

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

    # @patch("cyan_flask.app.endpoints.web_app_api.register_user")
    # @patch("cyan_flask.app.endpoints.Register.parser.parse_args")
    # def test_register_post(self, parse_args_mock, register_user_mock):
    @patch("cyan_flask.app.endpoints.web_app_api.register_user")
    def test_register_post(self, register_user_mock):
        """
        Tests Register endpoint POST request.
        """
        test_request = {"user": "test", "password": "test", "email": "test@email.com"}
        expected_result_user_created = (
            {"status": "success", "username": "test", "email": "test@email.com"},
            200,
        )
        with app.test_request_context(json=test_request) as client:
            client.request.data = test_request
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

    @patch("cyan_flask.app.endpoints.web_app_api.login_user")
    def test_login_post(self, reqister_user_mock):
        """
        Tests Login endpoint POST request.
        """
        test_request = {"user": "test", "password": "test", "dataType": 1}
        expected_result = test_request, 200
        with app.test_request_context() as client:
            reqister_user_mock.return_value = test_request, 200
            actual_result_1 = endpoints.Login().post()
            self.assertEqual(actual_result_1, expected_result)

    def test_add_location_get(self):
        """
        Tests AddLocation endpoint GET request.
        """
        expected_result = {"status": "location endpoint"}
        actual_result = endpoints.AddLocation().get()
        self.assertEqual(actual_result, expected_result)

    @patch("cyan_flask.app.endpoints.web_app_api.add_location")
    def test_add_location_post(self, add_user_mock):
        """
        Tests AddLocation endpoint POST request.
        """
        user = "test"
        test_token = create_test_token(user)
        headers = create_test_headers(test_token)
        request_obj = {"owner": user}
        add_user_mock.return_value = [], 200
        with app.test_request_context(json=request_obj) as client:
            client.request.headers = dict(headers)
            client.request.headers["authorization"] = "Bearer {}".format(
                test_token
            )  # NOTE: upper vs lower cases here, resolve this.}
            client.request.data = request_obj
            expected_result = [], 200, headers
            actual_result = endpoints.AddLocation().post()
            self.assertEqual(actual_result[0], expected_result[0])

    def test_edit_location_get(self):
        """
        Tests EditLocation endpoint GET request.
        """
        expected_result = {"status": "edit location endpoint"}
        actual_result = endpoints.EditLocation().get()
        self.assertEqual(actual_result, expected_result)

    @patch("cyan_flask.app.endpoints.web_app_api.edit_location")
    def test_edit_location_post(self, edit_location_mock):
        """
        Tests EditLocation endpoint POST request.
        """
        user = "test"
        test_token = create_test_token(user)
        headers = create_test_headers(test_token)
        api_response = {"status": "success"}, 200
        request_obj = {"owner": user}
        edit_location_mock.return_value = api_response
        with app.test_request_context(json=request_obj) as client:
            client.request.headers = dict(headers)
            client.request.headers["authorization"] = "Bearer {}".format(
                test_token
            )  # NOTE: upper vs lower cases here, resolve this.}
            client.request.data = request_obj
            expected_result = api_response
            actual_result = endpoints.EditLocation().post()
            self.assertEqual(actual_result[0], expected_result[0])

    @patch("cyan_flask.app.endpoints.web_app_api.delete_location")
    def test_delete_location_get(self, delete_location_mock):
        """
        Tests DeleteLocation endpoint GET request.
        """
        user = "test"
        _id = 1
        _type = 1
        test_token = create_test_token(user)
        headers = create_test_headers(test_token)
        api_response = {"status": "success"}, 200
        delete_location_mock.return_value = api_response
        with app.test_request_context() as client:
            client.request.headers = dict(headers)
            client.request.headers["authorization"] = "Bearer {}".format(
                test_token
            )  # NOTE: upper vs lower cases here, resolve this.}
            expected_result = api_response
            actual_result = endpoints.DeleteLocation().get(_id, _type)
            self.assertEqual(actual_result[0], expected_result[0])

    @patch("cyan_flask.app.endpoints.web_app_api.get_user_locations")
    def test_get_user_locations_get(self, get_user_locations_mock):
        """
        Tests GetUserLocations endpoint GET request.
        """
        user = "test"
        _type = 1
        test_token = create_test_token(user)
        headers = create_test_headers(test_token)
        get_user_locations_mock.return_value = []
        with app.test_request_context() as client:
            client.request.headers = dict(headers)
            client.request.headers["authorization"] = "Bearer {}".format(
                test_token
            )  # NOTE: upper vs lower cases here, resolve this.}
            expected_result = [], 200, headers
            actual_result = endpoints.GetUserLocations().get(_type)
            self.assertEqual(actual_result[0], expected_result[0])

    @patch("cyan_flask.app.endpoints.web_app_api.get_location")
    def test_get_location_get(self, get_location_mock):
        """
        Tests GetLocation endpoint GET request.
        """
        user = "test"
        _id = 1
        _type = 1
        test_token = create_test_token(user)
        headers = create_test_headers(test_token)
        get_location_mock.return_value = [], 200
        with app.test_request_context() as client:
            client.request.headers = dict(headers)
            client.request.headers["authorization"] = "Bearer {}".format(
                test_token
            )  # NOTE: upper vs lower cases here, resolve this.}
            expected_result = [], 200, headers
            actual_result = endpoints.GetLocation().get(_id, _type)
            self.assertEqual(actual_result[0], expected_result[0])

    @patch("cyan_flask.app.endpoints.web_app_api.edit_notifications")
    def test_edit_notification_get(self, edit_notifications_mock):
        """
        Tests EditNotification endpoint GET request.
        """
        user = "test"
        _id = 1
        test_token = create_test_token(user)
        headers = create_test_headers(test_token)
        edit_notifications_mock.return_value = {"status": "success"}, 200
        with app.test_request_context() as client:
            client.request.headers = dict(headers)
            client.request.headers["authorization"] = "Bearer {}".format(
                test_token
            )  # NOTE: upper vs lower cases here, resolve this.}
            expected_result = {"status": "success"}, 200, headers
            actual_result = endpoints.EditNotification().get(_id)
            self.assertEqual(actual_result[0], expected_result[0])

    @patch("cyan_flask.app.endpoints.web_app_api.delete_notifications")
    def test_delete_notification_get(self, delete_notifications_mock):
        """
        Tests DeleteNotification endpoint GET request.
        """
        user = "test"
        test_token = create_test_token(user)
        headers = create_test_headers(test_token)
        delete_notifications_mock.return_value = {"status": "success"}, 200
        with app.test_request_context() as client:
            client.request.headers = dict(headers)
            client.request.headers["authorization"] = "Bearer {}".format(
                test_token
            )  # NOTE: upper vs lower cases here, resolve this.}
            expected_result = {"status": "success"}, 200, headers
            actual_result = endpoints.DeleteNotification().get()
            self.assertEqual(actual_result[0], expected_result[0])

    def test_edit_settings_get(self):
        """
        Tests EditSettings endpoint GET request.
        """
        expected_result = {"status": "edit settings endpoint"}
        actual_result = endpoints.EditSettings().get()
        self.assertEqual(actual_result, expected_result)

    @patch("cyan_flask.app.endpoints.web_app_api.edit_settings")
    def test_edit_settings_post(self, edit_settings_mock):
        """
        Tests EditSettings endpoint GET request.
        """
        user = "test"
        test_token = create_test_token(user)
        headers = create_test_headers(test_token)
        request_obj = {"owner": user}
        edit_settings_mock.return_value = {"status": "success"}, 200
        with app.test_request_context(json=request_obj) as client:
            client.request.headers = dict(headers)
            client.request.headers["authorization"] = "Bearer {}".format(
                test_token
            )  # NOTE: upper vs lower cases here, resolve this.}
            expected_result = {"status": "success"}, 200, headers
            actual_result = endpoints.EditSettings().post()
            self.assertEqual(actual_result[0], expected_result[0])

    def test_refresh_get(self):
        """
        Tests Refresh endpoint GET request.
        """
        user = "test"
        test_token = create_test_token(user)
        headers = create_test_headers(test_token)
        with app.test_request_context() as client:
            client.request.headers = dict(headers)
            client.request.headers["authorization"] = "Bearer {}".format(
                test_token
            )  # NOTE: upper vs lower cases here, resolve this.}
            expected_result = {"status": "success"}, 200, headers
            actual_result = endpoints.Refresh().get()
            self.assertEqual(actual_result[0], expected_result[0])

    @patch("cyan_flask.app.endpoints.web_app_api.reset_password")
    def test_reset_post(self, reset_password_mock):
        """
        Tests Reset endpoint POST request.
        """
        user = "test"
        request_obj = {"owner": user, "email": "test@test.com"}
        reset_password_mock.return_value = {"status": "success"}, 200
        with app.test_request_context(json=request_obj) as client:
            expected_result = {"status": "success"}, 200
            actual_result = endpoints.Reset().post()
            self.assertEqual(actual_result[0], expected_result[0])

    @patch("cyan_flask.app.endpoints.web_app_api.set_new_password")
    def test_reset_put(self, set_new_password_mock):
        """
        Tests Reset endpoint PUT request.
        """
        user = "test"
        test_token = create_test_token(user)
        headers = create_test_headers(test_token)
        request_obj = {"owner": user, "newPassword": "password123"}
        set_new_password_mock.return_value = {"status": "success"}, 200
        with app.test_request_context(json=request_obj) as client:
            client.request.headers = dict(headers)
            client.request.headers["authorization"] = "Bearer {}".format(
                test_token
            )  # NOTE: upper vs lower cases here, resolve this.}
            expected_result = {"status": "success"}, 200, headers
            actual_result = endpoints.Reset().put()
            self.assertEqual(actual_result[0], expected_result[0])

    @patch("cyan_flask.app.endpoints.web_app_api.get_comments")
    def test_comment_get(self, get_comments_mock):
        """
        Tests Comment endpoint GET request.
        """
        user = "test"
        test_token = create_test_token(user)
        headers = create_test_headers(test_token)
        get_comments_mock.return_value = [], 200
        with app.test_request_context() as client:
            client.request.headers = dict(headers)
            client.request.headers["authorization"] = "Bearer {}".format(
                test_token
            )  # NOTE: upper vs lower cases here, resolve this.}
            expected_result = [], 200, headers
            actual_result = endpoints.Comment().get()
            self.assertEqual(actual_result[0], expected_result[0])

    @patch("cyan_flask.app.endpoints.web_app_api.add_user_comment")
    def test_comment_post(self, add_user_comment_mock):
        """
        Tests Comment endpoint POST request.
        """
        user = "test"
        test_token = create_test_token(user)
        headers = create_test_headers(test_token)
        request_obj = {"username": user}
        add_user_comment_mock.return_value = [], 200
        with app.test_request_context(json=request_obj) as client:
            client.request.headers = dict(headers)
            client.request.headers["authorization"] = "Bearer {}".format(
                test_token
            )  # NOTE: upper vs lower cases here, resolve this.}
            expected_result = [], 200, headers
            actual_result = endpoints.Comment().post()
            self.assertEqual(actual_result[0], expected_result[0])

    def test_reply_get(self):
        """
        Tests Reply endpoint GET request.
        """
        expected_result = {"status": "reply endpoint"}
        actual_result = endpoints.Reply().get()
        self.assertEqual(actual_result, expected_result)

    @patch("cyan_flask.app.endpoints.web_app_api.add_comment_reply")
    def test_reply_post(self, add_comment_reply_mock):
        """
        Tests Reply endpoint POST request.
        """
        user = "test"
        test_token = create_test_token(user)
        headers = create_test_headers(test_token)
        request_obj = {"username": user}
        add_comment_reply_mock.return_value = [], 200
        with app.test_request_context(json=request_obj) as client:
            client.request.headers = dict(headers)
            client.request.headers["authorization"] = "Bearer {}".format(
                test_token
            )  # NOTE: upper vs lower cases here, resolve this.}
            expected_result = [], 200, headers
            actual_result = endpoints.Reply().post()
            self.assertEqual(actual_result[0], expected_result[0])
