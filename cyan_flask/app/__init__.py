from flask import Flask, Response, request, g
from flask_restful import Api, Resource, reqparse
from flask_cors import CORS
import os
import sys
import logging
import json
import simplejson


PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))

# Loads environment based on deployment location:
sys.path.insert(1, PROJECT_ROOT)
sys.path.insert(1, os.path.join(PROJECT_ROOT, "..", ".."))
os.environ.update({"PROJECT_ROOT": PROJECT_ROOT})

from config.set_environment import DeployEnv

runtime_env = DeployEnv()
runtime_env.load_deployment_environment()

from endpoints import api
from models import db, migrate

# from config.secrets.crypt import CryptManager
from cyan_flask.crypt import CryptManager


crypt_manager = CryptManager()

secret_key = os.urandom(24).hex()
os.environ["SECRET_KEY"] = os.environ.get("SK", secret_key)


db_host = os.environ.get("DB_HOST")
db_port = os.environ.get("DB_PORT")
db_user = os.environ.get("DB_USER")
db_pass = os.environ.get("DB_PASS")
db_name = os.environ.get("DB_NAME")

key_path = crypt_manager.get_key()

# logging.warning("KEY PATH: {}".format(key_path))

mysql_url = None
if key_path and db_pass:
    mysql_url = "mysql://{}:{}@{}/{}".format(
        db_user, crypt_manager.decrypt_message(key_path, db_pass), db_host, db_name
    )
elif not key_path and db_pass:
    logging.warning("No key provided for decrypting secrets.")
    mysql_url = "mysql://{}:{}@{}/{}".format(db_user, db_pass, db_host, db_name)
else:
    logging.error(
        "\n\nNo DB_PASS env var provided for DB user.\nSet DB_PASS in the environment.\n\n"
    )
    raise

# Declares Flask application:
app = Flask(__name__)
app.config.update(
    DEBUG=True,
    SECRET_KEY=secret_key,  # set here as well as os.environ?
    SQLALCHEMY_DATABASE_URI=mysql_url,
    SQLALCHEMY_TRACK_MODIFICATIONS=False,
)

CORS(app, origins=["http://localhost:4200", "http://127.0.0.1:4200"])

logging.basicConfig(
    level=logging.DEBUG
)  # sets logging level for logger (vary with dev vs prod?)


def init_app():
    with app.app_context():
        from cyan_flask import manage  # will this work in a docker context? (nope)
    api.init_app(app)  # initializes api from routes module
    db.init_app(app)  # initializes db from database module
    migrate.init_app(app, db)  # initializes db migration


init_app()


if __name__ == "__main__":
    app.run(port=os.environ.get("FLASK_PORT", 5001), debug=True)
