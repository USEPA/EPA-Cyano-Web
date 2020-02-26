from flask import Flask, Response, request
from flask_restful import Api, Resource, reqparse
from flask_cors import CORS
import os
import sys
import logging
import json
import simplejson

# Loads environment based on deployment location:
sys.path.insert(1, os.path.join(sys.path[0], '..'))

from config.set_environment import DeployEnv
runtime_env = DeployEnv()
runtime_env.load_deployment_environment()

# Local imports:
import web_app_api
from middleware import login_required

os.environ.setdefault('SECRET_KEY', os.urandom(24).hex())

# Declares Flask application:
app = Flask(__name__)
app.config.update(
	DEBUG=True
)

api = Api(app)

# Allows cross-origin requests (TODO: only allow certain domains in future?):
CORS(app, origins=["http://localhost:4200"])

# Adds module location to env as project root:
PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
os.environ.update({
	'PROJECT_ROOT': PROJECT_ROOT
})

logging.basicConfig(level=logging.DEBUG)  # sets logging level for logger (vary with dev vs prod?)

parser_base = reqparse.RequestParser()  # defines flask-restful request parser

base_url = "{}:{}".format(os.environ.get('FLASK_HOST'), os.environ.get('FLASK_PORT'))
api_url = '/cyan/app/api/'


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
	parser.add_argument('user', type=str)
	parser.add_argument('email', type=str)
	parser.add_argument('password', type=str)

	def get(self):
		return {"status": "register endpoint"}

	def post(self):
		# Adds user to user table:
		args = self.parser.parse_args()
		results, status_code = web_app_api.register_user(args)
		return results, status_code

class Login(Resource):
	"""
	Endpoint for logging user in.
	URL: /app/api/user
	"""
	parser = parser_base.copy()
	parser.add_argument('user', type=str)
	parser.add_argument('password', type=str)
	parser.add_argument('dataType', type=int)

	def get(self):
		return {"status": "login endpoint"}

	def post(self):
		# Gets user from user table:
		args = request.get_json() #self.parser.parse_args()
		results, status_code = web_app_api.login_user(args)
		results = simplejson.loads(simplejson.dumps(results))  # NOTE: Standard json lib unable to handle Decimal type (using simplejson)
		return results, status_code

class AddLocation(Resource):
	"""
	Endpoint for adding user location.
	URL: /app/api/location/add
	"""
	def get(self):
		return {"status": "location endpoint"}

	@login_required
	def post(self, user=None, id=None):
		# Adds a new location to location table:
		args = request.get_json()
		results, status_code = web_app_api.add_location(args)
		return results, status_code

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
		results, status_code = web_app_api.edit_location(args)
		return results, status_code

class DeleteLocation(Resource):
	"""
	Endpoint for deleting user location.
	URL: /app/api/location/delete/<string:user>/<string:_id>
	"""
	@login_required
	def get(self, user='', _id='', type=''):
		results, status_code = web_app_api.delete_location(user, _id, type)
		return results, status_code

class GetUserLocations(Resource):
	"""
	Endpoint for get all user locations.
	"""
	@login_required
	def get(self, user='', type=''):
		results = web_app_api.get_user_locations(user, type)
		results = simplejson.loads(simplejson.dumps(results))
		return results, 200

class GetLocation(Resource):
	"""
	Endoint for getting a user location by user and location id.
	"""
	@login_required
	def get(self, user='', _id='', type=''):
		results, status_code = web_app_api.get_location(user, _id, type)
		results = simplejson.loads(simplejson.dumps(results))
		return results, status_code

class EditNotification(Resource):
	"""
	Endpoint for setting is_new false after read.
	"""
	@login_required
	def get(self, user='', _id=''):
		results, status_code = web_app_api.edit_notifications(user, _id)
		return results, status_code

class DeleteNotification(Resource):
	"""
	Endpoint for "Clear" notifications.
	"""
	@login_required
	def get(self, user=''):
		results, status_code = web_app_api.delete_notifications(user)
		return results, status_code



# Test endpoint:
api.add_resource(StatusTest, '/test')

# User endpoints:
api.add_resource(Login, api_url + 'user')
api.add_resource(Register, api_url + 'user/register')

# Location endpoints:
api.add_resource(AddLocation, api_url + 'location/add')
api.add_resource(EditLocation, api_url + 'location/edit')
api.add_resource(DeleteLocation, api_url + 'location/delete/<string:user>/<string:_id>/<string:type>')
api.add_resource(GetLocation, api_url + 'location/<string:user>/<string:_id>/<string:type>')
api.add_resource(GetUserLocations, api_url + 'locations/<string:user>/<string:type>')

# Notifications endpoints:
api.add_resource(EditNotification, api_url + 'notification/edit/<string:user>/<string:_id>')
api.add_resource(DeleteNotification, api_url + 'notification/delete/<string:user>')



logging.info("CyAN Flask app started.\nLive endpoints:")
logging.info(base_url + '/test')
logging.info(base_url + api_url + 'user')
logging.info(base_url + api_url + 'user/register')
logging.info(base_url + api_url + 'location/add')
logging.info(base_url + api_url + 'location/edit')
logging.info(base_url + api_url + 'location/delete/<string:user>/<string:_id>')
logging.info(base_url + api_url + 'location/<string:user>/<string:_id>/<string:type>')
logging.info(base_url + api_url + 'locations/<string:user>/<string:type>')
logging.info(base_url + api_url + 'notification/edit/<string:user>/<string:_id>')
logging.info(base_url + api_url + 'notification/delete/<string:user>')



if __name__ == '__main__':
	app.run(port=os.environ.get('FLASK_PORT', 5001), debug=True)