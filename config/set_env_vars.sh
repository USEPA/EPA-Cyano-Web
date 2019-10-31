#!/bin/bash

# Sets env vars from .env file for unix-based systems
# To run> . set_env_vars.sh env_file_of_choice

ENV_FILE=$1  # reads argument for env filename

export QED_CONFIG=$ENV_FILE  # used in docker-compose.yml for setting env vars in containers
echo QED_CONFIG=$QED_CONFIG

while read p; do
	echo $p
	export $p
done <$ENV_FILE