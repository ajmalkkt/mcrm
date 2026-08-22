#!/usr/bin/env bash

set -e
echo -e "Run if its not executable -chmod +x start.sh stop.sh stop-refresh.sh"
echo -e "\033[0;32mStarting Docker containers in background...\033[0m"
docker compose --profile local-db up -d --build
echo -e "\033[0;32mServices started successfully!\033[0m"