import subprocess
import os
import sys
import logging
from pathlib import Path
import getpass
import cryptography
from cryptography.fernet import Fernet
import zlib
from base64 import urlsafe_b64encode as b64e, urlsafe_b64decode as b64d


PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))


class CryptManager:

	def __init__(self):
		self.dup_ext = ".orig"  # file extension to append if file exists
		self.env_location = os.path.join(os.path.dirname(PROJECT_ROOT), "config", "environments")
		self.key_location = os.path.join(os.path.dirname(PROJECT_ROOT), "config", "secrets")

	def _convert_to_bytes(self, message):
		"""
		Type checks message. Tries to convert
		to bytes type.
		"""
		if isinstance(message, str):
			return message.encode()
		elif not isinstance(message, bytes):
			raise TypeError("Message must be a string of byte type.")
		return message

	def _save_file(self, file_content, fullpath):
		"""
		Saves file to fullpath, includes path and filename.
		"""
		# self._file_exists_check(fullpath)
		print("Writing file: {}".format(fullpath))
		with open(fullpath, "wb") as file_obj:
			file_obj.write(file_content)

	def _open_file(self, fullpath):
		"""
		Opens file 'fullpath' and returns its contents.
		"""
		try:
			return open(fullpath, "rb").read()
		except FileNotFoundError:
			# newpath = os.path.join(PROJECT_ROOT, "..", "config", "secrets", Path(fullpath).name)  # defaults to config/secrets path
			newpath = os.path.join(self.key_location, Path(fullpath).name)
			logging.warning("File not found at: {}. Trying default path: {}".format(fullpath, newpath))
			return open(newpath, "rb").read()

	# def _file_exists_check(self, fullpath):
	# 	"""
	# 	Checks if file exists as well as .orig version.
	# 	Returns exception if file and file.orig exists so
	# 	that a key doesn't get overwritten and lost forever.
	# 	"""
	# 	if Path(fullpath).is_file() and Path(fullpath + self.dup_ext).is_file():
	# 		raise Exception("Key file already exists with name '{}' as well as '{}'.".format(fullpath, fullpath + self.dup_ext))
	# 	else:
	# 		return fullpath

	def _get_env_as_dict(self, env_vars):
		"""
		Converts string of env vars from a .env file
		into a dictionary of key:val pairs.
		"""
		env_vars_dict = {}
		env_vars = env_vars.split('\n')
		for var in env_vars:
			if len(var) < 1:
				continue
			key = var.split('=', 1)[0]  # splits at first occurence of '=', breaking up key=val pairs
			val = var.split('=', 1)[1]
			env_vars_dict[key] = val
		return env_vars_dict

	def _convert_env_dict_to_string(self, env_vars_dict):
		"""
		Converts env vars dict to string.
		"""
		env_vars_str = ""
		for key, val in env_vars_dict.items():
			env_vars_str += "{}={}\n".format(key, val)
		env_vars_str = env_vars_str[:-1]  # removes trailing \n
		return env_vars_str

	def _open_env_file(self, env_file):
		"""
		Opens .env file for updating.
		Returns dictionary of key:val pairs from .env file.
		"""
		path = os.path.join(self.env_location, env_file)
		print("\nOpening .env file found at: {}".format(path))
		with open(path, 'r') as file_obj:
			env_vars = file_obj.read()
		return self._get_env_as_dict(env_vars)

	def _save_env_dict_to_file(self, env_file, env_vars_dict):
		"""
		Saves env vars dict to .env file.
		"""
		path = os.path.join(self.env_location, env_file)
		print("Saving to env file: {}".format(path))
		env_vars_str = self._convert_env_dict_to_string(env_vars_dict)
		with open(path, 'w') as file_obj:
			print("Writing to file.")
			file_obj.write(env_vars_str)
		return env_vars_str

	def _get_secrets_from_env(self, env_vars_dict):
		"""
		Gets all the env var key:vals with *_PASS* pattern.
		Inspired by automated secret rotation.
		"""
		secrets_dict = {}
		for key, val in env_vars_dict.items():
			if not "_PASS" in key:
				continue
			secrets_dict[key] = val
		return secrets_dict

	def update_env_file(self, env_file, updated_env_dict):
		"""
		Updates current .env file with updated/rotated
		encrypted passwords.
		  + env_file - .env filename to update.
		  + updated_env_dict - dict of newly encrypted env vars to update.
		"""
		env_vars_dict = self._open_env_file(env_file)  # opens .env file, returns dict of key:val
		print("\nCurrent env vars from '{}' .env file: {}".format(env_file, env_vars_dict))
		env_vars_dict.update(updated_env_dict)
		env_vars_str = self._save_env_dict_to_file(env_file, env_vars_dict)  # saves updated env vars dict to .env file
		print("\nNew environment file:\n{}\n".format(env_vars_str))
		return env_vars_str

	def get_key(self):
		"""
		Gets key path from environment varible.
		"""
		print("SK GETTING GOT: {}".format(os.environ.get("SK")))
		try:
		    return self.unobscure(os.environ.get("SK"))
		except Exception:
		    logging.warning("Unable to unobscure.")
		    return os.environ.get("SK")

	def create_key(self, fullpath):
		"""
		Creates secret key and saves it to/as fullpath.
		Returns secret key value.
		"""
		key = Fernet.generate_key()
		self._save_file(key, fullpath)
		return key

	def encrypt_message(self, key_file, message, message_file=None):
		"""
		Encrypts a message using a key file.
		Returns encrypted messaged value.
		"""
		message = self._convert_to_bytes(message)
		key = self._open_file(key_file)  # gets key from file
		f = Fernet(key)
		encrypted_message = f.encrypt(message)
		if message_file:
			self._save_file(self.encrypted_message, message_file)  # saves encrypted value to file
		return encrypted_message

	def decrypt_message(self, key_file, message):
		"""
		Decrypts an encrypted message.
		"""
		message = self._convert_to_bytes(message)
		key = self._open_file(key_file)
		f = Fernet(key)
		try:
			decrypted_message = f.decrypt(message)
		except cryptography.fernet.InvalidToken as e:
			logging.warning("decrypt_message exception: {}\nReturning message without decrypting.".format(e))
			return message
		return decrypted_message.decode('utf-8')

	def decrypt_file(self, key_file, full_filename):
		"""
		Decrypts an encrypted message from a file.
		"""
		encrypted_message = self._open_file(full_filename)
		return self.decrypt_message(encrypted_message)

	def obscure(self, data):
		"""
		Obscures a byte string (not secure, any item using this
		must still be kept secret).
		Returns byte string.
		"""
		data = self._convert_to_bytes(data)
		return b64e(zlib.compress(data, 9)).decode('utf-8')

	def unobscure(self, obscured):
		"""
		Unobscures a byte string.
		Returns byte string.
		"""
		obscured = self._convert_to_bytes(obscured)
		return zlib.decompress(b64d(obscured)).decode('utf-8')

	def rotate(self, orig_key_file, new_key_file, env_file):
		"""
		Re-encrypts secrets from env_file by decrypting
		with orig_key_file (path and filename of original secret key),
		and encrypting with new_key_file (path and filename of new secret key).
		"""
		updated_secrets = {}
		env_vars_dict = self._open_env_file(env_file)  # dict of .env's key:vals
		secrets_list = self._get_secrets_from_env(env_vars_dict)

		print("\nSecrets that will be updated: {}".format(secrets_list))

		for secret_key in secrets_list:
			secret_val = env_vars_dict[secret_key]  # gets current encrypted secret value
			dec_val = self.decrypt_message(orig_key_file, secret_val)  # decrypts secret with original key
			enc_val = self.encrypt_message(new_key_file, dec_val).decode("utf-8")  # encrypts the decrypted value with new key
			print("Original Encrypted Value: {}".format(secret_val))
			print("Re-encrypted Value: {}".format(enc_val))
			updated_secrets[secret_key] = enc_val

		updated_secrets['SK'] = self.obscure(Path(new_key_file).name)  # adds new key file path to .env file

		return updated_secrets

	def rotate_secrets(self, orig_key_file, env_file):
		"""
		Rotates secret key and secrets.
		  1. Saves original/current key as "orig_key_file".orig.
		  2. Creates a new secret key and saves as "orig_key_file".
		  	a. Should it save as a new filename altogether?
		  3. Opens .env file as dictionary and gets key:vals with *_PASS pattern.
		  4. Decrypts values with original key, then re-encrypts with new key.
		  5. Saves .env file with updated encrypted values.
		"""
		if not orig_key_file:
			orig_key_file = input("Enter path and filename of current secret key: ")

		if not Path(orig_key_file).is_file():
			orig_key_file = os.path.join(self.key_location, orig_key_file)  # try default location
			if not Path(orig_key_file).is_file():
				raise Exception("Secret key file '{}' does not exists.".format(orig_key_file))

		orig_key_file_archived = orig_key_file + ".orig"

		if Path(orig_key_file_archived).is_file():
			raise Exception("Cannot save original secret key as {}. File already exist.".format(orig_key_file_archived))

		orig_key = self._open_file(orig_key_file)  # orig key value
		self._save_file(orig_key, orig_key_file_archived)  # saves orig key with .orig extension

		print("\nOriginal secret key now saved as: {}\n".format(orig_key_file_archived))
		print("Creating new key value for {}".format(orig_key_file))

		new_key = self.create_key(orig_key_file)  # overwriting orig key with newly generated key

		updated_secrets = self.rotate(orig_key_file_archived, orig_key_file, env_file)  # updates secrets and sk

		self.update_env_file(env_file, updated_secrets)  # updates .env file with secrets and sk

		print("\nUpdated secret file '{}' secret values: {}".format(env_file, updated_secrets))





if __name__ == '__main__':

	method = sys.argv[1]  # method ('encrypt', 'decrypt', 'create')
	sk = sys.argv[2]  # secret key (full path and filename)
	message = None  # optional args
	save_file = None  # optional args

	cm = CryptManager()

	if method == 'encrypt':
		try:
			message = sys.argv[3]  # message to encrypt
		except IndexError:
			message = getpass.getpass("Enter secret to encrypt: ")
		try:
			save_file = sys.argv[4]  # file to save encrypted message
		except IndexError:
			save_file = input("Enter path and filename for storing encrypted secret (e.g., /config/secrets/enc.txt): ")
		print(cm.encrypt_message(sk, message, save_file))
	elif method == 'decrypt':
		message = sys.argv[3]  # message to decrypt
		print(cm.decrypt_message(sk, message))
	elif method == 'create':
		# Creates a new secret key, returns path and filename
		print(cm.create_key(sk))
	elif method == 'get':
		# Unobscures value:
		unobscured_path_bytes = cm.unobscure(sk)
		print(unobscured_path_bytes)
	elif method == 'set':
		# Obscures value:
		obscured_path_bytes = cm.obscure(sk)
		print(obscured_path_bytes)
	elif method == 'rotate':
		# Creates new secret key, encrypts provided secrets with new key.
		message = sys.argv[3]  # comma-separated list in quotes (e.g., "file1.txt, file2.txt")
		print("Message: {}".format(message))
		message = message.replace(' ', '').split(",")
		print("New Message: {}".format(message))
		cm.rotate_secrets(sk, message)