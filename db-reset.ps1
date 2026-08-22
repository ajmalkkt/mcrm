Write-Host "WARNING: Stopping containers and removing volumes (DB Data will be reset)..." -ForegroundColor Red
docker compose --profile local-db down -v
Write-Host "Containers stopped and volumes removed successfully." -ForegroundColor Green