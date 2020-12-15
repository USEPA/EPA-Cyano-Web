FROM node:lts-alpine

# Build-time variables
ARG env=standalone

# Moves files into directory name "app"
WORKDIR /app

# COPY cyan_angular/package.json cyan_angular/package-lock.json  /app/
COPY cyan_angular/ /app
COPY docker/ /docker


RUN cd /app \
	&& npm install \
	&& npm audit fix

# COPY cyan_angular/ /app

# Builds with $env variable
RUN cd /app && npm run build:$env
