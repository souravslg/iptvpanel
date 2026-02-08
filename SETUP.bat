@echo off
echo ========================================
echo ACTIVE USERS SETUP - STEP BY STEP
echo ========================================
echo.
echo Step 1: Opening Supabase SQL Editor...
echo.
start https://supabase.com/dashboard/project/utfblxhfyoebonlgtbwz/sql/new
echo.
echo Step 2: Copy the SQL from SETUP_ACTIVE_STREAMS.sql
echo.
echo Step 3: Paste it in the SQL Editor and click RUN
echo.
echo Step 4: You're done! The feature is ready to use.
echo.
echo ========================================
echo Opening SQL file for you to copy...
echo ========================================
timeout /t 2 >nul
notepad SETUP_ACTIVE_STREAMS.sql
