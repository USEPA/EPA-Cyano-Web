#!/bin/sh

# Script file that is executed by cyano.service.
# Located at /var/tmp/start-app.sh

# Starts docker-compose stack:
cd /var/www/qed
export HOSTNAME=${HOSTNAME}
docker-compose up -d