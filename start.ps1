Write-Host "Starting Docker containers in background..." -ForegroundColor Green
write-Host "Run if its not executable - Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser" -ForegroundColor Yellow
docker compose --profile local-db up -d --build
if ($LASTEXITCODE -eq 0) {
    Write-Host "Services started successfully!" -ForegroundColor Green
} else {
    Write-Host "Failed to start services." -ForegroundColor Red
}