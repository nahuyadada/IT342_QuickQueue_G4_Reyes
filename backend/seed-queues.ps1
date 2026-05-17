# seed-queues.ps1
# Populates queues for all approved offices by creating virtual user accounts
# and having them "take a number" via the API.
#
# Crowd levels (waiting tickets per office):
#   RED    (busy)     : 15–25 people
#   YELLOW (moderate) : 6–14 people
#   GREEN  (low)      :  1–5  people
#
# Usage: .\seed-queues.ps1

$API      = "http://localhost:8080/api"
$PASSWORD = "gwapo123"

# ── Per-office target crowd sizes ───────────────────────────────────────────
# Key = exact office name (must match what was seeded),  Value = # of tickets
$CrowdMap = @{
    # Banks — mix of busy and quiet
    "HSBC Philippines"                          = 3   # GREEN  – quiet branch
    "UnionBank of the Philippines - Cebu IT Park" = 18  # RED    – IT Park rush
    "BPI Cebu Main Branch"                      = 22  # RED    – busiest bank
    "Philippine Savings Bank - Cebu Uptown"     = 9   # YELLOW – moderate
    "UnionBank Insular Building"                = 5   # GREEN  – light traffic

    # Dental Clinics — generally moderate
    "Affinity Dental Clinics Cebu"              = 7   # YELLOW
    "D&G Dental Clinic"                         = 2   # GREEN
    "Cebu Dental Care Center"                   = 11  # YELLOW
    "Metro Dental SM City Cebu"                 = 20  # RED    – SM weekend crowd
    "Green Apple Dental Clinic Cebu"            = 4   # GREEN

    # Hospitals — ERs and OPDs can be very busy
    "Cebu Doctors' University Hospital"         = 25  # RED    – major hospital
    "St. Vincent General Hospital Cebu"         = 8   # YELLOW
    "Adventist Hospital Cebu"                   = 6   # YELLOW
    "VisayasMed Hospital"                       = 17  # RED

    # Government Offices — notoriously long queues
    "Cebu City Hall"                            = 24  # RED    – city hall nightmare
    "Office of the Building Official"           = 19  # RED
    "Human Resource Development Office Cebu City" = 13 # YELLOW
    "Public Services Office Cebu City"          = 10  # YELLOW
}

# ── Helpers ──────────────────────────────────────────────────────────────────

function Get-AdminToken {
    $body = @{ email = "admin@example.com"; password = $PASSWORD } | ConvertTo-Json
    try {
        $res = Invoke-WebRequest -Uri "$API/auth/admin/login" `
            -Method POST -Body $body -ContentType "application/json" `
            -UseBasicParsing -TimeoutSec 10
        return ($res.Content | ConvertFrom-Json).data.token
    } catch {
        Write-Host "  [!] Admin login failed — cannot fetch office list" -ForegroundColor Red
        return $null
    }
}

function Get-AllOffices($adminToken) {
    $headers = @{ "Authorization" = "Bearer $adminToken" }
    try {
        $res = Invoke-WebRequest -Uri "$API/offices" `
            -Headers $headers -UseBasicParsing -TimeoutSec 10
        return ($res.Content | ConvertFrom-Json).data
    } catch {
        Write-Host "  [!] Could not fetch office list" -ForegroundColor Red
        return @()
    }
}

function Register-Or-Login($email, $name) {
    $regBody = @{ name = $name; email = $email; password = $PASSWORD } | ConvertTo-Json
    try {
        $res = Invoke-WebRequest -Uri "$API/auth/register" `
            -Method POST -Body $regBody -ContentType "application/json" `
            -UseBasicParsing -TimeoutSec 10
        $data = ($res.Content | ConvertFrom-Json).data
        return @{ token = $data.token; id = $data.id }
    } catch {
        # Already exists — login instead
        $loginBody = @{ email = $email; password = $PASSWORD } | ConvertTo-Json
        try {
            $res = Invoke-WebRequest -Uri "$API/auth/login" `
                -Method POST -Body $loginBody -ContentType "application/json" `
                -UseBasicParsing -TimeoutSec 10
            $data = ($res.Content | ConvertFrom-Json).data
            return @{ token = $data.token; id = $data.id }
        } catch {
            return $null
        }
    }
}

function Join-Queue($userId, $officeId, $token) {
    $headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }
    try {
        $res = Invoke-WebRequest `
            -Uri "$API/queues/join?userId=$userId&officeId=$officeId" `
            -Method POST -Headers $headers -UseBasicParsing -TimeoutSec 10
        $data = ($res.Content | ConvertFrom-Json).data
        return $data.ticketNumber
    } catch {
        $errMsg = ""
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $errMsg = ($reader.ReadToEnd() | ConvertFrom-Json).message
        } catch {}
        # Swallow "already has active ticket" silently — expected on re-runs
        if ($errMsg -notlike "*already have*") {
            Write-Host "      WARN: $errMsg" -ForegroundColor DarkYellow
        }
        return $null
    }
}

# ── Main ─────────────────────────────────────────────────────────────────────

Write-Host "`n╔══════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   QuickQueue — Queue Population      ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════╝`n" -ForegroundColor Cyan

# 1. Get admin token
Write-Host "→ Logging in as admin..." -NoNewline
$adminToken = Get-AdminToken
if (-not $adminToken) { exit 1 }
Write-Host " OK" -ForegroundColor Green

# 2. Get all approved offices
Write-Host "→ Fetching approved offices..." -NoNewline
$offices = Get-AllOffices $adminToken
if ($offices.Count -eq 0) {
    Write-Host " NONE FOUND — run seed-offices.ps1 first" -ForegroundColor Red
    exit 1
}
Write-Host " Found $($offices.Count) offices" -ForegroundColor Green

# 3. For each office, create N virtual users and join the queue
$virtualUserBase = 100   # starts at VQ100@quickqueue.test
$totalTickets = 0

foreach ($office in $offices) {
    $name    = $office.name
    $officeId = $office.officeId  # returned as 'officeId' by buildOfficeResponse

    # Determine how many people should be in this queue
    $target = $CrowdMap[$name]
    if ($null -eq $target) {
        Write-Host "  [?] No crowd config for '$name' — skipping" -ForegroundColor DarkYellow
        continue
    }

    # Determine label colour for display
    $label = switch {
        ($target -ge 15) { "RED    ($target people)" }
        ($target -ge 6)  { "YELLOW ($target people)" }
        default           { "GREEN  ($target people)" }
    }
    $colour = if ($target -ge 15) { "Red" } elseif ($target -ge 6) { "Yellow" } else { "Green" }

    Write-Host "`n[$label] $name (id=$officeId)" -ForegroundColor $colour

    $joined = 0
    for ($i = 1; $i -le $target; $i++) {
        $email = "vq${virtualUserBase}@quickqueue.test"
        $uname = "Virtual User $virtualUserBase"

        # Register / login virtual user
        $user = Register-Or-Login $email $uname
        if ($null -eq $user) {
            Write-Host "  [!] Could not auth $email" -ForegroundColor Red
            $virtualUserBase++
            continue
        }

        # Join the queue for this office
        $ticket = Join-Queue $user.id $officeId $user.token
        if ($ticket) {
            Write-Host "    ✓ $email → ticket $ticket" -ForegroundColor DarkGreen
            $joined++
        }

        $virtualUserBase++
    }

    $totalTickets += $joined
    Write-Host "  → $joined ticket(s) created for this office" -ForegroundColor Cyan
}

Write-Host "`n╔══════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Seeding Complete!                  ║" -ForegroundColor Cyan
Write-Host "║   Total tickets issued: $totalTickets" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════╝`n" -ForegroundColor Cyan
