from functools import wraps
from flask import request, g, abort
import json
import logging

# Local imports:
import auth


# refresh_delta = 300  # refresh token if <= 5m until expiration



def check_for_refresh(auth_token):
	"""
	Gets new token for valid user if token
	is near expiring.
	"""
	expiry_time = auth.check_time_delta(auth_token['exp'])
	# Refreshes token if it's within refresh window:
	# if expiry_time <= refresh_delta:
	# 	auth_token = auth.decode_auth_token(auth.encode_auth_token(auth_token['sub']))
	# Refreshes token each request if not expired:
	# if expiry_time <= 0:
	if expiry_time >= 0:
		# auth_token = auth.decode_auth_token(auth.encode_auth_token(auth_token['sub']))
		auth_token = auth.encode_auth_token(auth_token['sub'])
	return auth_token



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
				_token = check_for_refresh(resp)  # gets new token if almost expired
				g.token = _token
			else:
				return resp, 401, {'Content-Type': 'application/json'}
		except Exception as e:
			logging.warning("Error in cyan_flask middleware.py: {}".format(e))
			return {'error': "Error authenticating user token"}, 401, {'Content-Type': 'application/json'}
		return f(*args, **kwargs)
	return wrap