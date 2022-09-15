ARG version=dev

FROM python:3.8-alpine

RUN apk add python3-dev libffi-dev build-base linux-headers pcre-dev mariadb-dev

# Install uWSGI
RUN pip install uwsgi

# Overwrite the uWSGI config
COPY docker/flask/uwsgi.ini /etc/uwsgi/

COPY cyan_flask/ /cyan_flask

COPY docker/ /docker

# NOTE: .env is .dockerignored
COPY config/ config/

RUN pip install --requirement /cyan_flask/requirements.txt

# RUN chmod -R 755 /config && \
# 	chmod 755 /docker/flask/start_flask.sh
RUN mkdir /config && \
	chmod -R 755 /config && \
	chmod 755 /docker/flask/start_flask.sh

WORKDIR /cyan_flask

# Runs unit tests (needs secret file to run)
# RUN python -m unittest

# IMPORTANT: Removes secret files from image
# RUN rm -f /config/secrets/*

CMD ["sh", "/docker/flask/start_flask.sh"]
