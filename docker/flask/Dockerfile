ARG version=dev

FROM python:3.8-alpine

ENV APP_USER=www-data

RUN apk add python3-dev libffi-dev build-base linux-headers pcre-dev mariadb-dev

# Install uWSGI
RUN pip install uwsgi

# Overwrite the uWSGI config
COPY docker/flask/uwsgi.ini /etc/uwsgi/

COPY cyan_flask/ /cyan_flask

COPY docker/ /docker

RUN pip install --requirement /cyan_flask/requirements.txt

RUN mkdir /config && \
	chmod -R 755 /config && \
	chmod 755 /docker/flask/start_flask.sh

COPY config/set_environment.py /config/set_environment.py

WORKDIR /cyan_flask

ENV PYTHONPATH /cyan_flask:$PYTHONPATH
ENV PATH /cyan_flask:$PATH

RUN apk update && \
	apk upgrade

RUN adduser -S $APP_USER -G $APP_USER
RUN chown -R $APP_USER:$APP_USER /cyan_flask /docker /config

USER $APP_USER

CMD ["sh", "/docker/flask/start_flask.sh"]
