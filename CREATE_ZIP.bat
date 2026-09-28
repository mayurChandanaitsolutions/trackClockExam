@echo off
title Exam Duty Management System - Create Project ZIP
echo =====================================================================
echo  Creating clean project ZIP file (Excluding node_modules and .git)
echo =====================================================================
echo.

set "SOURCE_DIR=%~dp0ExamDutyManagement"
set "ZIP_OUT=%USERPROFILE%\Desktop\Exam_Duty_Management_System.zip"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$src = '%SOURCE_DIR%';" ^
    "$zip = '%ZIP_OUT%';" ^
    "if (Test-Path $zip) { Remove-Item $zip -Force };" ^
    "$temp = Join-Path $env:TEMP ('ExamDutyZip_' + [System.Guid]::NewGuid().ToString().Substring(0,8));" ^
    "New-Item -ItemType Directory -Path $temp | Out-Null;" ^
    "Write-Host '1/2. Collecting source code and database files (skipping heavy node_modules)...' -ForegroundColor Cyan;" ^
    "$items = Get-ChildItem -Path $src -Recurse | Where-Object { $_.FullName -notmatch '[\\/](node_modules|\.git|dist|\.next)[\\/]?' };" ^
    "foreach ($i in $items) {" ^
    "    $rel = $i.FullName.Substring($src.Length);" ^
    "    $dst = Join-Path $temp ('ExamDutyManagement' + $rel);" ^
    "    if ($i.PSIsContainer) {" ^
    "        if (-not (Test-Path $dst)) { New-Item -ItemType Directory -Path $dst | Out-Null }" ^
    "    } else {" ^
    "        $p = Split-Path $dst;" ^
    "        if (-not (Test-Path $p)) { New-Item -ItemType Directory -Path $p | Out-Null };" ^
    "        Copy-Item -Path $i.FullName -Destination $dst -Force" ^
    "    }" ^
    "};" ^
    "Write-Host '2/2. Compressing into ZIP archive...' -ForegroundColor Cyan;" ^
    "Add-Type -AssemblyName System.IO.Compression.FileSystem;" ^
    "[System.IO.Compression.ZipFile]::CreateFromDirectory($temp, $zip, [System.IO.Compression.CompressionLevel]::Optimal, $true);" ^
    "Remove-Item -Path $temp -Recurse -Force;" ^
    "$mb = (Get-Item $zip).Length / 1MB;" ^
    "Write-Host ('SUCCESS! ZIP created at: ' + $zip + ' (' + [math]::Round($mb, 2) + ' MB)') -ForegroundColor Green;"

echo.
echo =====================================================================
echo  Done! Check your Desktop for 'Exam_Duty_Management_System.zip'
echo =====================================================================
pause
