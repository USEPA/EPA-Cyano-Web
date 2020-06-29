import os
import sys
import click  # comes with flask
from flask_sqlalchemy import SQLAlchemy
import flask_migrate
from sqlalchemy import exc

# Loads environment based on deployment location:
PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(1, os.path.join(sys.path[0], '..'))

# Local imports:
from cyan_flask.app import app, db
from cyan_flask.build_db import DBHandler



# Database crendentials:
db_host = os.environ.get('DB_HOST')
db_port = os.environ.get('DB_PORT')
db_user = os.environ.get('DB_USER')
db_pass = os.environ.get('DB_PASS')
db_root_passwd = os.environ.get('MYSQL_ROOT_PASSWORD')
db_name = os.environ.get('DB_NAME')
# os.environ.setdefault('DB_NAME', 'test_cyan_web_app_db')

print("db_host value: {}".format(db_host))
print("db_port value: {}".format(db_port))
print("db_user value: {}".format(db_user))
print("db_pass value: {}".format(db_pass))
print("db_root_passwd value: {}".format(db_root_passwd))
print("db_name value: {}".format(db_name))

# MySQL URLs:
mysql_url = 'mysql://{}:{}@{}/{}'.format(db_user, db_pass, db_host, db_name)
mysql_url_root = 'mysql://{}:{}@{}/{}'.format('root', db_root_passwd, db_host, db_name)

db_handler = DBHandler(db_name, db_root_passwd)



def as_root(db_func, **db_func_kwargs):
	"""
	Executes a function, 'db_func', as root user. Used for
	executing flask db commands as root user (e.g., as_root(flask_migrate.migrate, message="a message")).
	"""
	app.config.update(SQLALCHEMY_DATABASE_URI=mysql_url_root)
	db_func(**db_func_kwargs)
	app.config.update(SQLALCHEMY_DATABASE_URI=mysql_url)
	print("Done.")

# @db_cli.command('create')  # showing how to group commands
@app.cli.command('db-create')  # showing how to group commands
def db_create():
	"""
	Creates database and tables from database models using flask-sqlalchemy.
	See cyan_flask/app/models.py for model schema.
	"""
	print("Running manage.py db-create..")
	print("Creating database: {}.".format(db_name))
	as_root(db_handler.create_database)  # creates database using DB_NAME, doesn't create tables.
	print("Creating tables from models.")
	as_root(db.create_all)


@app.cli.command('db-init')
# @click.argument('migrations_path', required=False)
@click.option('-d', '--directory', 'migrations_path', required=False)
def db_init(migrations_path='migrations'):
	"""
	Runs flask-migrate "flask db init"; creates migrations folder.
	Example: flask db-init
	"""
	print("Running flask db init.")
	as_root(flask_migrate.init, directory=migrations_path)
	

@app.cli.command('db-migrate')
@click.argument('message')
@click.argument('migrations_path', required=False)
def db_migration(message, migrations_path='migrations'):
	"""
	Runs flask-migrate "flask db migrate -m <message>"; creates an automated revision.
	Example: flask db-migrate "migration message/description"
	"""
	print("Running flask db migrate.")
	as_root(flask_migrate.migrate, message=message, directory=migrations_path)


@app.cli.command('db-revision')
@click.argument('message')
@click.argument('migrations_path', required=False)
def db_revision(message, migrations_path='migrations'):
	"""
	Runs flask-migrate "flask db revision -m <message>"; creates an empty revision.
	Example: flask db-revision "made change"
	"""
	print("Running flask db revision.")
	as_root(flask_migrate.revision, message=message, directory=migrations_path)


@app.cli.command('db-stamp')
@click.argument('revision_id')
@click.argument('migrations_path', required=False)
def db_stamp(revision_id, migrations_path='migrations'):
	"""
	Runs flask-migrate "flask db stamp <revision id>"; sets the revision in the
	database without performing migrations.
	Example: flask db-stamp 123456abcdef
	"""
	print("Running flask db stamp.")
	as_root(flask_migrate.stamp, directory=migrations_path, revision=revision_id)


@app.cli.command('db-upgrade')
@click.argument('migrations_path', required=False)
def db_upgrade(migrations_path='migrations'):
	"""
	Runs flask-migrate "flask db upgrade"; runs upgrade() of stamped revision (i.e., applies migrations).
	Example: flask db-upgrade
	"""
	print("Running flask db upgrade.")
	try:
		as_root(flask_migrate.upgrade, directory=migrations_path)
	except exc.OperationalError as e:
		# NOTE: Tuple of error info found in e.orig.args
		if "Unknown database" in str(e):
			print("Unknown database error, trying to create database then build tables.")
			db_handler.create_database()  # tries to create db (if it doesn't already exist)
			as_root(flask_migrate.upgrade, directory=migrations_path)  # retries db upgrade with newly created db
		else:
			raise

@app.cli.command('db-downgrade')
@click.argument('migrations_path', required=False)
def db_downgrade(migrations_path='migrations'):
	"""
	Runs flask-migrate "flask db downgrade"; downgrades the database by reverting to previous revision.
	Example: flask db-downgrade
	"""
	print("Running flask db downgrade.")
	as_root(flask_migrate.downgrade, directory=migrations_path)
