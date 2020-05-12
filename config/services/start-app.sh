#!/bin/sh

# Starts docker-compose stack:
cd /var/www/qed
export HOSTNAME=${HOSTNAME}
docker-compose up -d