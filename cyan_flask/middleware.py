from functools import wraps
from flask import request, g, abort
import json
import logging

# Local imports:
import auth

def login_required(f):
	@wraps(f)
	def wrap(*args, **kwargs):
		authorization = request.headers.get("authorization", None)
		if not authorization:
			return {'error': "No authorization token provied"}, 401, {'Content-type': 'application/json'}
		try:
			auth_token = authorization.split(' ')[1]
			resp = auth.decode_auth_token(auth_token)
			if 'error' not in resp:
				g.user = resp['sub']
			else:
				return resp, 401, {'Content-Type': 'application/json'}
		except Exception as e:
			logging.warning("Error in cyan_flask middleware.py: {}".format(e))
			return {'error': "Error authenticating user token"}, 401, {'Content-Type': 'application/json'}
		return f(*args, **kwargs)
	return wrap