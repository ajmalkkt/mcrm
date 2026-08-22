#!/usr/bin/env bash

set -e

echo -e "\033[0;31mWARNING: Stopping containers and removing volumes (DB Data will be reset)...\033[0m"
docker compose --profile local-db down -v
echo -e "\033[0;32mContainers stopped and volumes removed successfully.\033[0m"