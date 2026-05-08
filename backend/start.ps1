# start.ps1 — Loads .env and starts the Spring Boot backend
# Usage: .\start.ps1

$envFile = Join-Path $PSScriptRoot ".env"

if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key   = $matches[1].Trim()
            $value = $matches[2].Trim()
            [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
            Write-Host "  Loaded: $key"
        }
    }
    Write-Host "✅ .env loaded`n"
} else {
    Write-Host "⚠️  No .env file found at $envFile — OAuth may fail`n"
}

Write-Host "🚀 Starting Spring Boot backend...`n"
& ".\mvnw.cmd" spring-boot:run
