# ==============================================================================
# SkillBridge Phase 8.6 — Login & Authentication Regression Test Suite
# Tests: Login flow, JWT generation, CORS (localhost + 127.0.0.1), rate-limiting resilience
# ==============================================================================

$baseUrl = "http://localhost:5000/api"
$runId = [System.Guid]::NewGuid().ToString().Substring(0, 8)

$passed = 0
$failed = 0

function Assert-Test {
    param(
        [string]$Description,
        [bool]$Condition,
        [string]$Details = ""
    )
    if ($Condition) {
        Write-Host "  [PASS] $Description" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "  [FAIL] $Description" -ForegroundColor Red
        if ($Details) {
            Write-Host "         Detail: $Details" -ForegroundColor Yellow
        }
        $script:failed++
    }
}

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "SKILLBRIDGE PHASE 8.6 LOGIN REGRESSION SUITE" -ForegroundColor Cyan
Write-Host "Run ID: $runId" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. API Health Check
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Assert-Test "API server is healthy" ($health.success -eq $true)
} catch {
    Assert-Test "API server is healthy" $false $_.Exception.Message
}

# 2. Register fresh Student and Recruiter for login testing
$stdEmail = "login_std_$runId@example.com"
$stdPassword = "StudentPass123!"
$recEmail = "login_rec_$runId@example.com"
$recPassword = "RecruiterPass123!"

try {
    $stdRegBody = @{
        name = "Login Test Student"
        email = $stdEmail
        password = $stdPassword
        role = "student"
    } | ConvertTo-Json

    $stdReg = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $stdRegBody -ContentType "application/json"
    Assert-Test "Student registration succeeded" ($stdReg.success -eq $true -and $stdReg.user.role -eq "student")
} catch {
    Assert-Test "Student registration succeeded" $false $_.Exception.Message
}

try {
    $recRegBody = @{
        name = "Login Test Recruiter"
        email = $recEmail
        password = $recPassword
        role = "recruiter"
    } | ConvertTo-Json

    $recReg = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $recRegBody -ContentType "application/json"
    Assert-Test "Recruiter registration succeeded" ($recReg.success -eq $true -and $recReg.user.role -eq "recruiter")
} catch {
    Assert-Test "Recruiter registration succeeded" $false $_.Exception.Message
}

# 3. Valid Student Login
$stdToken = ""
try {
    $loginBody = @{
        email = $stdEmail
        password = $stdPassword
    } | ConvertTo-Json

    $loginResp = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $stdToken = $loginResp.token
    Assert-Test "Student login succeeds with 200" ($loginResp.success -eq $true)
    Assert-Test "Student login returns valid JWT token" ([string]::IsNullOrEmpty($stdToken) -eq $false)
    Assert-Test "Student login returns role 'student'" ($loginResp.user.role -eq "student")
    Assert-Test "Password omitted from student login response" ($loginResp.user.password -eq $null)
} catch {
    Assert-Test "Student login succeeds with 200" $false $_.Exception.Message
}

# 4. Valid Recruiter Login
$recToken = ""
try {
    $loginBody = @{
        email = $recEmail
        password = $recPassword
    } | ConvertTo-Json

    $loginResp = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $recToken = $loginResp.token
    Assert-Test "Recruiter login succeeds with 200" ($loginResp.success -eq $true)
    Assert-Test "Recruiter login returns role 'recruiter'" ($loginResp.user.role -eq "recruiter")
    Assert-Test "Password omitted from recruiter login response" ($loginResp.user.password -eq $null)
} catch {
    Assert-Test "Recruiter login succeeds with 200" $false $_.Exception.Message
}

# 5. Invalid Password Login (401)
try {
    $badPassBody = @{
        email = $stdEmail
        password = "WrongPassword999!"
    } | ConvertTo-Json

    $null = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $badPassBody -ContentType "application/json"
    Assert-Test "Login with wrong password rejected with 401" $false "Expected 401 but succeeded"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Assert-Test "Login with wrong password rejected with 401" ($status -eq 401)
}

# 6. Non-Existent User Login (401)
try {
    $noUserBody = @{
        email = "nonexistent_$runId@example.com"
        password = "SomePassword123!"
    } | ConvertTo-Json

    $null = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $noUserBody -ContentType "application/json"
    Assert-Test "Login with nonexistent email rejected with 401" $false "Expected 401 but succeeded"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Assert-Test "Login with nonexistent email rejected with 401" ($status -eq 401)
}

# 7. CORS: Login from Origin http://localhost:5173
try {
    $corsLocalhostBody = @{
        email = $stdEmail
        password = $stdPassword
    } | ConvertTo-Json

    $corsLocalResp = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method Post -Body $corsLocalhostBody -ContentType "application/json" -Headers @{ "Origin" = "http://localhost:5173" } -UseBasicParsing
    Assert-Test "CORS: Login with Origin http://localhost:5173 allowed (200)" ($corsLocalResp.StatusCode -eq 200)
    $allowOrigin = $corsLocalResp.Headers["Access-Control-Allow-Origin"]
    Assert-Test "CORS: Access-Control-Allow-Origin header set to http://localhost:5173" ($allowOrigin -eq "http://localhost:5173")
} catch {
    Assert-Test "CORS: Login with Origin http://localhost:5173 allowed" $false $_.Exception.Message
}

# 8. CORS: Login from Origin http://127.0.0.1:5173
try {
    $corsIpBody = @{
        email = $stdEmail
        password = $stdPassword
    } | ConvertTo-Json

    $corsIpResp = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method Post -Body $corsIpBody -ContentType "application/json" -Headers @{ "Origin" = "http://127.0.0.1:5173" } -UseBasicParsing
    Assert-Test "CORS: Login with Origin http://127.0.0.1:5173 allowed (200)" ($corsIpResp.StatusCode -eq 200)
    $allowIpOrigin = $corsIpResp.Headers["Access-Control-Allow-Origin"]
    Assert-Test "CORS: Access-Control-Allow-Origin header set to http://127.0.0.1:5173" ($allowIpOrigin -eq "http://127.0.0.1:5173")
} catch {
    Assert-Test "CORS: Login with Origin http://127.0.0.1:5173 allowed" $false $_.Exception.Message
}

# 9. CORS: Login from Untrusted Origin rejected with 403
try {
    $corsBadBody = @{
        email = $stdEmail
        password = $stdPassword
    } | ConvertTo-Json

    $null = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method Post -Body $corsBadBody -ContentType "application/json" -Headers @{ "Origin" = "http://malicious-site.example.com" } -UseBasicParsing
    Assert-Test "CORS: Untrusted origin rejected with 403" $false "Expected 403 but succeeded"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Assert-Test "CORS: Untrusted origin rejected with 403" ($status -eq 403)
}

# 10. Profile Hydration (/api/auth/me) with generated JWT
try {
    $headers = @{ Authorization = "Bearer $stdToken" }
    $meResp = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Get -Headers $headers
    Assert-Test "GET /api/auth/me succeeds with stored JWT (200)" ($meResp.success -eq $true)
    Assert-Test "GET /api/auth/me returns matching student email" ($meResp.user.email -eq $stdEmail)
    Assert-Test "GET /api/auth/me omits password hash" ($meResp.user.password -eq $null)
} catch {
    Assert-Test "GET /api/auth/me succeeds with stored JWT" $false $_.Exception.Message
}

# 11. Rate Limiting Resilience: Multiple calls in development do not hit 429
try {
    $no429 = $true
    for ($i = 0; $i -lt 10; $i++) {
        $check = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
        if ($check.success -ne $true) { $no429 = $false; break }
    }
    Assert-Test "Development rate limiter allows repeated requests without 429 lockout" $no429
} catch {
    Assert-Test "Development rate limiter allows repeated requests without 429 lockout" $false $_.Exception.Message
}

# 12. Logout Endpoint
try {
    $logoutResp = Invoke-RestMethod -Uri "$baseUrl/auth/logout" -Method Post
    Assert-Test "POST /api/auth/logout succeeds (200)" ($logoutResp.success -eq $true)
} catch {
    Assert-Test "POST /api/auth/logout succeeds" $false $_.Exception.Message
}

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "PHASE 8.6 TEST SUMMARY: $passed / $($passed + $failed) Passed" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

if ($failed -gt 0) {
    Write-Host "SOME PHASE 8.6 TESTS FAILED!" -ForegroundColor Red
    exit 1
} else {
    Write-Host "ALL PHASE 8.6 TESTS PASSED SUCCESSFULLY!" -ForegroundColor Green
    exit 0
}
