import os
import sys
from getpass import getpass
import click  # comes with flask
from flask_sqlalchemy import SQLAlchemy
import flask_migrate
from sqlalchemy import exc
import time
from base64 import urlsafe_b64encode as b64e
import zlib


# Loads environment based on deployment location:
PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(1, os.path.join(sys.path[0], ".."))

# Local imports:
from cyan_flask.app import app, db
from cyan_flask.build_db import DBHandler
from config.secrets.crypt import CryptManager

crypt_manager = CryptManager()

# DB connection settings:
retries = 0
max_retries = 15
retry_timeout_secs = 2


def handle_password(enc_pass):
	key_path = os.environ.get('KEY_PATH')  # relative path from EPA-Cyano-Web directory
	if not key_path:
		raise Exception("No KEY_PATH environment variable set.")
	return crypt_manager.decrypt_message(key_path, enc_pass)

def as_root(db_func, **db_func_kwargs):
	"""
	Executes a function, 'db_func', as root user. Used for
	executing flask db commands as root user (e.g., as_root(flask_migrate.migrate, message="a message")).
	"""
	# Database crendentials:
	db_host = os.environ.get("DB_HOST")
	db_port = os.environ.get("DB_PORT")
	db_user = os.environ.get("DB_USER")
	db_pass = handle_password(os.environ.get('DB_PASS'))
	db_name = os.environ.get("DB_NAME")
	db_root_pass = handle_password(os.environ.get('MYSQL_ROOT_PASSWORD'))

	# MySQL URLs:
	mysql_url = "mysql://{}:{}@{}/{}".format(db_user, db_pass, db_host, db_name)
	mysql_url_root = "mysql://{}:{}@{}/{}".format("root", db_root_pass, db_host, db_name)

	app.config.update(SQLALCHEMY_DATABASE_URI=mysql_url_root)  # sets db uri to root
	db_func(**db_func_kwargs)  # runs function as root
	app.config.update(SQLALCHEMY_DATABASE_URI=mysql_url)  # sets back to non-root

def retry_db_command():

	global retries
	global max_retries

	retries += 1
	time.sleep(retry_timeout_secs)
	if retries <= max_retries:
		print("Can't connect to mysql instance. Retrying...")
		return True
	else:
		return False



@app.cli.command("db-create")  # showing how to group commands
def db_create():
	"""
	Creates database and tables from database models using flask-sqlalchemy.
	See cyan_flask/app/models.py for model schema.
	"""
	print("~~~ Running manage.py db-create..")
	print("Creating database: {}.".format(db_name))
	as_root(
		db_handler.create_database
	)  # creates database using DB_NAME, doesn't create tables.
	print("Creating tables from models.")
	as_root(db.create_all)


@app.cli.command("db-init")
# @click.argument('migrations_path', required=False)
@click.option("-d", "--directory", "migrations_path", required=False)
def db_init(migrations_path="migrations"):
	"""
	Runs flask-migrate "flask db init"; creates migrations folder.
	Example: flask db-init
	"""
	print("~~~ Running flask db init.")
	as_root(flask_migrate.init, directory=migrations_path)


@app.cli.command("db-migrate")
@click.argument("message")
@click.argument("migrations_path", required=False)
def db_migration(message, migrations_path="migrations"):
	"""
	Runs flask-migrate "flask db migrate -m <message>"; creates an automated revision.
	Example: flask db-migrate "migration message/description"
	"""
	print("~~~ Running flask db migrate.")
	as_root(flask_migrate.migrate, message=message, directory=migrations_path)


@app.cli.command("db-revision")
@click.argument("message")
@click.argument("migrations_path", required=False)
def db_revision(message, migrations_path="migrations"):
	"""
	Runs flask-migrate "flask db revision -m <message>"; creates an empty revision.
	Example: flask db-revision "made change"
	"""
	print("~~~ Running flask db revision.")
	as_root(flask_migrate.revision, message=message, directory=migrations_path)


@app.cli.command("db-stamp")
@click.argument("revision_id")
@click.argument("migrations_path", required=False)
def db_stamp(revision_id, migrations_path="migrations"):
	"""
	Runs flask-migrate "flask db stamp <revision id>"; sets the revision in the
	database without performing migrations.
	Example: flask db-stamp 123456abcdef
	"""
	print("~~~ Running flask db stamp.")
	as_root(flask_migrate.stamp, directory=migrations_path, revision=revision_id)


@app.cli.command("db-upgrade")
@click.argument("migrations_path", required=False)
def db_upgrade(migrations_path="migrations"):
	"""
	Runs flask-migrate "flask db upgrade"; runs upgrade() of stamped revision (i.e., applies migrations).
	Example: flask db-upgrade
	"""
	print("~~~ Running flask db upgrade.")

	dec_root_pass = handle_password(os.environ.get('MYSQL_ROOT_PASSWORD'))
	db_handler = DBHandler(os.environ.get("DB_NAME"), dec_root_pass)

	try:
		as_root(flask_migrate.upgrade, directory=migrations_path)
	except exc.OperationalError as e:
		# NOTE: Tuple of error info found in e.orig.args
		if "Unknown database" in str(e):
			print(
				"Unknown database error, trying to create database then build tables."
			)
			db_handler.create_database()  # tries to create db (if it doesn't already exist)
			as_root(
				flask_migrate.upgrade, directory=migrations_path
			)  # retries db upgrade with newly created db


@app.cli.command("db-downgrade")
@click.argument("migrations_path", required=False)
def db_downgrade(migrations_path="migrations"):
	"""
	Runs flask-migrate "flask db downgrade"; downgrades the database by reverting to previous revision.
	Example: flask db-downgrade
	"""
	print("~~~ Running flask db downgrade.")
	as_root(flask_migrate.downgrade, directory=migrations_path)


@app.cli.command("user-create")
@click.argument("user")
@click.argument("newpass")
@click.argument("host")
@click.argument("migrations_path", required=False)
def create_db_user(user, newpass, host, migrations_path="migrations"):
	"""
	Creates MySQL user.
	"""
	# TODO: Refactor retry in except, have retry function have this function as input??
	# Or is calling these cli function recursively causing the input problems?
	print("~~~ Running flask user-create.")

	dec_root_pass = handle_password(os.environ.get('MYSQL_ROOT_PASSWORD'))
	db_handler = DBHandler(os.environ.get("DB_NAME"), dec_root_pass)

	while retry_db_command():
		try:
			db_handler.create_user(user, handle_password(newpass), host)  # TODO: Test with DB_HOST instead of '%'
			break
		except Exception as e:
			print("Exception in create_db_user: {}".format(e))


@app.cli.command("user-update")
@click.argument("user")
@click.argument("host")
@click.argument("new_pass")
@click.argument("migrations_path", required=False)
def update_user_password(user, host, new_pass, migrations_path="migrations"):
	"""
	Updates user's DB password.
	Inputs:
		+ user - username
		+ host - hostname
		+ new_pass - new encrypted password
		+ migrations_path - path for flask-migrate migrations folder
	"""
	print("\n~~~ Running flask user-update.")

	dec_root_pass = handle_password(os.environ.get('MYSQL_ROOT_PASSWORD'))
	db_handler = DBHandler(os.environ.get("DB_NAME"), dec_root_pass)

	while retry_db_command():
		try:
			db_handler.update_user_pass(user, handle_password(new_pass), host)  # TODO: Return status
			break
		except Exception as e:
			print("Exception in update_user_password: {}".format(e))
