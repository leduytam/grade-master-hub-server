#!/bin/sh

# Get the absolute path of the script
SCRIPT_DIR=$(realpath "$(dirname "$0")")

# Construct the absolute path of .env.production
ENV_FILE="$SCRIPT_DIR/../.env.production"

# Construct the absolute path of docker-compose.prod.yml
DOCKER_COMPOSE_FILE="$SCRIPT_DIR/../docker-compose.prod.yml"


if [ ! -f $ENV_FILE ]; then
    echo "File .env.production not found!"
    exit 1
fi

docker compose --env-file $ENV_FILE -f $DOCKER_COMPOSE_FILE down
