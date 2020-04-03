import os
import datetime
import time
import hashlib
import binascii
import jwt
import smtplib
import logging
import secrets
import zlib
from base64 import urlsafe_b64encode as b64e, urlsafe_b64decode as b64d
# from cryptography.fernet import Fernet
# from cryptography.hazmat.backends import default_backend
# from cryptography.hazmat.primitives import hashes
# from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC



class PasswordHandler:

	def __init__(self):
		self.config_obj = ConfigCrypt()

	def _create_email_message(self, server_email, user_email):
		subject = "Password reset for Cyano Web"
		user_link = self._create_reset_link(user_email)
		msg = "\r\n".join([
		  "From: {}".format(server_email),
		  "To: {}".format(user_email),
		  "Subject: {}".format(subject),
		  "",
		  "Follow link to reset password: {}".format(user_link)
		])
		return msg

	def _create_reset_link(self, user_email):
		jwt_token = JwtHandler().encode_auth_token(user_email)  # NOTE: usering email for 'sub' in token
		# TODO: Generalize URL in config
		return "http://localhost:4200/reset?token=" + jwt_token.decode('utf-8')

	def _send_mail(self, smtp_email, smtp_pass, user_email, msg):
		try:
			server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
			server.ehlo()
			server.login(smtp_email, smtp_pass)
			server.sendmail(smtp_email, user_email, msg)
			server.close()
			return {"success": "Email sent."}
		except Exception as e:
			logging.warning("Error sending reset email: {}".format(e))
			return {"error": "Unable to send email."}

	def _handle_config_password(self, smtp_pass):
		return self.config_obj.unobscure(smtp_pass.encode()).decode()

	def hash_password(self, password):
		salt = hashlib.sha256(os.urandom(60)).hexdigest().encode('ascii')
		password_hash = hashlib.pbkdf2_hmac('sha512', password.encode('utf-8'), salt, 100000)
		password_hex = binascii.hexlify(password_hash)
		password_salted = (salt + password_hex).decode('ascii')
		return password_salted

	def test_password(self, password_0, password_1):
		salt = password_0[:64]
		password_1_hash = hashlib.pbkdf2_hmac('sha512', password_1.encode('utf-8'), salt.encode('ascii'), 100000)
		password_1_hex = binascii.hexlify(password_1_hash).decode('ascii')
		return password_0[64:] == password_1_hex

	def send_password_reset_email(self, request):
		"""
		Handled contacts page comment submission by sending email
		to cts email using an smtp server.
		"""
		smtp_pass = self._handle_config_password(os.environ.get('EMAIL_PASS'))
		smtp_email = os.environ.get('EMAIL')
		user_email = request.get('user_email')
		msg = self._create_email_message(smtp_email, user_email)
		return self._send_mail(smtp_email, smtp_pass, user_email, msg)



class JwtHandler:

	def __init__(self):
		pass

	def encode_auth_token(self, user):
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

	def decode_auth_token(self, auth_token):
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

	def check_time_delta(self, token_expiry):
		"""
		Calculates seconds between current time and
		token's expiration time. > 0 indicates number of seconds
		until expiration, < 0 indicates an expired token.
		"""
		return token_expiry - time.time()

	def get_user_from_token(self, request):
		"""
		Gets user/owner name from token.
		"""
		token = request.headers.get('Authorization', None)
		if token:
			print (token)
			print (self.decode_auth_token(token.split(' ')[1]))
			return self.decode_auth_token(token.split(' ')[1])['sub']
		return None

	def get_user_token(self, request):
		"""
		Gets user's token.
		"""
		token = request.headers.get('Authorization', None)
		if token:
			return self.decode_auth_token(token.split(' ')[1])
		return None



class ConfigCrypt:
	"""
	Encrypts/decrypts a byte string using a 
	provided password or key. Also option for
	obscuring/unobscuring byte strings, which is not
	secure.
	"""

	def __init__(self):
		# self.backend = default_backend()
		# self.iterations = 100000
		pass

	# def _derive_key(self, password, salt):
	# 	"""
	# 	Derive a secret key from a given password and salt
	# 	"""
	# 	kdf = PBKDF2HMAC(
	# 		algorithm=hashes.SHA256(), length=32, salt=salt,
	# 		iterations=self.iterations, backend=self.backend)
	# 	return b64e(kdf.derive(password))

	# def encrypt_password(self, message, password):
	# 	assert type(message) is bytes, 'message must be type bytes, e.g., "test string".encode()'
	# 	salt = secrets.token_bytes(16)
	# 	key = self._derive_key(password.encode(), salt)
	# 	return b64e(
	# 		b'%b%b%b' % (
	# 			salt,
	# 			self.iterations.to_bytes(4, 'big'),
	# 			b64d(Fernet(key).encrypt(message)),
	# 		)
	# 	)

	# def decrypt_password(self, token, password):
	# 	assert type(token) is bytes, 'token must be type bytes'
	# 	decoded = b64d(token)
	# 	salt, iter, token = decoded[:16], decoded[16:20], b64e(decoded[20:])
	# 	self.iterations = int.from_bytes(iter, 'big')
	# 	key = self._derive_key(password.encode(), salt)
	# 	return Fernet(key).decrypt(token)

	def obscure(self, data):
		"""
		Obscures a byte string (not secure, any item using this
		must still be kept secret).
		"""
		return b64e(zlib.compress(data, 9))

	def unobscure(self, obscured):
		"""
		Unobscures a byte string.
		"""
		return zlib.decompress(b64d(obscured))