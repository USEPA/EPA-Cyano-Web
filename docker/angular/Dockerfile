FROM node:lts-alpine

# Build-time variables
ARG env=standalone

# Env vars for angular unit tests and bypassing angular CLI install prompt:
ENV CHROME_BIN=/usr/bin/chromium-browser \
	CHROME_PATH=/usr/lib/chromium/ \
	NG_CLI_ANALYTICS=false

COPY cyan_angular/ /app

COPY docker/ /docker

WORKDIR /app

RUN apk update && \
	apk add chromium && \
	npm install --force && \
	npm run build:$env

# RUN npx ng test --sourceMap=false --browsers=Chrome_without_sandbox --watch=false
