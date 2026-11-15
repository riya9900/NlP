@echo off
rem Starts the API (port 8000) and the client (port 3000) in two windows.
start "API server" cmd /k "cd /d %~dp0server && uv run python server.py"
start "Client" cmd /k "cd /d %~dp0client && pnpm dev"
echo Opening http://localhost:3000 in a few seconds...
timeout /t 8 >nul
start http://localhost:3000
