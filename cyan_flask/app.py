from flask import Flask, Response
from flask import request
from flask_restful import Api, Resource, reqparse
from flask_cors import CORS
import os
import sys
import logging
import json
import simplejson

# Loads environment based on deployment location:
sys.path.insert(1, os.path.join(sys.path[0], '..'))
# from config.set_environment import DeployEnv
from config.set_environment import DeployEnv
runtime_env = DeployEnv()
runtime_env.load_deployment_environment()

# Local imports:
import web_app_api

# Declares Flask application:
app = Flask(__name__)
app.config.update(
	DEBUG=True
)
api = Api(app)

# Allows cross-origin requests (TODO: only allow certain domains in future?):
CORS(app)

# Adds module location to env as project root:
PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
os.environ.update({
	'PROJECT_ROOT': PROJECT_ROOT
})

logging.basicConfig(level=logging.DEBUG)  # sets logging level for logger

parser_base = reqparse.RequestParser()  # defines flask-restful request parser

base_url = "{}:{}".format(os.environ.get('FLASK_HOST'), os.environ.get('FLASK_PORT'))



class StatusTest(Resource):
	"""
	Flask test endpoint.
	URL: /test
	"""
	def get(self):
		return {"status": "cyan flask up and running."}

# class CyanProxy(Resource):
# 	"""
# 	Proxies Angular requests to cyan.epa.gov/cyan/cyano API endpoints.
#   URL: /cyan/<string:request_url>
# 	"""
# 	def get(self, request_url):
# 		pass

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
		print (request.is_json)
		content = request.get_json()
		print (content)
		print(content['user'])
		# Gets user from user table:
		args = request.get_json() #self.parser.parse_args()
		print (args)
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

	def post(self):
		args = request.get_json()
		results, status_code = web_app_api.edit_location(args)
		return results, status_code

class DeleteLocation(Resource):
	"""
	Endpoint for deleting user location.
	URL: /app/api/location/delete/<string:user>/<string:_id>
	"""
	def get(self, user='', _id='', type=''):
		results, status_code = web_app_api.delete_location(user, _id, type)
		return results, status_code

class GetUserLocations(Resource):
	"""
	Endpoint for get all user locations.
	"""
	def get(self, user='', type=''):
		results = web_app_api.get_user_locations(user, type)
		results = simplejson.loads(simplejson.dumps(results))
		return results, 200

class GetLocation(Resource):
	"""
	Endoint for getting a user location by user and location id.
	"""
	def get(self, user='', _id='', type=''):
		results, status_code = web_app_api.get_location(user, _id, type)
		results = simplejson.loads(simplejson.dumps(results))
		return results, status_code

class AddNotification(Resource):
	"""
	Endpoint for adding notification from last sync time.
	"""
	pass

class EditNotification(Resource):
	"""
	Endpoint for setting is_new false after read.
	"""
	def get(self, user='', _id=''):
		results, status_code = web_app_api.edit_notifications(user, _id)
		return results, status_code

class DeleteNotification(Resource):
	"""
	Endpoint for "Clear" notifications.
	"""
	def get(self, user=''):
		results, status_code = web_app_api.delete_notifications(user)
		return results, status_code

class GetNotification(Resource):
	"""
	Endpoint for populating notifications list.
	"""
	pass



api.add_resource(StatusTest, '/test')
# api.add_resource(CyanProxy, '/cyan/<string:request_url>')
api.add_resource(Login, '/cyan/app/api/user')
api.add_resource(Register, '/cyan/app/api/user/register')
api.add_resource(AddLocation, '/cyan/app/api/location/add')
api.add_resource(EditLocation, '/cyan/app/api/location/edit')
api.add_resource(DeleteLocation, '/cyan/app/api/location/delete/<string:user>/<string:_id>/<string:type>')
api.add_resource(GetLocation, '/cyan/app/api/location/<string:user>/<string:_id>/<string:type>')
api.add_resource(GetUserLocations, '/cyan/app/api/locations/<string:user>/<string:type>')

# Notifications Endpoints:
api.add_resource(AddNotification, '/cyan/app/api/notification/add')
api.add_resource(EditNotification, '/cyan/app/api/notification/edit/<string:user>/<string:_id>')
api.add_resource(DeleteNotification, '/cyan/app/api/notification/delete/<string:user>')
api.add_resource(GetNotification, '/cyan/app/api/notification/<string:user>/<string:_id>')




logging.info("CyAN Flask app started.\nLive endpoints:")
logging.info(base_url + '/test')
# logging.info(base_url + '/cyan/<string:request_url>')
logging.info(base_url + '/cyan/app/api/user')
logging.info(base_url + '/cyan/app/api/user/register')
logging.info(base_url + '/cyan/app/api/location/add')
logging.info(base_url + '/cyan/app/api/location/edit')
logging.info(base_url + '/cyan/app/api/location/delete/<string:user>/<string:_id>')



if __name__ == '__main__':
	app.run(port=os.environ.get('FLASK_PORT', 5001), debug=True)