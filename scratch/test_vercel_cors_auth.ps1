# Verification of Vercel Production Origin CORS and Auth Endpoints
$origin = "https://skill-bridge-dokcv8jd0-ayan-biswas.vercel.app"
$baseUrl = "http://localhost:5000/api"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "VERCEL CORS & AUTH ENDPOINTS VERIFICATION" -ForegroundColor Cyan
Write-Host "Target Origin: $origin" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. OPTIONS /api/auth/login
Write-Host "`n1. Testing OPTIONS /api/auth/login..."
$opt = curl.exe -s -i -X OPTIONS "$baseUrl/auth/login" -H "Origin: $origin" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type,Authorization"
$optAllow = ($opt | Select-String "Access-Control-Allow-Origin: $origin")
$optMethods = ($opt | Select-String "Access-Control-Allow-Methods:")
if ($optAllow -and $optMethods) {
    Write-Host "   [PASS] OPTIONS preflight succeeded with Access-Control-Allow-Origin: $origin" -ForegroundColor Green
} else {
    Write-Host "   [FAIL] OPTIONS preflight missing CORS headers" -ForegroundColor Red
    Write-Host ($opt | Out-String)
}

# 2. POST /api/auth/register with Origin header
Write-Host "`n2. Testing POST /api/auth/register with Origin header..."
$testEmail = "vercel_origin_test_$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())@example.com"
$regPayload = @{
    name = "Vercel Test Student"
    email = $testEmail
    password = "VercelPassword123!"
    role = "student"
} | ConvertTo-Json

$regHeaders = @{
    "Origin" = $origin
    "Content-Type" = "application/json"
}

try {
    $regRes = Invoke-WebRequest -Uri "$baseUrl/auth/register" -Method Post -Body $regPayload -Headers $regHeaders -UseBasicParsing
    $regJson = $regRes.Content | ConvertFrom-Json
    $regCors = $regRes.Headers["Access-Control-Allow-Origin"]
    if ($regRes.StatusCode -eq 201 -and $regCors -eq $origin) {
        Write-Host "   [PASS] Registration succeeded (Status 201, Token Issued, CORS header verified)" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] Registration failed or missing CORS: Status $($regRes.StatusCode)" -ForegroundColor Red
    }
    $token = $regJson.token
} catch {
    Write-Host "   [FAIL] Registration error: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. POST /api/auth/login with Origin header
Write-Host "`n3. Testing POST /api/auth/login with Origin header..."
$loginPayload = @{
    email = $testEmail
    password = "VercelPassword123!"
} | ConvertTo-Json

try {
    $loginRes = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method Post -Body $loginPayload -Headers $regHeaders -UseBasicParsing
    $loginJson = $loginRes.Content | ConvertFrom-Json
    $loginCors = $loginRes.Headers["Access-Control-Allow-Origin"]
    if ($loginRes.StatusCode -eq 200 -and $loginCors -eq $origin) {
        Write-Host "   [PASS] Login succeeded (Status 200, Role: $($loginJson.user.role), CORS header verified)" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] Login failed or missing CORS: Status $($loginRes.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "   [FAIL] Login error: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. GET /api/auth/me with Bearer Token and Origin header
Write-Host "`n4. Testing GET /api/auth/me with Bearer Token and Origin header..."
$authHeaders = @{
    "Origin" = $origin
    "Authorization" = "Bearer $token"
}

try {
    $meRes = Invoke-WebRequest -Uri "$baseUrl/auth/me" -Method Get -Headers $authHeaders -UseBasicParsing
    $meJson = $meRes.Content | ConvertFrom-Json
    $meCors = $meRes.Headers["Access-Control-Allow-Origin"]
    if ($meRes.StatusCode -eq 200 -and $meCors -eq $origin -and $meJson.user.email -eq $testEmail) {
        Write-Host "   [PASS] GET /api/auth/me succeeded (Status 200, User: $($meJson.user.email), CORS header verified)" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] GET /api/auth/me failed or missing CORS" -ForegroundColor Red
    }
} catch {
    Write-Host "   [FAIL] GET /api/auth/me error: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Untrusted origin check
Write-Host "`n5. Testing Untrusted Origin (http://evil-attacker.example)..."
try {
    $evilRes = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method Post -Body $loginPayload -Headers @{ "Origin" = "http://evil-attacker.example"; "Content-Type" = "application/json" } -UseBasicParsing
    Write-Host "   [FAIL] Untrusted origin was NOT blocked! Status $($evilRes.StatusCode)" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 403) {
        Write-Host "   [PASS] Untrusted origin correctly rejected with 403 Forbidden" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] Unexpected status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "VERCEL CORS & AUTH CHECKS COMPLETE" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
