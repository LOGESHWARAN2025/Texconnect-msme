# =====================================================
# CLEANUP SCRIPT - Remove Unwanted SQL and TXT Files
# =====================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CLEANUP: Removing Unwanted Files" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Files to KEEP (Essential ones)
$keepFiles = @(
    "COMPLETE-INVOICE-FIX.sql",
    "FIX-ALL-ORDERS-ONE-ITEM.sql",
    "FIX-ALL-UPDATEDAT-COLUMNS.sql",
    "supabase-schema.sql",
    "CREATE-FEEDBACK-AND-ISSUES-TABLES.sql"
)

# Get all SQL files in root directory
$sqlFiles = Get-ChildItem -Path "." -Filter "*.sql" -File

Write-Host "`nSQL Files Found: $($sqlFiles.Count)" -ForegroundColor Yellow

# Remove unwanted SQL files
$removedSql = 0
foreach ($file in $sqlFiles) {
    if ($keepFiles -notcontains $file.Name) {
        Write-Host "Removing: $($file.Name)" -ForegroundColor Red
        Remove-Item $file.FullName -Force
        $removedSql++
    } else {
        Write-Host "Keeping: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "SQL Files Removed: $removedSql" -ForegroundColor Yellow
Write-Host "SQL Files Kept: $($keepFiles.Count)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

# Get all TXT files in root directory (excluding node_modules)
$txtFiles = Get-ChildItem -Path "." -Filter "*.txt" -File | Where-Object { $_.FullName -notlike "*node_modules*" }

Write-Host "`nTXT Files Found: $($txtFiles.Count)" -ForegroundColor Yellow

# Remove all TXT files (except in node_modules)
$removedTxt = 0
foreach ($file in $txtFiles) {
    Write-Host "Removing: $($file.Name)" -ForegroundColor Red
    Remove-Item $file.FullName -Force
    $removedTxt++
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TXT Files Removed: $removedTxt" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n✅ CLEANUP COMPLETE!" -ForegroundColor Green
Write-Host "`nKept Essential Files:" -ForegroundColor Cyan
foreach ($file in $keepFiles) {
    Write-Host "  ✓ $file" -ForegroundColor Green
}

Write-Host "`nPress any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
