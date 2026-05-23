# populate-queues-customer1.ps1
# Creates Customer1@gmail.com and populates queues with realistic crowd sizes.
# Map legend tiers: GREEN (0-5), YELLOW (6-15), RED (16+)

$API      = "http://localhost:8080/api"
$PASSWORD = "gwapo123"

$CrowdMap = [ordered]@{
    "HSBC Philippines"                              = 3
    "UnionBank of the Philippines - Cebu IT Park"   = 18
    "BPI Cebu Main Branch"                          = 22
    "Philippine Savings Bank - Cebu Uptown"         = 9
    "UnionBank Insular Building"                    = 4
    "Affinity Dental Clinics Cebu"                  = 7
    "D and G Dental Clinic"                         = 2
    "Cebu Dental Care Center"                       = 11
    "Metro Dental SM City Cebu"                     = 20
    "Green Apple Dental Clinic Cebu"                = 4
    "Cebu Doctors University Hospital"              = 25
    "St. Vincent General Hospital Cebu"             = 8
    "Adventist Hospital Cebu"                       = 6
    "VisayasMed Hospital"                           = 17
    "Cebu City Hall"                                = 24
    "Office of the Building Official"               = 19
    "Human Resource Development Office Cebu City"   = 13
    "Public Services Office Cebu City"              = 10
}

function Get-UserIdFromToken($token) {
    $headers = @{ "Authorization" = "Bearer $token" }
    try {
        $res = Invoke-WebRequest -Uri "$API/auth/me" `
            -Headers $headers -UseBasicParsing -TimeoutSec 10
        $parsed = ($res.Content | ConvertFrom-Json)
        # /me returns either .data.id or .id depending on wrapper
        if ($parsed.data) { return $parsed.data.id }
        return $parsed.id
    } catch {
        return $null
    }
}

function Register-Or-Login($email, $name) {
    $regBody = @{ name = $name; email = $email; password = $PASSWORD } | ConvertTo-Json
    try {
        $res = Invoke-WebRequest -Uri "$API/auth/register" `
            -Method POST -Body $regBody -ContentType "application/json" `
            -UseBasicParsing -TimeoutSec 15
        $data = ($res.Content | ConvertFrom-Json).data
        $uid = if ($data.id) { $data.id } else { Get-UserIdFromToken $data.token }
        return @{ token = $data.token; id = $uid; created = $true }
    } catch {
        $loginBody = @{ email = $email; password = $PASSWORD } | ConvertTo-Json
        try {
            $res = Invoke-WebRequest -Uri "$API/auth/login" `
                -Method POST -Body $loginBody -ContentType "application/json" `
                -UseBasicParsing -TimeoutSec 15
            $data = ($res.Content | ConvertFrom-Json).data
            $uid = if ($data.id) { $data.id } else { Get-UserIdFromToken $data.token }
            return @{ token = $data.token; id = $uid; created = $false }
        } catch {
            Write-Host "  Auth failed for $email" -ForegroundColor Red
            return $null
        }
    }
}

function Get-AdminToken {
    $body = @{ email = "admin@example.com"; password = "password123" } | ConvertTo-Json
    try {
        $res = Invoke-WebRequest -Uri "$API/auth/admin/login" `
            -Method POST -Body $body -ContentType "application/json" `
            -UseBasicParsing -TimeoutSec 10
        $data = ($res.Content | ConvertFrom-Json).data
        $uid = if ($data.id) { $data.id } else { Get-UserIdFromToken $data.token }
        return @{ token = $data.token; id = $uid }
    } catch {
        Write-Host "Admin login failed" -ForegroundColor Red
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
        Write-Host "Could not fetch office list" -ForegroundColor Red
        return @()
    }
}

function Join-Queue($userId, $officeId, $token) {
    $headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }
    try {
        $res = Invoke-WebRequest `
            -Uri "$API/queues/join?userId=$userId&officeId=$officeId" `
            -Method POST -Headers $headers -UseBasicParsing -TimeoutSec 15
        $data = ($res.Content | ConvertFrom-Json).data
        return $data.ticketNumber
    } catch {
        $errMsg = ""
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $errMsg = ($reader.ReadToEnd() | ConvertFrom-Json).message
        } catch {}
        if ($errMsg -notlike "*already have*") {
            Write-Host "      WARN: $errMsg" -ForegroundColor DarkYellow
        }
        return $null
    }
}

Write-Host ""
Write-Host "=== QuickQueue Queue Population ===" -ForegroundColor Cyan
Write-Host ""

# Step 1 - Create Customer1@gmail.com
Write-Host "-> Setting up Customer1@gmail.com..." -NoNewline
$customer1 = Register-Or-Login "Customer1@gmail.com" "Customer One"
if ($null -eq $customer1) {
    Write-Host " FAILED - aborting." -ForegroundColor Red
    exit 1
}
$statusText = if ($customer1.created) { "CREATED" } else { "already exists, logged in" }
Write-Host " $statusText (id=$($customer1.id))" -ForegroundColor Green

# Step 2 - Admin token and office list
Write-Host "-> Logging in as admin..." -NoNewline
$adminResult = Get-AdminToken
if ($null -eq $adminResult) { exit 1 }
$adminToken = $adminResult.token
Write-Host " OK" -ForegroundColor Green

Write-Host "-> Fetching approved offices..." -NoNewline
$offices = Get-AllOffices $adminToken
if ($offices.Count -eq 0) {
    Write-Host " NONE FOUND - make sure offices are seeded first." -ForegroundColor Red
    exit 1
}
Write-Host " Found $($offices.Count) offices" -ForegroundColor Green

# Step 3 - Populate queues
$virtualUserBase = 500
$totalTickets    = 0
$customer1Used   = $false

Write-Host ""
Write-Host "-> Populating queues..."
Write-Host ""

foreach ($office in $offices) {
    $officeName = $office.name
    $officeId   = if ($office.officeId) { $office.officeId } else { $office.id }

    $target = $CrowdMap[$officeName]
    if ($null -eq $target) {
        Write-Host "  [?] No crowd config for '$officeName' - skipping" -ForegroundColor DarkYellow
        continue
    }

    if ($target -ge 16) {
        $tier   = "RED   "
        $colour = "Red"
    } elseif ($target -ge 6) {
        $tier   = "YELLOW"
        $colour = "Yellow"
    } else {
        $tier   = "GREEN "
        $colour = "Green"
    }

    Write-Host "  [$tier $target people] $officeName" -ForegroundColor $colour

    $joined = 0

    # Drop Customer1 into the first high-queue office
    if ((-not $customer1Used) -and ($target -ge 16) -and ($customer1.id)) {
        $ticket = Join-Queue $customer1.id $officeId $customer1.token
        if ($ticket) {
            Write-Host "    * Customer1@gmail.com -> ticket $ticket  (primary user)" -ForegroundColor Magenta
            $joined++
        }
        $customer1Used = $true
        $target--
    }

    # Fill remaining slots with virtual users
    for ($i = 1; $i -le $target; $i++) {
        $email = "vq${virtualUserBase}@quickqueue.test"
        $uname = "VQueue $virtualUserBase"

        $user = Register-Or-Login $email $uname
        if ($null -ne $user -and $user.id) {
            $ticket = Join-Queue $user.id $officeId $user.token
            if ($ticket) {
                Write-Host "    + $email -> ticket $ticket" -ForegroundColor DarkGreen
                $joined++
            }
        }

        $virtualUserBase++
        Start-Sleep -Milliseconds 100
    }

    $totalTickets += $joined
    Write-Host "    -> $joined ticket(s) created"
    Write-Host ""
}

Write-Host "=== Seeding Complete ===" -ForegroundColor Cyan
Write-Host "Total tickets issued : $totalTickets"
Write-Host "Customer1@gmail.com  : id=$($customer1.id)"
Write-Host ""
Write-Host "Map legend tiers:" -ForegroundColor White
Write-Host "  GREEN  (0-5)  - quiet offices" -ForegroundColor Green
Write-Host "  YELLOW (6-15) - moderate offices" -ForegroundColor Yellow
Write-Host "  RED    (16+)  - busy offices" -ForegroundColor Red
Write-Host ""
