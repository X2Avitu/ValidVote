@echo off
title ValidVote - Automated Launcher
echo ===================================================
echo   🗳️ ValidVote - Start-up Orchestration HUD
echo ===================================================
echo.
echo [1/4] Spinning up local Hardhat Ethereum node...
start "ValidVote - Local Ethereum Blockchain" cmd /k "cd backend && npx hardhat node"

echo Waiting 5 seconds for local blockchain node to start...
timeout /t 5 /nobreak > nul

echo.
echo [2/4] Deploying Commit-Reveal Solidity Contracts...
cd backend
call npx hardhat ignition deploy ./ignition/modules/ValidVote.ts --network localhost
cd ..

echo.
echo [3/4] Launching FastAPI Backend Server...
start "ValidVote - FastAPI AI Backend" cmd /k "cd backend && python api/server.py"

echo.
echo [4/4] Spinning up React / Vite Frontend Server...
start "ValidVote - React Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo 🚀 ValidVote has launched successfully!
echo.
echo Dashboard:  http://localhost:5173/
echo API Docs:   http://localhost:8000/docs
echo ===================================================
echo.
pause
