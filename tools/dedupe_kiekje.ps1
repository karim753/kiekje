<#
PowerShell helper to compare the workspace root and the nested `kiekje` folder.
Usage:
  - Preview differences:
    pwsh tools\dedupe_kiekje.ps1
  - Actually move the nested duplicate to a timestamped backup (safe):
    pwsh tools\dedupe_kiekje.ps1 -Remove

The script will NOT delete files; with -Remove it renames the nested folder to a backup name.
#>
param(
    [switch]$Remove
)

$root = Split-Path -Parent $PSScriptRoot
$primary = $root
$nested = Join-Path $root 'kiekje'

if (-not (Test-Path $nested)) {
    Write-Host "No nested 'kiekje' folder found at: $nested" -ForegroundColor Yellow
    exit 0
}

Write-Host "Primary: $primary"
Write-Host "Nested:  $nested"

function Get-RelPathHashes($base){
    $files = Get-ChildItem -Path $base -Recurse -File | ForEach-Object {
        $rel = $_.FullName.Substring($base.Length).TrimStart('\\','/')
        $hash = Get-FileHash -Algorithm SHA256 -Path $_.FullName
        [PSCustomObject]@{ RelPath = $rel; Hash = $hash.Hash; FullPath = $_.FullName }
    }
    return $files
}

Write-Host "Computing file hashes (this may take a moment)..."
$hashPrimary = Get-RelPathHashes $primary
$hashNested  = Get-RelPathHashes $nested

$mapPrimary = @{}
foreach($f in $hashPrimary){ $mapPrimary[$f.RelPath] = $f }
$mapNested = @{}
foreach($f in $hashNested){ $mapNested[$f.RelPath] = $f }

$onlyPrimary = @()
$onlyNested = @()
$identical = @()
$differing = @()

foreach($k in $mapPrimary.Keys){
    if($mapNested.ContainsKey($k)){
        if($mapPrimary[$k].Hash -eq $mapNested[$k].Hash){ $identical += $k } else { $differing += $k }
    } else { $onlyPrimary += $k }
}
foreach($k in $mapNested.Keys){ if(-not $mapPrimary.ContainsKey($k)){ $onlyNested += $k } }

Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Files only in primary: " ($onlyPrimary.Count)
Write-Host "  Files only in nested:  " ($onlyNested.Count)
Write-Host "  Identical files:       " ($identical.Count)
Write-Host "  Differing files:       " ($differing.Count)

if($onlyPrimary.Count -gt 0){ Write-Host "\nExamples (only in primary):"; $onlyPrimary[0..([math]::Min(9,$onlyPrimary.Count-1))] | ForEach-Object { Write-Host "  " $_ } }
if($onlyNested.Count -gt 0){ Write-Host "\nExamples (only in nested):"; $onlyNested[0..([math]::Min(9,$onlyNested.Count-1))] | ForEach-Object { Write-Host "  " $_ } }
if($differing.Count -gt 0){ Write-Host "\nExamples (differing files):"; $differing[0..([math]::Min(9,$differing.Count-1))] | ForEach-Object { Write-Host "  " $_ } }

if(-not $Remove){
    Write-Host "\nNo changes made. To move the nested duplicate to a backup, re-run with -Remove." -ForegroundColor Yellow
    exit 0
}

# Perform safe rename of nested folder
$timestamp = Get-Date -Format 'yyyyMMddHHmmss'
$backupName = "kiekje_backup_$timestamp"
$backupPath = Join-Path $root $backupName

Write-Host "Renaming nested folder to backup: $backupPath" -ForegroundColor Green
try{
    Rename-Item -Path $nested -NewName $backupName -ErrorAction Stop
    Write-Host "Nested folder renamed to: $backupPath" -ForegroundColor Green
    Write-Host "You can inspect the backup and remove it when you're confident." -ForegroundColor Cyan
}catch{
    Write-Host "Failed to rename folder: $_" -ForegroundColor Red
    exit 1
}

return 0
