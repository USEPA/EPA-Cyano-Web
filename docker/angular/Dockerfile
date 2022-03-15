FROM node:lts-alpine

# Build-time variables
ARG env=standalone

# Env vars for angular unit tests and bypassing angular CLI install prompt:
ENV CHROME_BIN=/usr/bin/chromium-browser \
	CHROME_PATH=/usr/lib/chromium/ \
	NG_CLI_ANALYTICS=false

ENV APP_USER=www-data

COPY cyan_angular/ /app

COPY docker/ /docker

WORKDIR /app

RUN apk update && \
	apk upgrade && \
	apk add chromium && \
	npm install && \
	npm run build:$env

RUN adduser -S $APP_USER -G $APP_USER

RUN chown -R $APP_USER:$APP_USER /app /docker

# Runs as non-root user "www-data"
USER $APP_USER
