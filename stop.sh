#!/usr/bin/env bash

set -e

echo -e "\033[0;33mStopping Docker containers...\033[0m"
docker compose --profile local-db down
echo -e "\033[0;32mServices stopped.\033[0m"