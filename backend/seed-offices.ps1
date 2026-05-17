# seed-offices.ps1 — Creates partner accounts and registers offices via the API
# Usage: .\seed-offices.ps1

$API = "http://localhost:8080/api"
$PASSWORD = "gwapo123"

# ── Office data ──
$offices = @(
    # Banks
    @{ name="HSBC Philippines"; category="Bank & Finance"; type="Bank"; address="Masbate Rd, Cebu City, 6000 Cebu, Philippines"; lat=10.3158; lng=123.8854; phone="555-1001" },
    @{ name="UnionBank of the Philippines - Cebu IT Park"; category="Bank & Finance"; type="Bank"; address="G/F Unit GF 01, TG Tower, Asiatown, Apas, Cebu City, Cebu, Philippines"; lat=10.3310; lng=123.9065; phone="555-1002" },
    @{ name="BPI Cebu Main Branch"; category="Bank & Finance"; type="Bank"; address="Corner Magallanes and P. Burgos St, Cebu City, 6000 Cebu, Philippines"; lat=10.2963; lng=123.9020; phone="555-1003" },
    @{ name="Philippine Savings Bank - Cebu Uptown"; category="Bank & Finance"; type="Bank"; address="Insular Life Cebu Business Centre, Cebu City, Philippines"; lat=10.3175; lng=123.9050; phone="555-1004" },
    @{ name="UnionBank Insular Building"; category="Bank & Finance"; type="Bank"; address="Mindanao Ave corner Biliran Rd, Cebu City, Philippines"; lat=10.3178; lng=123.9055; phone="555-1005" },

    # Dental Clinics
    @{ name="Affinity Dental Clinics Cebu"; category="Dental Clinic"; type="Dental Clinic"; address="eBloc 2 Tower, IT Park, Cebu City, Philippines"; lat=10.3310; lng=123.9068; phone="555-2001" },
    @{ name="D&G Dental Clinic"; category="Dental Clinic"; type="Dental Clinic"; address="Dionisio Jakosalem St, Cebu City, Philippines"; lat=10.3085; lng=123.8948; phone="555-2002" },
    @{ name="Cebu Dental Care Center"; category="Dental Clinic"; type="Dental Clinic"; address="St. Patrick Square, R. Aboitiz St, Cebu City, Philippines"; lat=10.3140; lng=123.8935; phone="555-2003" },
    @{ name="Metro Dental SM City Cebu"; category="Dental Clinic"; type="Dental Clinic"; address="SM City Cebu, North Reclamation Area, Mabolo, Cebu City"; lat=10.3115; lng=123.9189; phone="555-2004" },
    @{ name="Green Apple Dental Clinic Cebu"; category="Dental Clinic"; type="Dental Clinic"; address="Ayala Center Cebu Terraces, Cebu City, Philippines"; lat=10.3173; lng=123.9058; phone="555-2005" },

    # Hospitals
    @{ name="Cebu Doctors' University Hospital"; category="Hospital"; type="Hospital"; address="Osmena Blvd, Cebu City, 6000 Cebu, Philippines"; lat=10.3113; lng=123.8952; phone="555-3001" },
    @{ name="St. Vincent General Hospital Cebu"; category="Hospital"; type="Hospital"; address="R. Landon Ext, Cebu City, Philippines"; lat=10.3098; lng=123.8925; phone="555-3002" },
    @{ name="Adventist Hospital Cebu"; category="Hospital"; type="Hospital"; address="Cebu City, Philippines"; lat=10.3180; lng=123.8850; phone="555-3003" },
    @{ name="VisayasMed Hospital"; category="Hospital"; type="Hospital"; address="Osmena Blvd, Cebu City, Philippines"; lat=10.3095; lng=123.8970; phone="555-3004" },

    # Government Offices
    @{ name="Cebu City Hall"; category="Government Office"; type="Government Office"; address="No. 1 Dr Jose P. Rizal St, Cebu City"; lat=10.2933; lng=123.9019; phone="555-4001" },
    @{ name="Office of the Building Official"; category="Government Office"; type="Government Office"; address="Cebu City Hall, Cebu City"; lat=10.2933; lng=123.9019; phone="555-4002" },
    @{ name="Human Resource Development Office Cebu City"; category="Government Office"; type="Government Office"; address="Cebu City Hall Annex, Cebu City"; lat=10.2935; lng=123.9022; phone="555-4003" },
    @{ name="Public Services Office Cebu City"; category="Government Office"; type="Government Office"; address="Ramos Area, Cebu City"; lat=10.3080; lng=123.8965; phone="555-4004" }
)

Write-Host "`n=== QuickQueue Office Seeder ===" -ForegroundColor Cyan
Write-Host "Creating $($offices.Count) partner accounts and offices...`n"

$partnerNum = 4  # Starting from Partner4

foreach ($office in $offices) {
    $email = "Partner${partnerNum}@gmail.com"
    $partnerName = $office.name + " Manager"

    # Step 1: Register partner account
    Write-Host "[$partnerNum] Registering $email..." -NoNewline
    $regBody = @{ name = $partnerName; email = $email; password = $PASSWORD } | ConvertTo-Json
    try {
        $regRes = Invoke-WebRequest -Uri "$API/auth/register" -Method POST -Body $regBody -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
        $regData = ($regRes.Content | ConvertFrom-Json).data
        $token = $regData.token
        $userId = $regData.id
        Write-Host " OK (id=$userId)" -ForegroundColor Green
    } catch {
        # Account may already exist — try login
        $loginBody = @{ email = $email; password = $PASSWORD } | ConvertTo-Json
        try {
            $loginRes = Invoke-WebRequest -Uri "$API/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
            $loginData = ($loginRes.Content | ConvertFrom-Json).data
            $token = $loginData.token
            $userId = $loginData.id
            Write-Host " EXISTS (id=$userId)" -ForegroundColor Yellow
        } catch {
            Write-Host " FAILED" -ForegroundColor Red
            $partnerNum++
            continue
        }
    }

    # Step 2: Register office
    Write-Host "    -> Creating office: $($office.name)..." -NoNewline
    $officeBody = @{
        name         = $office.name
        type         = $office.type
        category     = $office.category
        address      = $office.address
        latitude     = $office.lat
        longitude    = $office.lng
        phoneNumber  = $office.phone
    } | ConvertTo-Json

    $headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }
    try {
        $officeRes = Invoke-WebRequest -Uri "$API/offices/register" -Method POST -Body $officeBody -Headers $headers -UseBasicParsing -TimeoutSec 10
        Write-Host " OK" -ForegroundColor Green
    } catch {
        $errStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errStream)
        $errBody = $reader.ReadToEnd()
        Write-Host " FAILED: $errBody" -ForegroundColor Red
    }

    # Step 3: Auto-approve the office (using admin endpoint)
    # First get admin token
    if (-not $adminToken) {
        $adminLoginBody = @{ email = "admin@example.com"; password = $PASSWORD } | ConvertTo-Json
        try {
            $adminRes = Invoke-WebRequest -Uri "$API/auth/admin/login" -Method POST -Body $adminLoginBody -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
            $adminToken = ($adminRes.Content | ConvertFrom-Json).data.token
        } catch {
            Write-Host "    -> Admin login failed, offices will be PENDING" -ForegroundColor Yellow
        }
    }

    if ($adminToken) {
        # Get pending registrations to find this office
        try {
            $pendingHeaders = @{ "Authorization" = "Bearer $adminToken"; "Content-Type" = "application/json" }
            $pendingRes = Invoke-WebRequest -Uri "$API/admin/offices/registrations/pending" -Headers $pendingHeaders -UseBasicParsing -TimeoutSec 10
            $pendingList = ($pendingRes.Content | ConvertFrom-Json).data
            $thisOffice = $pendingList | Where-Object { $_.name -eq $office.name } | Select-Object -First 1
            if ($thisOffice) {
                Write-Host "    -> Approving office #$($thisOffice.id)..." -NoNewline
                $approveRes = Invoke-WebRequest -Uri "$API/admin/offices/registrations/$($thisOffice.id)/approve" -Method PATCH -Headers $pendingHeaders -UseBasicParsing -TimeoutSec 10
                Write-Host " APPROVED" -ForegroundColor Green
            }
        } catch {
            Write-Host "    -> Auto-approve failed" -ForegroundColor Yellow
        }
    }

    $partnerNum++
}

Write-Host "`n=== Seeding Complete ===" -ForegroundColor Cyan
Write-Host "Created $($offices.Count) partner accounts (Partner4@gmail.com - Partner$($partnerNum - 1)@gmail.com)"
Write-Host "Password for all: $PASSWORD`n"
