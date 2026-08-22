@echo off
echo Starting Docker containers in background...
docker compose --profile local-db up -d --build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to start services.
    exit /b %ERRORLEVEL%
)
echo Services started successfully!