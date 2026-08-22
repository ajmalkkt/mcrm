Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Stopping ERP Services..." -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
docker compose --profile local-db down

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Starting & Rebuilding ERP Services..." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
docker compose --profile local-db up -d --build

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " ERP Services Successfully Restarted!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
docker compose ps