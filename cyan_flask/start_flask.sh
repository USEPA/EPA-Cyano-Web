#!/bin/bash
python -m unittest  # runs unit tests

# set env vars (TODO: Set paths with env vars?)
enc_root_pass=$(cat /config/secrets/db.txt)  # setting new root pass as encrypted versionf from file
enc_user_pass=$(cat /config/secrets/usr.txt)


# 1. Changes root pass for db root@localhost
echo "### Updating root password for db at localhost"
flask user-update root localhost $enc_root_pass

# 2. Changes root pass for api manage.py (root@%)
echo "### Updating root password for database at %"
flask user-update root % $enc_root_pass

# root pass should be updated now for following manage commands..

export MYSQL_ROOT_PASSWORD=$enc_root_pass  # sets root db pass to encrypted version, used in manage.py
export DB_PASS=$enc_user_pass  # sets cyano user DB_PASS env var to encrypted version, used in __init__.py

# 3. Creates cyano user for API-DB interactions
echo "### Creating user: $DB_USER, if not exist."
flask user-create $DB_USER $DB_PASS %

# 4. Performs any database migrations
echo "### Performing database migrations."
flask db-upgrade  # applies db migrations

# 5. Starts Flask server
exec uwsgi --ini /etc/uwsgi/uwsgi.ini  # runs flask