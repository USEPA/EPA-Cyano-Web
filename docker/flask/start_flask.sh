#!/bin/bash

cd /cyan_flask  # switch to cyan_flask directory

# Runs unit tests:
# python -m unittest

# Runs integration tests (tests/integration_tests.py):
# python -m unittest tests/integration_tests.py

# Performs any database migrations
echo "### Performing database migrations."
flask db-upgrade  # applies db migrations

# Starts Flask server
echo "### Starting flask uwsgi server."
exec uwsgi --ini /etc/uwsgi/uwsgi.ini  # runs flask