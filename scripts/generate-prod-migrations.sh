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

if [ -d "$SCRIPT_DIR/../prod-volumes" ]; then
    echo "prod-volumes directory found! Please remove it before running this script."
    exit 1
fi

if [ -z "$1" ]; then
    echo "Please provide a name for the migration!"
    exit 1
fi

export DB_HOST=localhost
docker compose --env-file $ENV_FILE -f $DOCKER_COMPOSE_FILE up -d db

echo "Waiting for db to be healthy..."

while ! docker inspect --format '{{json .State.Health.Status}}' db | grep -q healthy; do
    echo "Current db status: $(docker inspect --format '{{json .State.Health.Status}}' db)"
    sleep 1
done

echo "db is healthy!"

yarn migration:run

yarn migration:generate "$SCRIPT_DIR/../src/database/migrations/$1"

docker compose --env-file $ENV_FILE -f $DOCKER_COMPOSE_FILE down
