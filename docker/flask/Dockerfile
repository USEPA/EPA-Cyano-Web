ARG version=dev

FROM python:3.8-alpine

RUN apk add python3-dev libffi-dev build-base linux-headers pcre-dev mariadb-dev

# Install Python Dependencies
# COPY cyan_flask/requirements.txt /tmp/
# RUN pip install --requirement /tmp/requirements.txt

# Install uWSGI
RUN pip install uwsgi

# Overwrite the uWSGI config
COPY cyan_flask/uwsgi.ini /etc/uwsgi/

COPY cyan_flask/ /cyan_flask

COPY docker/ /docker

# RUN mkdir /config
# WORKDIR /cyan_flask

RUN pip install --requirement /cyan_flask/requirements.txt

# EXPOSE 5001

RUN mkdir /config && \
	chmod -R 755 /config && \
	chmod 755 /cyan_flask/start_flask.sh

CMD ["sh", "/cyan_flask/start_flask.sh"]