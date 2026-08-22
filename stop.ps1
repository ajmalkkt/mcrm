Write-Host "Stopping Docker containers..." -ForegroundColor Yellow
docker compose --profile local-db down
Write-Host "Services stopped." -ForegroundColor Green