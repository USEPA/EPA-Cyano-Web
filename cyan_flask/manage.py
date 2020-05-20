import os
import sys
import click  # comes with flask
# from flask_script import Manager
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate, MigrateCommand
from flask.cli import AppGroup

# Loads environment based on deployment location:
PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(1, os.path.join(sys.path[0], '..'))

from app import app, db
# from build_db import DBHandler


db_host = os.environ.get('DB_HOST')
db_port = os.environ.get('DB_PORT')
db_user = os.environ.get('DB_USER')
db_passwd = os.environ.get('DB_PASS')
db_name = os.environ.get('DB_NAME')
mysql_url_with_db = 'mysql://{}:{}@{}/{}'.format(db_user, db_passwd, db_host, db_name)
mysql_url_no_db = 'mysql://{}:{}@{}'.format(db_user, db_passwd, db_host)


print("Setting up custom commands.")


#########################################################################################
# TODO: Could move build_db functions and other management functionality to this module.
#########################################################################################


# db_cli = AppGroup('db')  # e.g., flask db create-db cyan_web_app_db
# @db_cli.command('create-db')  # showing how to group commands
@app.cli.command('create-db')
@click.argument('db_name')
def create_db(db_name):
	"""
	Creates database from database models using flask-sqlalchemy.
	See cyan_flask/app/database.py for definitions.
	"""
	print("Creating database: {}".format(db_name))
	# db.create_all()  # creates tables from app/database.py models (create database if not exists??)
	# print("{}".format(dir(db)))
	
