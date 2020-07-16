#!/bin/bash
python -m unittest
flask db-user  # creates user if not exist
flask db-upgrade  # applies db migrations
exec uwsgi --ini /etc/uwsgi/uwsgi.ini  # runs flask