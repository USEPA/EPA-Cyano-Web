ARG version=dev

FROM python:3.8-alpine

RUN apk add python3-dev libffi-dev build-base linux-headers pcre-dev mariadb-dev

# Install uWSGI
RUN pip install uwsgi

# Overwrite the uWSGI config
COPY docker/flask/uwsgi.ini /etc/uwsgi/

COPY cyan_flask/ /cyan_flask

COPY docker/ /docker

RUN pip install --requirement /cyan_flask/requirements.txt

# EXPOSE 5001

RUN mkdir /config && \
	chmod -R 755 /config && \
	chmod 755 /docker/flask/start_flask.sh

WORKDIR /cyan_flask

CMD ["sh", "/docker/flask/start_flask.sh"]
