@echo off
echo ============================================
echo Pushing Auto-IPTV to your GitHub account
echo ============================================
echo.

cd "c:\Users\soura\Desktop\Auto-IPTV"

echo Step 1: Changing remote URL to your GitHub account...
git remote set-url origin https://github.com/souravslg/Auto-IPTV.git

echo.
echo Step 2: Verifying remote URL...
git remote -v

echo.
echo Step 3: Creating repository on GitHub...
echo Please create a new repository on GitHub first:
echo   1. Go to: https://github.com/new
echo   2. Repository name: Auto-IPTV
echo   3. Keep it public or private (your choice)
echo   4. Do NOT initialize with README, .gitignore, or license
echo   5. Click "Create repository"
echo.
pause

echo.
echo Step 4: Pushing to your GitHub account...
git push -u origin main

echo.
echo ============================================
echo Done! Your repository should now be on GitHub
echo ============================================
pause
