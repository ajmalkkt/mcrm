@echo off
echo Stopping Docker containers...
docker compose --profile local-db down
echo Services stopped.