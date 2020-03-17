import os
import datetime
import time
import hashlib
import binascii
import jwt
import math



def hash_password(password):
	salt = hashlib.sha256(os.urandom(60)).hexdigest().encode('ascii')
	password_hash = hashlib.pbkdf2_hmac('sha512', password.encode('utf-8'), salt, 100000)
	password_hex = binascii.hexlify(password_hash)
	password_salted = (salt + password_hex).decode('ascii')
	return password_salted


def test_password(password_0, password_1):
	salt = password_0[:64]
	password_1_hash = hashlib.pbkdf2_hmac('sha512', password_1.encode('utf-8'), salt.encode('ascii'), 100000)
	password_1_hex = binascii.hexlify(password_1_hash).decode('ascii')
	return password_0[64:] == password_1_hex


def encode_auth_token(user):
	"""
	Generates the Auth Token.
	"""
	try:
		payload = {
			'exp': datetime.datetime.utcnow() + datetime.timedelta(seconds=int(os.environ.get('SESSION_EXPIRE_SECONDS', 300))),
			'iat': datetime.datetime.utcnow(),
			'sub': user
		}
		return jwt.encode(
			payload,
			os.environ.get('SECRET_KEY'),
			algorithm='HS256'
		)
	except Exception as e:
		return e


def decode_auth_token(auth_token):
	"""
	Decodes the auth token.
	"""
	try:
		return jwt.decode(auth_token, os.environ.get('SECRET_KEY'), algorithms=['HS256'])
	except jwt.ExpiredSignatureError:
		return {'error': "Signature expired. Please log in again."}
	except jwt.InvalidTokenError:
		return {'error': "Invalid token. Please log in again."}
	except jwt.exceptions.DecodeError as identifier:
		return {'error': 'invalid authorization token'}


def check_time_delta(token_expiry):
	"""
	Calculates seconds between current time and
	token's expiration time. > 0 indicates number of seconds
	until expiration, < 0 indicates an expired token.
	"""
	time_delta = token_expiry - time.time()
	# if time_delta < 0:
	# 	raise jwt.exceptions.ExpiredSignatureError({'error': "Signature expired. Please log in again."})
	return time_delta


def get_user_from_token(request):
	"""
	Gets user/owner name from token.
	"""
	token = request.headers.get('Authorization', None)
	if token:
		print (token)
		print (decode_auth_token(token.split(' ')[1]))
		return decode_auth_token(token.split(' ')[1])['sub']
	return None


def get_user_token(request):
	"""
	Gets user's token.
	"""
	token = request.headers.get('Authorization', None)
	if token:
		return decode_auth_token(token.split(' ')[1])
	return None