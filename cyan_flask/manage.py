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
from cyan_flask.crypt import CryptManager


# db_handler = DBHandler()


crypt_manager = CryptManager()


# DB connection settings:
retries = 0
max_retries = 3
retry_timeout_secs = 2


def handle_password(enc_pass):
    key_path = crypt_manager.get_key()
    if not key_path:
        raise Exception("No SK environment variable set.")
    return crypt_manager.decrypt_message(key_path, enc_pass)


dec_root_pass = handle_password(os.getenv("DB_ROOT_PASS"))
db_handler = DBHandler(os.getenv("DB_NAME"), dec_root_pass)


def as_root(db_func, **db_func_kwargs):
    """
    Executes a function, 'db_func', as root user. Used for
    executing flask db commands as root user (e.g., as_root(flask_migrate.migrate, message="a message")).
    """
    # Database crendentials:
    db_host = os.getenv("DB_HOST")
    db_port = os.getenv("DB_PORT")
    db_user = os.getenv("DB_USER")
    db_pass = handle_password(os.getenv("DB_PASS"))
    db_name = os.getenv("DB_NAME")
    # db_root_pass = handle_password(os.getenv('MYSQL_ROOT_PASSWORD'))
    db_root_pass = handle_password(os.getenv("DB_ROOT_PASS"))

    # MySQL URLs:
    mysql_url = "mysql://{}:{}@{}/{}".format(db_user, db_pass, db_host, db_name)
    mysql_url_root = "mysql://{}:{}@{}/{}".format(
        "root", db_root_pass, db_host, db_name
    )

    app.config.update(SQLALCHEMY_DATABASE_URI=mysql_url_root)  # sets db uri to root
    db_func(**db_func_kwargs)  # runs function as root
    app.config.update(SQLALCHEMY_DATABASE_URI=mysql_url)  # sets back to non-root


def retry_db_command():

    global retries
    global max_retries

    retries += 1
    time.sleep(retry_timeout_secs)
    if retries <= max_retries:
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
    # print("Creating database: {}.".format(db_name))
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
@click.argument("host")
@click.argument("root_pass")
@click.argument("new_pass")
def create_db_user(user, host, root_pass, new_pass):
    """
    Creates MySQL user.
    """
    # TODO: Refactor retry in except, have retry function have this function as input??
    # Or is calling these cli function recursively causing the input problems?
    print("~~~ Running flask user-create.")

    while retry_db_command():
        try:
            db_handler.create_user(
                user, handle_password(new_pass), host
            )  # TODO: Test with DB_HOST instead of '%'
            break
        except Exception as e:
            print("Exception in create_db_user: {}".format(e))


@app.cli.command("user-update")
@click.argument("user")
@click.argument("host")
@click.argument("root_pass")
@click.argument("new_pass")
def update_user_password(user, host, root_pass, new_pass):
    """
    Updates user's DB password.
    Inputs:
            + user - username
            + host - hostname
            + new_pass - new encrypted password
            + migrations_path - path for flask-migrate migrations folder
    """
    print("\n~~~ Running flask user-update.")

    while retry_db_command():
        try:
            db_handler.update_user_pass(
                user, handle_password(new_pass), host
            )  # TODO: Return status
            break
        except Exception as e:
            print("Exception in update_user_password: {}".format(e))


@app.cli.command("create-secrets")
@click.argument("curr_key", required=False)
# @click.argument("secret", required=False)
@click.argument("env_name", required=False)
def create_secrets(curr_key, env_name):
    """
    Encrypts secrets by manual encryption requiring
    user to enter secrets to be encrypted.
    """
    print("\n~~~ Running flask create-secret")
    if not curr_key:
        curr_key = input("Enter secret key path and filename: ")
    while True:
        secret = getpass("Enter secret to be encrypted: ")
        resecret = getpass("Re-enter secret to be encrypted: ")
        if secret != resecret:
            print("Secrets do not match. Try to enter secret again.")
            continue
        enc_secret = crypt_manager.encrypt_message(curr_key, secret)
        print(
            "\nEncrypted secret with {} key:\n\n{}\n".format(
                curr_key, enc_secret.decode("utf-8")
            )
        )
        cont_enc = input("\nContinue secret encryption? (y or n): ")
        if not cont_enc in ["y", "Y", "yes", "Yes"]:
            break
    print("Encryption routine complete.")
    print("Secrets encrypted with the following key: {}".format(curr_key))


@app.cli.command("create-key")
@click.argument("key_path", required=False)
def create_key(key_path):
    """
    Creates secret key.
    """
    if not key_path:
        key_path = input("Enter secret key path and filename: ")
    crypt_manager.create_key(key_path)
    print("Key created at: {}".format(key_path))
    print("Add this to .env file: {}".format(crypt_manager.obscure(key_path)))


@app.cli.command("env-rotate")
@click.argument("curr_key")
@click.argument("env_name")
def rotate_secrets(curr_key, env_name):
    """
    1. Creates new secret key.
    2. Loops through encrypted secrets.
    3. Decrypts each secret.
    4. Encrypts secret with new key.
    5. Updates .env file with new secrets and new key.
    """
    if not curr_key:
        print("Current secret key required to rotate secrets.")
        curr_key = input("Enter secret key path and filename: ")

    new_key = crypt_manager.rotate_secrets(curr_key, env_name)
