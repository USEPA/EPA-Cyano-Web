import os
import logging
import simplejson
from flask import Blueprint, request, jsonify, g
from flask_restful import Api, Resource, reqparse

# Local imports:
from auth import JwtHandler
from middleware import login_required
import web_app_api


api = Api()


base_url = "{}:{}".format(os.environ.get("FLASK_HOST"), os.environ.get("FLASK_PORT"))
api_url = "/cyan/app/api/"

parser_base = reqparse.RequestParser()  # defines flask-restful request parser


def get_auth_headers():
    if isinstance(g.token, bytes):
        g.token = g.token.decode("utf-8")
    headers = {
        "Access-Control-Expose-Headers": "Authorization",
        "Access-Control-Allow-Headers": "Authorization",
        "Authorization": "Bearer {}".format(g.token),
    }
    return headers


class StatusTest(Resource):
    """
	Flask test endpoint.
	URL: /test
	"""

    def get(self):
        return {"status": "cyan flask up and running."}


class Register(Resource):
    """
	Endpoint for user registration.
	URL: /app/api/user/register
	"""

    parser = parser_base.copy()
    parser.add_argument("user", type=str)
    parser.add_argument("email", type=str)
    parser.add_argument("password", type=str)

    def get(self):
        return {"status": "register endpoint"}

    def post(self):
        # Adds user to user table:
        args = request.get_json()
        results, status_code = web_app_api.register_user(args)
        return results, status_code


class Login(Resource):
    """
	Endpoint for logging user in.
	URL: /app/api/user
	"""

    parser = parser_base.copy()
    parser.add_argument("user", type=str)
    parser.add_argument("password", type=str)
    parser.add_argument("dataType", type=int)

    def get(self):
        return {"status": "login endpoint"}

    def post(self):
        # Gets user from user table:
        args = request.get_json()  # self.parser.parse_args()
        results, status_code = web_app_api.login_user(args)
        results = simplejson.loads(
            simplejson.dumps(results)
        )  # NOTE: Standard json lib unable to handle Decimal type (using simplejson)
        return results, status_code


class AddLocation(Resource):
    """
	Endpoint for adding user location.
	URL: /app/api/location/add
	"""

    def get(self):
        return {"status": "location endpoint"}

    @login_required
    def post(self, id=None):
        # Adds a new location to location table:
        args = request.get_json()
        args["owner"] = JwtHandler().get_user_from_token(request)
        headers = get_auth_headers()
        results, status_code = web_app_api.add_location(args)
        return results, status_code, headers


class EditLocation(Resource):
    """
	Endpoint for editing user location.
	URL: /app/api/location/edit
	"""

    def get(self):
        return {"status": "edit location endpoint"}

    @login_required
    def post(self):
        args = request.get_json()
        args["owner"] = JwtHandler().get_user_from_token(request)
        headers = get_auth_headers()
        results, status_code = web_app_api.edit_location(args)
        return results, status_code, headers


class DeleteLocation(Resource):
    """
	Endpoint for deleting user location.
	URL: /app/api/location/delete/<string:_id>
	"""

    @login_required
    def get(self, _id="", type=""):
        user = JwtHandler().get_user_from_token(request)
        headers = get_auth_headers()
        results, status_code = web_app_api.delete_location(user, _id, type)
        return results, status_code, headers


class GetUserLocations(Resource):
    """
	Endpoint for get all user locations.
	"""

    @login_required
    def get(self, type=""):
        user = JwtHandler().get_user_from_token(request)
        headers = get_auth_headers()
        results = web_app_api.get_user_locations(user, type)
        results = simplejson.loads(simplejson.dumps(results))
        return results, 200, headers


class GetLocation(Resource):
    """
	Endoint for getting a user location by user and location id.
	"""

    @login_required
    def get(self, _id="", type=""):
        user = JwtHandler().get_user_from_token(request)
        headers = get_auth_headers()
        results, status_code = web_app_api.get_location(user, _id, type)
        results = simplejson.loads(simplejson.dumps(results))
        return results, status_code, headers


class EditNotification(Resource):
    """
	Endpoint for setting is_new false after read.
	"""

    @login_required
    def get(self, _id=""):
        user = JwtHandler().get_user_from_token(request)
        headers = get_auth_headers()
        results, status_code = web_app_api.edit_notifications(user, _id)
        return results, status_code, headers


class DeleteNotification(Resource):
    """
	Endpoint for "Clear" notifications.
	"""

    @login_required
    def get(self):
        user = JwtHandler().get_user_from_token(request)
        headers = get_auth_headers()
        results, status_code = web_app_api.delete_notifications(user)
        return results, status_code, headers


class EditSettings(Resource):
    """
	Endpoint for editing user settings.
	URL: /app/api/settings/edit
	"""

    def get(self):
        return {"status": "edit settings endpoint"}

    @login_required
    def post(self):
        args = request.get_json()
        args["owner"] = JwtHandler().get_user_from_token(request)
        headers = get_auth_headers()
        results, status_code = web_app_api.edit_settings(args)
        return results, status_code, headers


class Refresh(Resource):
    """
	Endpoint for getting new token.
	Example usage: map panning uses this to get a
	new token, middleware.py ensures user is valid
	before providing a new token.
	"""

    @login_required
    def get(self):
        user = JwtHandler().get_user_from_token(request)
        headers = get_auth_headers()
        # return {'success': True}, 200, headers
        return {"status": "success"}, 200, headers


class Reset(Resource):
    """
	Reset password endpoint. Sends reset link to user's
	email with token in URL.
	"""

    def post(self):
        """
		Reset password request.
		"""
        parser = parser_base.copy()
        parser.add_argument("email", type=str)
        args = request.get_json()
        # TODO: security checks, header injections, etc.??
        results, status_code = web_app_api.reset_password(args)
        return results, status_code

    @login_required
    def put(self):
        """
		Reset password form handler (after user has verified email).
		Updates user's password.
		"""
        parser = parser_base.copy()
        parser.add_argument("newPassword", type=str)
        args = request.get_json()
        args["email"] = JwtHandler().get_user_token(request)[
            "sub"
        ]  # 'sub' key should have user's email address
        results, status_code = web_app_api.set_new_password(
            args
        )  # update user's email in db (middleware validates user)
        return results, status_code


class Comment(Resource):
    """
	GET - Retrieves all user comments.
	POST - Adds a user's comment.
	"""

    @login_required
    def get(self):
        """
		Get all user comments.
		"""
        # user = JwtHandler().get_user_from_token(request)
        headers = get_auth_headers()
        results, status_code = web_app_api.get_comments()
        results = simplejson.loads(simplejson.dumps(results))
        return results, status_code, headers

    @login_required
    def post(self):
        """
		Adds a user comment.
		"""
        args = request.get_json()
        headers = get_auth_headers()
        args["username"] = JwtHandler().get_user_from_token(
            request
        )  # gets username from token
        results, status_code = web_app_api.add_user_comment(args)
        results = simplejson.loads(simplejson.dumps(results))
        return results, status_code, headers


class Reply(Resource):
    """
	Endpoints for user comment replies.
	"""

    def get(self):
        """
		"""
        return {"status": "reply endpoint"}

    @login_required
    def post(self):
        """
		Adds replay to a user's comment.
		"""
        args = request.get_json()
        args["username"] = JwtHandler().get_user_from_token(
            request
        )  # gets username from token
        headers = get_auth_headers()
        results, status_code = web_app_api.add_comment_reply(args)
        results = simplejson.loads(simplejson.dumps(results))
        return results, status_code, headers


# Test endpoint:
api.add_resource(StatusTest, "/test")

# User endpoints:
api.add_resource(Login, api_url + "user")
api.add_resource(Register, api_url + "user/register")

# Location endpoints:
api.add_resource(AddLocation, api_url + "location/add")
api.add_resource(EditLocation, api_url + "location/edit")
api.add_resource(DeleteLocation, api_url + "location/delete/<string:_id>/<string:type>")
api.add_resource(GetLocation, api_url + "location/<string:_id>/<string:type>")
api.add_resource(GetUserLocations, api_url + "locations/<string:type>")

# Notifications endpoints:
api.add_resource(EditNotification, api_url + "notification/edit/<string:_id>")
api.add_resource(DeleteNotification, api_url + "notification/delete")

# Settings endpoint:
api.add_resource(EditSettings, api_url + "settings/edit")

# Refresh endpoint:
api.add_resource(Refresh, api_url + "refresh")

# Reset endpoint:
api.add_resource(Reset, api_url + "reset")

# Comment endpoint:
api.add_resource(Comment, api_url + "comment")

# Reply endpoint:
api.add_resource(Reply, api_url + "reply")


print("CyAN Flask app started.\nLive endpoints:")
print(base_url + "/test")
print(base_url + api_url + "user")
print(base_url + api_url + "user/register")
print(base_url + api_url + "location/add")
print(base_url + api_url + "location/edit")
print(base_url + api_url + "location/delete/<string:_id>")
print(base_url + api_url + "location/<string:_id>/<string:type>")
print(base_url + api_url + "locations/<string:type>")
print(base_url + api_url + "notification/edit/<string:_id>")
print(base_url + api_url + "notification/delete")
print(base_url + api_url + "settings/edit")
print(base_url + api_url + "refresh")
print(base_url + api_url + "reset")
