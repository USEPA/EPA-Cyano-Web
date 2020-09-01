#!/bin/bash
python -m unittest  # runs unit tests (everything in tests/ with test_* pattern)
python -m unittest tests/integration_tests.py  # runs integration tests (tests/integration_tests.py)
flask db-user  # creates user if not exist
flask db-upgrade  # applies db migrations, creates db and tables if not exist
exec uwsgi --ini /etc/uwsgi/uwsgi.ini  # runs flask