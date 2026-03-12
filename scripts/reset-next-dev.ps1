$ErrorActionPreference = 'SilentlyContinue'

$repoPath = Resolve-Path (Join-Path $PSScriptRoot '..')
$lockFile = Join-Path $repoPath '.next\dev\lock'

$connections = Get-NetTCPConnection -LocalPort 3000,3001
if ($connections) {
    $portsPids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($procId in $portsPids) {
        Stop-Process -Id $procId -Force
    }
}

if (Test-Path $lockFile) {
    Remove-Item $lockFile -Force
}

Write-Output 'reset-next-dev: cleanup completed.'
