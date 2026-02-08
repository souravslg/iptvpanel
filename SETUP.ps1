# Active Users Setup Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ACTIVE USERS SETUP - AUTOMATED" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Open Supabase SQL Editor
Write-Host "Step 1: Opening Supabase SQL Editor..." -ForegroundColor Yellow
Start-Process "https://supabase.com/dashboard/project/utfblxhfyoebonlgtbwz/sql/new"
Start-Sleep -Seconds 2

# Step 2: Read SQL file
Write-Host "Step 2: Reading SQL setup file..." -ForegroundColor Yellow
$sqlContent = Get-Content "SETUP_ACTIVE_STREAMS.sql" -Raw

# Step 3: Copy to clipboard
Write-Host "Step 3: Copying SQL to clipboard..." -ForegroundColor Yellow
Set-Clipboard -Value $sqlContent

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ READY TO PASTE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "The SQL has been copied to your clipboard!" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "1. Go to the Supabase SQL Editor (opened in browser)" -ForegroundColor White
Write-Host "2. Press Ctrl+V to paste the SQL" -ForegroundColor White
Write-Host "3. Click the RUN button" -ForegroundColor White
Write-Host "4. Done! Your feature is ready to use." -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
