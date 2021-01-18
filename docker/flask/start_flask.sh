#!/bin/bash

# export FLASK_APP=/cyan_flask/app

cd /cyan_flask  # switch to cyan_flask directory

python -m unittest  # runs unit tests

python -m unittest tests/integration_tests.py  # runs integration tests (tests/integration_tests.py)

# echo "~~~~~ Current environment: ~~~~~"
# printenv  # env is loaded for docker-compose 'env_file'
# echo "~~~~~~~~~~~~~~~~~~~~"

# 1. Changes root pass for db root@localhost
echo "### Updating root password for db at localhost"
flask user-update root localhost $MYSQL_ROOT_PASSWORD $DB_ROOT_PASS  # sets root@localhost to pass from .env file

# 2. Changes root pass for api manage.py (root@%)
echo "### Updating root password for database at %"
flask user-update root % $MYSQL_ROOT_PASSWORD $DB_ROOT_PASS  # sets root@% to pass from .env file (handles cyan-api startup db migrations)

export MYSQL_ROOT_PASSWORD=  # unsets mysql root pass

# 3. Creates cyano user for API-DB interactions
echo "### Creating user: $DB_USER, if not exist."
flask user-create $DB_USER % $DB_ROOT_PASS $DB_PASS  # using new root pass to create cyano db user

# 4. Performs any database migrations
echo "### Performing database migrations."
flask db-upgrade  # applies db migrations

# 5. Starts Flask server
exec uwsgi --ini /etc/uwsgi/uwsgi.ini  # runs flask