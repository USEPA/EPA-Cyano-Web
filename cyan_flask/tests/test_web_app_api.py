import unittest
from unittest.mock import Mock, patch
import sys
import os
import datetime
import inspect
import requests

# Loads environment based on deployment location:
script_path = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(
    0, os.path.join(script_path, "..", "..")
)  # adds EPA-Cyano-Web project to sys.path

# Local imports:
from config.set_environment import DeployEnv
from cyan_flask.app import web_app_api
from cyan_flask.app.models import (
    User,
    Location,
    Notifications,
    Settings,
    Comment,
    CommentImages,
    Reply,
)

# Sets up runtime environment:
runtime_env = DeployEnv()
runtime_env.load_deployment_environment()


class TestWebAppApi(unittest.TestCase):
    """
    Unit test class for web_app_api.py module, which is the Flask app
    that defines the API endpoints.
    """

    print(
        "cyan_flask web_app_api.py unittests conducted at "
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

    def test_register_user_1(self):

        test_request = {
            "wrongkey": "test",
            "password": "test",
            "email": "test@email.com",
        }

        expected_result = {"error": "Invalid key in request"}, 400
        actual_result = web_app_api.register_user(test_request)

        self.assertEqual(actual_result, expected_result)

    @patch("flask_sqlalchemy._QueryProperty.__get__")
    def test_register_user_2(self, user_query_mock):

        example_db_result = User(
            username="test",
            email="test@email.com",
            password="test",
            created=datetime.date.today().isoformat(),
            last_visit=datetime.date.today().isoformat(),
        )

        test_request = {"user": "test", "password": "test", "email": "test@email.com"}

        user_query_mock.return_value.filter_by.return_value.first.return_value = (
            example_db_result
        )

        expected_result = {"error": "Username already exists"}, 400
        actual_result = web_app_api.register_user(test_request)

        self.assertEqual(actual_result, expected_result)

    @patch("flask_sqlalchemy._QueryProperty.__get__")
    def test_register_user_3(self, user_query_mock):

        example_db_result = User(
            username="test2",
            email="test@email.com",
            password="test",
            created=datetime.date.today().isoformat(),
            last_visit=datetime.date.today().isoformat(),
        )

        test_request = {"user": "test2", "password": "test", "email": "test@email.com"}

        user_query_mock.return_value.filter_by.return_value.first.side_effect = [
            None,
            example_db_result,
        ]

        expected_result = {"error": "Email address already taken"}, 400
        actual_result = web_app_api.register_user(test_request)

        self.assertEqual(actual_result, expected_result)

    @patch("cyan_flask.app.web_app_api.db")
    @patch("cyan_flask.app.web_app_api.PasswordHandler")
    @patch("flask_sqlalchemy._QueryProperty.__get__")
    def test_register_user_4(self, user_query_mock, password_mock, db_mock):

        example_db_result = User(
            username="test",
            email="test@email.com",
            password="test",
            created=datetime.date.today().isoformat(),
            last_visit=datetime.date.today().isoformat(),
        )

        test_request = {"user": "test", "password": "test", "email": "test@email.com"}

        user_query_mock.return_value.filter_by.return_value.first.side_effect = [
            None,
            None,
        ]

        password_mock.return_value.hash_password.return_value = "b4e8ced1a488722d8179a7294a2e27ecb07971e0bb24b32f55deeb417702dd5d309a180511a01758489e17ab93693ac0946332d4dd495c5b09421e7d754f1e3ecffd123afa5e009519ff6a543f028387a09c7aa8b4a27da2183b8299cac10f02"

        expected_result = (
            {
                "status": "success",
                "username": test_request["user"],
                "email": test_request["email"],
            },
            200,
        )
        actual_result = web_app_api.register_user(test_request)

        self.assertEqual(actual_result, expected_result)

    def test_login_user_1(self):
        """
        login_user invalid key.
        """
        test_request = {"wrongkey": "test", "password": "test"}
        expected_result = {"error": "Invalid key in request"}, 400
        actual_result = web_app_api.login_user(test_request)

        self.assertEqual(actual_result, expected_result)

    @patch("flask_sqlalchemy._QueryProperty.__get__")
    def test_login_user_2(self, user_query_mock):
        """
        login_user invalid user credentials.
        """
        test_request = {"user": "test", "password": "test", "dataType": 1}
        # query_database_mock.return_value = []
        user_query_mock.return_value.filter_by.return_value.first.return_value = None

        expected_result = {"error": "Invalid user credentials."}, 401
        actual_result = web_app_api.login_user(test_request)

        self.assertEqual(actual_result, expected_result)

    @patch("cyan_flask.app.web_app_api.PasswordHandler")
    @patch("flask_sqlalchemy._QueryProperty.__get__")
    def test_login_user_3(self, user_query_mock, password_mock):
        """
        login_user invalid password.
        """
        example_db_result = User(
            username="test",
            email="test@email.com",
            password="test",
            created=datetime.date.today().isoformat(),
            last_visit=datetime.date.today().isoformat(),
        )
        test_request = {"user": "test", "password": "test", "dataType": 1}

        user_query_mock.return_value.filter_by.return_value.first.return_value = (
            example_db_result
        )

        password_mock.return_value.test_password.return_value = False

        expected_result = {"error": "Invalid username and/or password."}, 401
        actual_result = web_app_api.login_user(test_request)

        self.assertEqual(actual_result, expected_result)

    @patch("cyan_flask.app.web_app_api.get_user_locations")
    @patch("cyan_flask.app.web_app_api.JwtHandler")
    @patch("cyan_flask.app.web_app_api.db")
    @patch("cyan_flask.app.web_app_api.get_user_settings")
    @patch("cyan_flask.app.web_app_api.get_notifications")
    @patch("cyan_flask.app.web_app_api.PasswordHandler")
    @patch("flask_sqlalchemy._QueryProperty.__get__")
    def test_login_user_4(
        self,
        user_query_mock,
        password_mock,
        notifications_mock,
        settings_mock,
        db_mock,
        jwt_mock,
        user_locations_mock,
    ):
        """
        login_user success.
        """
        example_db_result = User(
            username="test",
            email="test@email.com",
            password="test",
            created=datetime.date.today(),
            last_visit=datetime.date.today(),
        )
        test_request = {"user": "test", "password": "test", "dataType": 1}
        user_data = {
            "username": example_db_result.username,
            "email": example_db_result.email,
            "auth_token": "",
        }
        expected_data = {
            "user": user_data,
            "locations": [],
            "notifications": [],
            "settings": {},
        }
        expected_code = 200

        user_query_mock.return_value.filter_by.return_value.first.return_value = (
            example_db_result
        )

        password_mock.return_value.test_password.return_value = True

        notifications_mock.return_value = expected_data["notifications"]

        settings_mock.return_value = expected_data["settings"]

        jwt_mock.return_value.encode_auth_token.return_value = user_data["auth_token"]

        user_locations_mock.return_value = expected_data["locations"]

        expected_result = expected_data, expected_code
        actual_result = web_app_api.login_user(test_request)

        self.assertEqual(actual_result, expected_result)

    @patch("cyan_flask.app.web_app_api.get_user_locations")
    @patch("cyan_flask.app.web_app_api.JwtHandler")
    @patch("cyan_flask.app.web_app_api.db")
    @patch("cyan_flask.app.web_app_api.get_user_settings")
    @patch("cyan_flask.app.web_app_api.get_notifications")
    @patch("cyan_flask.app.web_app_api.PasswordHandler")
    @patch("flask_sqlalchemy._QueryProperty.__get__")
    def test_login_user_5(
        self,
        user_query_mock,
        password_mock,
        notifications_mock,
        settings_mock,
        db_mock,
        jwt_mock,
        user_locations_mock,
    ):
        """
        login_user success.
        """
        example_db_result = User(
            username="test",
            email="test@email.com",
            password="test",
            created=datetime.date.today(),
            last_visit=datetime.date.today(),
        )
        test_request = {"user": "test", "password": "test", "dataType": 1}
        user_data = {
            "username": example_db_result.username,
            "email": example_db_result.email,
            "auth_token": "",
        }
        expected_data = {
            "user": user_data,
            "locations": [],
            "notifications": [],
            "settings": {},
        }

        user_query_mock.return_value.filter_by.return_value.first.return_value = (
            example_db_result
        )

        password_mock.return_value.test_password.return_value = True

        notifications_mock.return_value = expected_data["notifications"]

        settings_mock.return_value = expected_data["settings"]

        jwt_mock.return_value.encode_auth_token.return_value = user_data["auth_token"]

        user_locations_mock.side_effect = KeyError()

        expected_result = {"error": "Invalid key in database data"}, 500
        actual_result = web_app_api.login_user(test_request)

        self.assertEqual(actual_result, expected_result)

    @patch("cyan_flask.app.web_app_api.get_user_locations")
    @patch("cyan_flask.app.web_app_api.JwtHandler")
    @patch("cyan_flask.app.web_app_api.db")
    @patch("cyan_flask.app.web_app_api.get_user_settings")
    @patch("cyan_flask.app.web_app_api.get_notifications")
    @patch("cyan_flask.app.web_app_api.PasswordHandler")
    @patch("flask_sqlalchemy._QueryProperty.__get__")
    def test_login_user_6(
        self,
        user_query_mock,
        password_mock,
        notifications_mock,
        settings_mock,
        db_mock,
        jwt_mock,
        user_locations_mock,
    ):
        """
        login_user success.
        """
        example_db_result = User(
            username="test",
            email="test@email.com",
            password="test",
            created=datetime.date.today(),
            last_visit=datetime.date.today(),
        )
        test_request = {"user": "test", "password": "test", "dataType": 1}
        user_data = {
            "username": example_db_result.username,
            "email": example_db_result.email,
            "auth_token": "",
        }
        expected_data = {
            "user": user_data,
            "locations": [],
            "notifications": [],
            "settings": {},
        }

        user_query_mock.return_value.filter_by.return_value.first.return_value = (
            example_db_result
        )

        password_mock.return_value.test_password.return_value = True

        notifications_mock.return_value = expected_data["notifications"]

        settings_mock.return_value = expected_data["settings"]

        jwt_mock.return_value.encode_auth_token.return_value = user_data["auth_token"]

        user_locations_mock.side_effect = Exception()

        expected_result = {"error": "Failed to log user in"}, 500
        actual_result = web_app_api.login_user(test_request)

        self.assertEqual(actual_result, expected_result)

    def test_add_location_1(self):
        """
        add_location invalid key in request.
        """
        request_obj = {
            # 'owner': "test",  # missing key
            "id": None,
            "type": 1,
            "name": "location name",
            "latitude": 80.00,
            "longitude": -80.00,
            "marked": False,
            "compare": False,
            "notes": [],
        }
        example_db_result = Location()

        expected_result = {"error": "Invalid key in request"}, 400
        actual_result = web_app_api.add_location(request_obj)

        self.assertEqual(actual_result, expected_result)

    @patch("flask_sqlalchemy._QueryProperty.__get__")
    def test_add_location_2(self, location_query_mock):
        """
        add_location record exist.
        """
        request_obj = {
            "owner": "test",
            "id": 1,
            "type": 1,
            "name": "location name",
            "latitude": 80.00,
            "longitude": -80.00,
            "marked": False,
            "compare": False,
            "notes": [],
        }
        example_db_result = Location(
            owner=request_obj["owner"],
            id=request_obj["id"],
            type=request_obj["type"],
            name=request_obj["name"],
            latitude=request_obj["latitude"],
            longitude=request_obj["longitude"],
            marked=request_obj["marked"],
            compare=request_obj["compare"],
            notes=request_obj["notes"],
        )

        location_query_mock.return_value.filter_by.return_value.first.return_value = (
            example_db_result
        )

        expected_result = {"error": "Record with same key exists"}, 409
        actual_result = web_app_api.add_location(request_obj)

        self.assertEqual(actual_result, expected_result)

    @patch("cyan_flask.app.web_app_api.db")
    @patch("flask_sqlalchemy._QueryProperty.__get__")
    def test_add_location_3(self, location_query_mock, db_mock):
        """
        add_location success.
        """
        request_obj = {
            "owner": "test",
            "id": 1,
            "type": 1,
            "name": "location name",
            "latitude": 80.00,
            "longitude": -80.00,
            "marked": False,
            "compare": False,
            "notes": [],
        }

        location_query_mock.return_value.filter_by.return_value.first.return_value = (
            None
        )

        expected_result = {"status": "success"}, 201
        actual_result = web_app_api.add_location(request_obj)

        self.assertEqual(actual_result, expected_result)

    @patch("cyan_flask.app.web_app_api.db")
    @patch("flask_sqlalchemy._QueryProperty.__get__")
    def test_delete_location_1(self, location_query_mock, db_mock):
        """
        delete_location success.
        """
        user = "test"
        _id = 1
        data_type = 1

        expected_result = {"status": "success"}, 200
        actual_result = web_app_api.delete_location(user, _id, data_type)

        self.assertEqual(actual_result, expected_result)

    def test_edit_location_1(self):
        """
        edit_location invalid key request.
        """
        request_obj = {
            # 'owner': "test",  # missing key
            "id": None,
            "type": 1,
            "name": "location name",
            "latitude": 80.00,
            "longitude": -80.00,
            "marked": False,
            "compare": False,
            "notes": [],
        }

        expected_result = {"error": "Invalid key in request"}, 400
        actual_result = web_app_api.edit_location(request_obj)

        self.assertEqual(actual_result, expected_result)

    @patch("cyan_flask.app.web_app_api.db")
    @patch("flask_sqlalchemy._QueryProperty.__get__")
    def test_edit_location_2(self, location_query_mock, db_mock):
        """
        edit_location success.
        """
        request_obj = {
            "owner": "test",
            "id": None,
            "type": 1,
            "name": "location name",
            "latitude": 80.00,
            "longitude": -80.00,
            "marked": False,
            "compare": False,
            "notes": [],
        }

        expected_result = {"status": "success"}, 200
        actual_result = web_app_api.edit_location(request_obj)

        self.assertEqual(actual_result, expected_result)

    @patch("cyan_flask.app.web_app_api.read_location_row")
    @patch("flask_sqlalchemy._QueryProperty.__get__")
    def test_get_user_locations(self, location_query_mock, read_location_row_mock):
        """
        get_user_locations.
        """
        user = "test"
        data_type = 1
        location_json = {
            "owner": user,
            "id": None,
            "type": data_type,
            "name": "location name",
            "latitude": 80.00,
            "longitude": -80.00,
            "marked": False,
            "compare": False,
            "notes": [],
        }
        example_db_result = Location(
            owner=location_json["owner"],
            id=location_json["id"],
            type=location_json["type"],
            name=location_json["name"],
            latitude=location_json["latitude"],
            longitude=location_json["longitude"],
            marked=location_json["marked"],
            compare=location_json["compare"],
            notes=location_json["notes"],
        )

        location_query_mock.return_value.filter_by.return_value.all.return_value = [
            example_db_result
        ]

        read_location_row_mock.return_value = location_json

        expected_result = [location_json]
        actual_result = web_app_api.get_user_locations(user, data_type)

        self.assertEqual(actual_result, expected_result)

    def test_read_location_row(self):
        """
        read_location_row
        """
        location_json = {
            "owner": "test",
            "id": None,
            "type": 1,
            "name": "location name",
            "latitude": 80.00,
            "longitude": -80.00,
            "marked": False,
            "compare": False,
            "notes": "[]",
        }
        example_db_result = Location(
            owner=location_json["owner"],
            id=location_json["id"],
            type=location_json["type"],
            name=location_json["name"],
            latitude=location_json["latitude"],
            longitude=location_json["longitude"],
            marked=location_json["marked"],
            compare=location_json["compare"],
            notes=location_json["notes"],
        )

        expected_result = dict(location_json)
        expected_result["notes"] = []
        actual_result = web_app_api.read_location_row(example_db_result)

        self.assertEqual(actual_result, expected_result)

    @patch("flask_sqlalchemy._QueryProperty.__get__")
    def test_get_location_1(self, location_query_mock):
        """
        get_location location not found.
        """
        user = "test"
        _id = 1
        data_type = 1

        location_query_mock.return_value.filter_by.return_value.first.return_value = (
            None
        )

        expected_result = {"error": "Location not found"}, 404
        actual_result = web_app_api.get_location(user, _id, data_type)

        self.assertEqual(actual_result, expected_result)

    @patch("cyan_flask.app.web_app_api.read_location_row")
    @patch("flask_sqlalchemy._QueryProperty.__get__")
    def test_get_location_2(self, location_query_mock, read_location_row_mock):
        """
        get_location success.
        """
        user = "test"
        _id = 1
        data_type = 1
        location_json = {
            "owner": user,
            "id": _id,
            "type": data_type,
            "name": "location name",
            "latitude": 80.00,
            "longitude": -80.00,
            "marked": False,
            "compare": False,
            "notes": [],
        }
        example_db_result = Location(
            owner=location_json["owner"],
            id=location_json["id"],
            type=location_json["type"],
            name=location_json["name"],
            latitude=location_json["latitude"],
            longitude=location_json["longitude"],
            marked=location_json["marked"],
            compare=location_json["compare"],
            notes=location_json["notes"],
        )

        location_query_mock.return_value.filter_by.return_value.all.return_value = (
            example_db_result
        )

        read_location_row_mock.return_value = location_json

        expected_result = location_json, 200
        actual_result = web_app_api.get_location(user, _id, data_type)

        self.assertEqual(actual_result, expected_result)

    @patch("cyan_flask.app.web_app_api.parse_notifications_response")
    @patch("cyan_flask.app.web_app_api.utils.make_notifications_request")
    @patch("cyan_flask.app.web_app_api.get_users_notifications")
    def test_get_notifications_1(
        self,
        get_users_notifications_mock,
        make_notifications_request_mock,
        parse_notifications_response_mock,
    ):
        """
        get_notifications no notifications
        """
        user = "test"
        last_visit = datetime.date.today().isoformat()

        get_users_notifications_mock.return_value = []

        make_notifications_request_mock.return_value = None

        parse_notifications_response_mock.return_value = []

        expected_result = []
        actual_result = web_app_api.get_notifications(user, last_visit)

        self.assertEqual(actual_result, expected_result)

    @patch("cyan_flask.app.web_app_api.convert_notification_to_list")
    @patch("cyan_flask.app.web_app_api.db")
    @patch("cyan_flask.app.web_app_api.parse_notifications_response")
    @patch("cyan_flask.app.web_app_api.utils.make_notifications_request")
    @patch("cyan_flask.app.web_app_api.get_users_notifications")
    def test_get_notifications_2(
        self,
        get_users_notifications_mock,
        make_notifications_request_mock,
        parse_notifications_response_mock,
        db_mock,
        convert_notification_to_list_mock,
    ):
        """
        get_notifications with notifications
        """
        user = "test"
        last_visit = str(datetime.datetime.now()).split(".")[0]
        example_notification = {
            "id": 1,
            "subject": "Hello hello...",
            "message": "Can anyone hear me?",
            "dateSent": 1446772133000,
            "image": {
                "name": "epa-logo.png",
                "width": 72,
                "height": 72,
                "format": "PNG",
                "thumb": False,
            },
        }
        example_db_result = Notifications(
            owner=user,
            id=1,
            date=last_visit,
            subject="example subject",
            body="example body",
            is_new=True,
        )
        example_db_result_list = [
            example_db_result.owner,
            example_db_result.id,
            example_db_result.date,
            example_db_result.subject,
            example_db_result.body,
            example_db_result.is_new,
        ]

        get_users_notifications_mock.return_value = [example_db_result_list]

        make_notifications_request_mock.return_value = [example_notification]

        parse_notifications_response_mock.return_value = [example_db_result]

        convert_notification_to_list_mock.return_value = example_db_result_list

        expected_result = [example_db_result_list, example_db_result_list]
        actual_result = web_app_api.get_notifications(user, last_visit)

        self.assertEqual(actual_result, expected_result)

    def test_convert_notification_to_list_1(self):
        """
        convert_notification_to_list
        """
        user = "test"
        last_visit = str(datetime.datetime.now()).split(".")[0]
        example_db_result = Notifications(
            owner=user,
            id=1,
            date=last_visit,
            subject="example subject",
            body="example body",
            is_new=True,
        )
        example_db_result_list = [
            example_db_result.owner,
            example_db_result.id,
            example_db_result.date,
            example_db_result.subject,
            example_db_result.body,
            example_db_result.is_new,
        ]

        expected_result = example_db_result_list
        actual_result = web_app_api.convert_notification_to_list(example_db_result)

        self.assertEqual(actual_result, expected_result)

    def test_parse_notifications_response_1(self):
        """
        parse_notifications_response no new notifications
        """
        new_notifications = None
        last_visit = str(datetime.datetime.now()).split(".")[0]
        user = "test"

        expected_result = []
        actual_result = web_app_api.parse_notifications_response(
            new_notifications, last_visit, user
        )

        self.assertEqual(actual_result, expected_result)

    @patch("cyan_flask.app.web_app_api.utils.convert_to_timestamp")
    def test_parse_notifications_response_2(self, convert_to_timestamp_mock):
        """
        parse_notifications_response new notifications
        """
        new_notifications = None
        last_visit = str(datetime.datetime.now()).split(".")[0]
        user = "test"
        example_notification = {
            "id": 1,
            "subject": "Hello hello...",
            "message": "Can anyone hear me?",
            "dateSent": 1446772133000,
            "image": {
                "name": "epa-logo.png",
                "width": 72,
                "height": 72,
                "format": "PNG",
                "thumb": False,
            },
        }
        converted_timestamp = "2015-11-05 20:08:53"  # example notification dateSent converted to timestamp
        example_db_result = Notifications(
            owner=user,
            id=example_notification["id"],
            date=converted_timestamp,
            subject=example_notification["subject"],
            body=example_notification["message"],
            is_new=True,
        )

        convert_to_timestamp_mock.return_value = converted_timestamp

        expected_result = []
        actual_result = web_app_api.parse_notifications_response(
            new_notifications, last_visit, user
        )

        self.assertEqual(actual_result, expected_result)

    @patch("cyan_flask.app.web_app_api.db")
    @patch("flask_sqlalchemy._QueryProperty.__get__")
    def test_edit_notifications_1(self, notification_query_mock, db_mock):
        """
        edit_notifications
        """
        user = "test"
        _id = 1

        expected_result = {"status": "success"}, 200
        actual_result = web_app_api.edit_notifications(user, _id)

        self.assertEqual(actual_result, expected_result)

    @patch("cyan_flask.app.web_app_api.db")
    @patch("flask_sqlalchemy._QueryProperty.__get__")
    def test_delete_notifications_1(self, notification_query_mock, db_mock):
        """
        delete_notifications
        """
        user = "test"

        expected_result = {"status": "success"}, 200
        actual_result = web_app_api.delete_notifications(user)

        self.assertEqual(actual_result, expected_result)

    @patch("flask_sqlalchemy._QueryProperty.__get__")
    def test_get_user_settings_1(self, settings_query_mock):
        """
        get_user_settings
        """
        user_id = 1

        settings_query_mock.return_value.filter_by.return_value.first.return_value = (
            None
        )

        expected_result = {
            "level_low": 100000,
            "level_medium": 300000,
            "level_high": 1000000,
            "enable_alert": False,
            "alert_value": 1000000,
        }
        actual_result = web_app_api.get_user_settings(user_id)

        self.assertEqual(actual_result, expected_result)

    @patch("flask_sqlalchemy._QueryProperty.__get__")
    def test_get_user_settings_2(self, settings_query_mock):
        """
        get_user_settings
        """
        user_id = 1

        settings_query_mock.return_value.filter_by.return_value.first.return_value = (
            None
        )

        example_db_result = Settings(
            level_low=100000,
            level_medium=300000,
            level_high=1000000,
            enable_alert=False,
            alert_value=1000000,
        )

        expected_result = {
            "level_low": example_db_result.level_low,
            "level_medium": example_db_result.level_medium,
            "level_high": example_db_result.level_high,
            "enable_alert": example_db_result.enable_alert,
            "alert_value": example_db_result.alert_value,
        }
        actual_result = web_app_api.get_user_settings(user_id)

        self.assertEqual(actual_result, expected_result)

    def test_edit_settings_1(self):
        """
        edit_settings
        """
        request_obj = {
            # 'owner': "test",  # missing key
            "level_low": 100000,
            "level_medium": 300000,
            "level_high": 1000000,
            "enable_alert": False,
            "alert_value": 1000000,
        }

        expected_result = {"error": "Invalid key in request"}, 400
        actual_result = web_app_api.edit_settings(request_obj)

        self.assertEqual(actual_result, expected_result)

    @patch("cyan_flask.app.web_app_api.db")
    @patch("flask_sqlalchemy._QueryProperty.__get__")
    def test_edit_settings_2(self, settings_query_mock, db_mock):
        """
        edit_settings
        """
        request_obj = {
            "owner": "test",
            "level_low": 100000,
            "level_medium": 300000,
            "level_high": 1000000,
            "enable_alert": False,
            "alert_value": 1000000,
        }
        example_db_result = Settings(
            level_low=request_obj["level_low"],
            level_medium=request_obj["level_medium"],
            level_high=request_obj["level_high"],
            enable_alert=request_obj["enable_alert"],
            alert_value=request_obj["alert_value"],
        )
        example_db_user = User(
            id=1,
            username="test",
            email="test@email.com",
            password="test",
            created=datetime.date.today(),
            last_visit=datetime.date.today(),
        )

        settings_query_mock.return_value.filter_by.return_value.first.side_effect = [
            example_db_user,
            example_db_result,
        ]

        expected_result = {"status": "success"}, 200
        actual_result = web_app_api.edit_settings(request_obj)

        self.assertEqual(actual_result, expected_result)

    def test_reset_password_1(self):
        """
        reset_password no email
        """
        email = "test@email.com"
        request_obj = {"email_wrong_key": email}

        expected_result = {"error": "No email provided."}, 400
        actual_result = web_app_api.reset_password(request_obj)

        self.assertEqual(actual_result, expected_result)

    @patch("flask_sqlalchemy._QueryProperty.__get__")
    def test_reset_password_2(self, user_query_mock):
        """
        reset_password email address not found
        """
        email = "test@email.com"
        request_obj = {"email": email}

        user_query_mock.return_value.filter_by.return_value.first.return_value = None

        expected_result = {"error": "User email address not found."}, 401
        actual_result = web_app_api.reset_password(request_obj)

        self.assertEqual(actual_result, expected_result)

    @patch("cyan_flask.app.web_app_api.PasswordHandler")
    @patch("flask_sqlalchemy._QueryProperty.__get__")
    def test_reset_password_3(self, user_query_mock, password_mock):
        """
        reset_password reset email failed
        """
        email = "test@email.com"
        request_obj = {"email": email}
        error_obj = {"error": "testing error"}

        password_mock.return_value.send_password_reset_email.return_value = error_obj

        expected_result = error_obj, 500
        actual_result = web_app_api.reset_password(request_obj)

        self.assertEqual(actual_result, expected_result)

    @patch("cyan_flask.app.web_app_api.PasswordHandler")
    @patch("flask_sqlalchemy._QueryProperty.__get__")
    def test_reset_password_4(self, user_query_mock, password_mock):
        """
        reset_password reset email successfully sent
        """
        email = "test@email.com"
        request_obj = {"email": email}

        expected_result = {"status": "Email sent to {}".format(email)}, 200
        actual_result = web_app_api.reset_password(request_obj)

        self.assertEqual(actual_result, expected_result)

    def test_set_new_password_1(self):
        """
        set_new_password no email provided
        """
        email = "test@email.com"
        request_obj = {"email_wrong_key": email}

        expected_result = {"error", "No email provided."}, 400
        actual_result = web_app_api.set_new_password(request_obj)

        self.assertEqual(actual_result, expected_result)

    @patch("cyan_flask.app.web_app_api.db")
    @patch("cyan_flask.app.web_app_api.PasswordHandler")
    @patch("flask_sqlalchemy._QueryProperty.__get__")
    def test_set_new_password_2(self, user_query_mock, password_mock, db_mock):
        """
        set_new_password failed password update
        """
        email = "test@email.com"
        request_obj = {"email": email, "newPassword": "newpass"}

        password_mock.return_value.hash_password.return_value = "b4e8ced1a488722d8179a7294a2e27ecb07971e0bb24b32f55deeb417702dd5d309a180511a01758489e17ab93693ac0946332d4dd495c5b09421e7d754f1e3ecffd123afa5e009519ff6a543f028387a09c7aa8b4a27da2183b8299cac10f02"

        user_query_mock.return_value.filter_by.return_value.update.return_value = None

        expected_result = {"error": "Failed to update password"}, 500
        actual_result = web_app_api.set_new_password(request_obj)

        self.assertEqual(actual_result, expected_result)

    @patch("cyan_flask.app.web_app_api.db")
    @patch("cyan_flask.app.web_app_api.PasswordHandler")
    @patch("flask_sqlalchemy._QueryProperty.__get__")
    def test_set_new_password_3(self, user_query_mock, password_mock, db_mock):
        """
        set_new_password failed password update
        """
        email = "test@email.com"
        request_obj = {"email": email, "newPassword": "newpass"}

        password_mock.return_value.hash_password.return_value = "b4e8ced1a488722d8179a7294a2e27ecb07971e0bb24b32f55deeb417702dd5d309a180511a01758489e17ab93693ac0946332d4dd495c5b09421e7d754f1e3ecffd123afa5e009519ff6a543f028387a09c7aa8b4a27da2183b8299cac10f02"

        expected_result = {"status": "success"}, 200
        actual_result = web_app_api.set_new_password(request_obj)

        self.assertEqual(actual_result, expected_result)

    @patch("flask_sqlalchemy._QueryProperty.__get__")
    def test_get_comments_1(self, comments_query_mock):
        """
        get_comments no comments
        """

        comments_query_mock.return_value.order_by.return_value.all.return_value = []

        expected_result = [], 200
        actual_result = web_app_api.get_comments()

        self.assertEqual(actual_result, expected_result)

    @patch("cyan_flask.app.web_app_api.utils.build_comments_json")
    @patch("flask_sqlalchemy._QueryProperty.__get__")
    def test_get_comments_2(self, comments_query_mock, build_comments_json_mock):
        """
        get_comments with comments
        """
        comment_json = {
            "id": 1,
            "title": "",
            "date": datetime.datetime.now(),
            "username": "test",
            "device": "N/A",
            "browser": "N/A",
            "body": {},
            "replies": [],
        }

        comments_query_mock.return_value.order_by.return_value.all.return_value = [
            comment_json
        ]

        build_comments_json_mock.return_value = [comment_json]

        expected_result = [comment_json], 200
        actual_result = web_app_api.get_comments()

        self.assertEqual(actual_result, expected_result)

    def test_add_user_comment_1(self):
        """
        add_user_comment invalid key
        """
        request_obj = {
            # 'title': '',  # missing key
            "date": datetime.datetime.now(),
            "username": "test",
            "device": "N/A",
            "browser": "N/A",
            "body": {},
        }

        expected_result = {"error": "Invalid key in request"}, 400
        actual_result = web_app_api.add_user_comment(request_obj)

        self.assertEqual(actual_result, expected_result)

    @patch("cyan_flask.app.web_app_api.utils.save_image_source")
    @patch("cyan_flask.app.web_app_api.utils.build_comments_json")
    @patch("cyan_flask.app.web_app_api.db")
    def test_add_user_comment_2(
        self, db_mock, build_comments_json_mock, save_image_source_mock
    ):
        """
        add_user_comment
        """
        request_obj = {
            "id": 1,
            "title": "test title",
            "date": datetime.datetime.now(),
            "username": "test",
            "device": "N/A",
            "browser": "N/A",
            "comment_text": "test comment text",
            "comment_images": [
                {"source": "base64encodedimagestring", "name": "testpic.jpg"}
            ],
        }
        comment_obj = Comment(
            id=request_obj["id"],
            title=request_obj["title"],
            date=request_obj["date"],
            username=request_obj["username"],
            device=request_obj["device"],
            browser=request_obj["browser"]
            # body=body
        )

        save_image_source_mock.return_value = request_obj["comment_images"][0]["source"]

        build_comments_json_mock.return_value = [request_obj]

        expected_result = request_obj, 201
        actual_result = web_app_api.add_user_comment(request_obj)

        self.assertEqual(actual_result, expected_result)

    def test_add_comment_reply_1(self):
        """
        add_comment_reply invalid key
        """
        request_obj = {
            # 'comment_id': 1,  # missing key,
            "comment_user": "test",
            "date": datetime.datetime.now(),
            "username": "test",
            "body": "test reply body",
        }

        expected_result = {"error": "Invalid key in request"}, 400
        actual_result = web_app_api.add_comment_reply(request_obj)

        self.assertEqual(actual_result, expected_result)

    @patch("cyan_flask.app.web_app_api.utils.build_replies_json")
    @patch("cyan_flask.app.web_app_api.db")
    def test_add_comment_reply_2(self, db_mock, build_replies_json_mock):
        """
        add_comment_reply
        """
        request_obj = {
            "comment_id": 1,
            "comment_user": "test",
            "date": datetime.datetime.now(),
            "username": "test",
            "body": "test reply body",
        }
        reply_obj = Reply(
            # id=_id  # auto increment id
            comment_id=request_obj["comment_id"],
            date=request_obj["date"],
            username=request_obj["username"],
            body=request_obj["body"],
        )

        build_replies_json_mock.return_value = [request_obj]

        expected_result = request_obj, 201
        actual_result = web_app_api.add_comment_reply(request_obj)

        self.assertEqual(actual_result, expected_result)
