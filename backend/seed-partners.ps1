$API = "http://localhost:8080/api"

function Do-Register {
    param([string]$Name, [string]$Email, [string]$Password)
    $body = @{ name = $Name; email = $Email; password = $Password } | ConvertTo-Json -Depth 3
    try {
        $resp = Invoke-RestMethod -Method POST -Uri "$API/auth/register" -ContentType "application/json" -Body $body -ErrorAction Stop
        Write-Host "  [USER] Registered $Email (id=$($resp.data.id))" -ForegroundColor Green
        return $resp.data
    }
    catch {
        # Email already registered — try to login instead
        Write-Host "  [USER] $Email may already exist, trying login..." -ForegroundColor Yellow
        $loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json -Depth 3
        try {
            $loginResp = Invoke-RestMethod -Method POST -Uri "$API/auth/login" -ContentType "application/json" -Body $loginBody -ErrorAction Stop
            Write-Host "  [USER] Logged in as $Email (id=$($loginResp.data.id))" -ForegroundColor Green
            return $loginResp.data
        }
        catch {
            Write-Host "  [ERROR] Could not register or login $Email" -ForegroundColor Red
            return $null
        }
    }
}

function Do-RegisterOffice {
    param([string]$Token, [string]$OfficeName, [string]$Category, [string]$Type, [string]$Address, [double]$Lat, [double]$Lng, [string]$Phone)
    $bodyHash = @{
        name          = $OfficeName
        category      = $Category
        type          = $Type
        address       = $Address
        latitude      = $Lat
        longitude     = $Lng
        phoneNumber   = $Phone
        businessHours = '{"Monday":"09:00 - 17:00","Tuesday":"09:00 - 17:00","Wednesday":"09:00 - 17:00","Thursday":"09:00 - 17:00","Friday":"09:00 - 17:00","Saturday":"09:00 - 12:00","Sunday":"Closed"}'
    }
    $body = $bodyHash | ConvertTo-Json -Depth 3
    $headers = @{ Authorization = "Bearer $Token" }
    try {
        $resp = Invoke-RestMethod -Method POST -Uri "$API/offices/register" -ContentType "application/json" -Body $body -Headers $headers -ErrorAction Stop
        Write-Host "  [OFFICE] Created '$OfficeName' (officeId=$($resp.data.officeId))" -ForegroundColor Cyan
        return $resp.data
    }
    catch {
        Write-Host "  [SKIP] Office '$OfficeName' may already exist" -ForegroundColor Yellow
        return $null
    }
}

function Do-Approve {
    param([string]$AdminToken, [long]$OfficeId)
    $headers = @{ Authorization = "Bearer $AdminToken" }
    try {
        Invoke-RestMethod -Method PATCH -Uri "$API/admin/offices/registrations/$OfficeId/approve" -ContentType "application/json" -Headers $headers -ErrorAction Stop | Out-Null
        Write-Host "  [APPROVED] Office #$OfficeId" -ForegroundColor Green
    }
    catch {
        Write-Host "  [WARN] Approve #$OfficeId skipped (maybe already approved)" -ForegroundColor Yellow
    }
}

# === Login as Admin ===
Write-Host ""
Write-Host "=== Logging in as Admin ===" -ForegroundColor Magenta
$adminBody = @{ email = "admin@example.com"; password = "password123" } | ConvertTo-Json -Depth 3
try {
    $adminResp = Invoke-RestMethod -Method POST -Uri "$API/auth/admin/login" -ContentType "application/json" -Body $adminBody -ErrorAction Stop
    $adminToken = $adminResp.data.token
    Write-Host "  Admin token obtained." -ForegroundColor Green
}
catch {
    Write-Host "  [FATAL] Admin login failed. Is the backend running?" -ForegroundColor Red
    exit 1
}

# === Only the failed partners (4-10) ===
$entries = @(
    @{ Num=4;  OName="HSBC Philippines";                              DName="HSBC Philippines";      Cat="Bank & Finance";      Typ="BANKING";    Addr="Masbate Rd, Cebu City, 6000 Cebu, Philippines";                                    Lt=10.3158; Ln=123.8854; Ph="+63 32 231 1234" },
    @{ Num=5;  OName="UnionBank of the Philippines - Cebu IT Park";   DName="UnionBank IT Park";     Cat="Bank & Finance";      Typ="BANKING";    Addr="G/F Unit GF 01, TG Tower, Asiatown, Apas, Cebu City, Cebu, Philippines";           Lt=10.3310; Ln=123.9065; Ph="+63 32 232 2345" },
    @{ Num=6;  OName="BPI Cebu Main Branch";                          DName="BPI Cebu Main";         Cat="Bank & Finance";      Typ="BANKING";    Addr="Corner Magallanes and P. Burgos St, Cebu City, 6000 Cebu, Philippines";            Lt=10.2963; Ln=123.9020; Ph="+63 32 255 3456" },
    @{ Num=7;  OName="Philippine Savings Bank - Cebu Uptown";         DName="PSBank Cebu Uptown";    Cat="Bank & Finance";      Typ="BANKING";    Addr="Insular Life Cebu Business Centre, Cebu City, Philippines";                        Lt=10.3175; Ln=123.9050; Ph="+63 32 233 4567" },
    @{ Num=8;  OName="UnionBank Insular Building";                    DName="UnionBank Insular";     Cat="Bank & Finance";      Typ="BANKING";    Addr="Mindanao Ave corner Biliran Rd, Cebu City, Philippines";                           Lt=10.3178; Ln=123.9055; Ph="+63 32 234 5678" },
    @{ Num=9;  OName="Affinity Dental Clinics Cebu";                  DName="Affinity Dental";       Cat="Dental Clinic";       Typ="DENTAL";     Addr="eBloc 2 Tower, IT Park, Cebu City, Philippines";                                   Lt=10.3310; Ln=123.9068; Ph="+63 32 412 1234" },
    @{ Num=10; OName="D and G Dental Clinic";                         DName="D and G Dental";        Cat="Dental Clinic";       Typ="DENTAL";     Addr="Dionisio Jakosalem St, Cebu City, Philippines";                                    Lt=10.3085; Ln=123.8948; Ph="+63 32 413 2345" }
)

foreach ($e in $entries) {
    $email = "Partner$($e.Num)@gmail.com"
    Write-Host ""
    Write-Host "--- Partner $($e.Num): $($e.OName) ---" -ForegroundColor White

    $partner = Do-Register -Name $e.DName -Email $email -Password "gwapo123"
    if (-not $partner) { continue }

    $office = Do-RegisterOffice -Token $partner.token -OfficeName $e.OName -Category $e.Cat -Type $e.Typ -Address $e.Addr -Lat $e.Lt -Lng $e.Ln -Phone $e.Ph
    if ($office -and $office.officeId) {
        Do-Approve -AdminToken $adminToken -OfficeId $office.officeId
    }
}

Write-Host ""
Write-Host "=== RETRY COMPLETE ===" -ForegroundColor Magenta
