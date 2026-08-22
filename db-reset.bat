@echo off
echo WARNING: Stopping containers and removing volumes (DB Data will be reset)...
docker compose --profile local-db down -v
echo Containers stopped and volumes removed successfully.