from flask import Flask, Response
from flask_restful import Api, Resource, reqparse
from flask_cors import CORS
import os
import sys
import logging
# import json
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

	def get(self):
		return {"status": "login endpoint"}

	def post(self):
		# Gets user from user table:
		args = self.parser.parse_args()
		results, status_code = web_app_api.login_user(args)
		results = simplejson.loads(simplejson.dumps(results))  # NOTE: Standard json lib unable to handle Decimal type (using simplejson)
		return results, status_code

class AddLocation(Resource):
	"""
	Endpoint for adding user location.
	URL: /app/api/location/add
	"""
	parser = parser_base.copy()
	parser.add_argument('owner', type=str)
	parser.add_argument('id', type=int)
	parser.add_argument('name', type=str)
	parser.add_argument('latitude', type=float)
	parser.add_argument('longitude', type=float)
	parser.add_argument('marked', type=bool)
	parser.add_argument('notes', type=str)

	def get(self):
		return {"status": "location endpoint"}

	def post(self, user=None, id=None):
		# Adds a new location to location table:
		args = self.parser.parse_args()
		results, status_code = web_app_api.add_location(args)
		return results, status_code

class EditLocation(Resource):
	"""
	Endpoint for editing user location.
	URL: /app/api/location/edit
	"""
	parser = parser_base.copy()
	parser.add_argument('owner', type=str)
	parser.add_argument('id', type=int)
	parser.add_argument('name', type=str)
	parser.add_argument('marked', type=bool)
	parser.add_argument('notes', type=str)

	def get(self):
		return {"status": "edit location endpoint"}

	def post(self):
		args = self.parser.parse_args()
		results, status_code = web_app_api.edit_location(args)
		return results, status_code

class DeleteLocation(Resource):
	"""
	Endpoint for deleting user location.
	URL: /app/api/location/delete/<string:user>/<string:_id>
	"""
	def get(self, user='', _id=''):
		results, status_code = web_app_api.delete_location(user, _id)
		return results, status_code

class GetLocation(Resource):
	"""
	Endoint for getting a user location by user and location id.
	"""
	def get(self, user='', _id=''):
		# results, status_code = web_app_api.delete_location(user, _id)
		results, status_code = web_app_api.get_location(user, _id)
		result_obj = {
			'owner': results[0],
			'id': results[1],
			'name': results[2],
			'latitude': results[3],
			'longitude': results[4],
			'marked': results[5],
			'notes': results[6]
		}
		results = simplejson.loads(simplejson.dumps(result_obj))
		return results, status_code



api.add_resource(StatusTest, '/test')
# api.add_resource(CyanProxy, '/cyan/<string:request_url>')
api.add_resource(Login, '/cyan/app/api/user')
api.add_resource(Register, '/cyan/app/api/user/register')
api.add_resource(AddLocation, '/cyan/app/api/location/add')
api.add_resource(EditLocation, '/cyan/app/api/location/edit')
api.add_resource(DeleteLocation, '/cyan/app/api/location/delete/<string:user>/<string:_id>')
api.add_resource(GetLocation, '/cyan/app/api/location/<string:user>/<string:_id>')

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