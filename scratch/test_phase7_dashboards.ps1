# Phase 7 Dashboard Verification Test Suite
# Tests:
# 1. Authentication (Student & Recruiter logins)
# 2. Student Dashboard data retrieval & statistics calculation
# 3. Recruiter Dashboard data retrieval (opportunities & applicant pipeline)
# 4. Cross-recruiter applicant access rejection (403 Forbidden)
# 5. Role protection & unauthenticated rejection (401 / 403)
# 6. Tolerant partial failure behavior

$baseUrl = "http://localhost:5000"
$headers = @{ "Content-Type" = "application/json" }
$testId = [System.Guid]::NewGuid().ToString().Substring(0, 8)

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "SKILLBRIDGE PHASE 7 TEST SUITE (Dashboards)" -ForegroundColor Cyan
Write-Host "Run ID: $testId" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$passedCount = 0
$totalCount = 0

function Assert-Test {
    param(
        [string]$TestName,
        [bool]$Condition,
        [string]$Details = ""
    )
    $script:totalCount++
    if ($Condition) {
        $script:passedCount++
        Write-Host "  [PASS] $TestName" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] $TestName" -ForegroundColor Red
        if ($Details) {
            Write-Host "         Details: $Details" -ForegroundColor Yellow
        }
    }
}

# 1. Health check
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method Get
    Assert-Test "API server is healthy" ($health.success -eq $true)
} catch {
    Write-Host "Fatal: Cannot connect to API server at $baseUrl." -ForegroundColor Red
    exit 1
}

# 2. Register fresh Student and Two Recruiters
$studentEmail = "p7.student.$testId@example.com"
$recruiter1Email = "p7.recruiter1.$testId@example.com"
$recruiter2Email = "p7.recruiter2.$testId@example.com"
$testPassword = "Password123!"

$studentReg = @{ name = "P7 Student"; email = $studentEmail; password = $testPassword; role = "student" } | ConvertTo-Json
$recruiter1Reg = @{ name = "P7 Recruiter One"; email = $recruiter1Email; password = $testPassword; role = "recruiter" } | ConvertTo-Json
$recruiter2Reg = @{ name = "P7 Recruiter Two"; email = $recruiter2Email; password = $testPassword; role = "recruiter" } | ConvertTo-Json

$studentToken = ""
$recruiter1Token = ""
$recruiter2Token = ""

try {
    $sRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $studentReg -Headers $headers
    $studentToken = $sRes.token
    Assert-Test "Student registration succeeds" ($sRes.success -eq $true -and $studentToken -ne "")
} catch {
    Assert-Test "Student registration succeeds" $false $_.Exception.Message
}

try {
    $r1Res = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $recruiter1Reg -Headers $headers
    $recruiter1Token = $r1Res.token
    Assert-Test "Recruiter 1 registration succeeds" ($r1Res.success -eq $true -and $recruiter1Token -ne "")
} catch {
    Assert-Test "Recruiter 1 registration succeeds" $false $_.Exception.Message
}

try {
    $r2Res = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $recruiter2Reg -Headers $headers
    $recruiter2Token = $r2Res.token
    Assert-Test "Recruiter 2 registration succeeds" ($r2Res.success -eq $true -and $recruiter2Token -ne "")
} catch {
    Assert-Test "Recruiter 2 registration succeeds" $false $_.Exception.Message
}

# Login checks
$loginPayload = @{ email = $studentEmail; password = $testPassword } | ConvertTo-Json
try {
    $loginRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginPayload -Headers $headers
    Assert-Test "Student login succeeds" ($loginRes.success -eq $true -and $loginRes.token -ne "")
} catch {
    Assert-Test "Student login succeeds" $false $_.Exception.Message
}

$recLoginPayload = @{ email = $recruiter1Email; password = $testPassword } | ConvertTo-Json
try {
    $recLoginRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $recLoginPayload -Headers $headers
    Assert-Test "Recruiter login succeeds" ($recLoginRes.success -eq $true -and $recLoginRes.token -ne "")
} catch {
    Assert-Test "Recruiter login succeeds" $false $_.Exception.Message
}

$studentHeaders = @{ "Authorization" = "Bearer $studentToken"; "Content-Type" = "application/json" }
$recruiter1Headers = @{ "Authorization" = "Bearer $recruiter1Token"; "Content-Type" = "application/json" }
$recruiter2Headers = @{ "Authorization" = "Bearer $recruiter2Token"; "Content-Type" = "application/json" }

# ==============================================================================
# SECTION 1: RECRUITER POSTS OPPORTUNITY & STUDENT APPLIES
# ==============================================================================
Write-Host "`n--- Setup: Recruiter Post & Student Application ---" -ForegroundColor Yellow

$oppPayload = @{
    title = "Dashboard Test Engineer $testId"
    company = "SkillBridge Labs"
    description = "Role for validating dashboard metrics calculation."
    type = "internship"
    workMode = "remote"
    location = "Austin, TX"
    skills = @("React", "Node.js", "Express")
    stipend = "$3,200/mo"
} | ConvertTo-Json

$oppId = ""
try {
    $oppPost = Invoke-RestMethod -Uri "$baseUrl/api/opportunities" -Method Post -Body $oppPayload -Headers $recruiter1Headers
    $oppId = $oppPost.data._id
    Assert-Test "Recruiter 1 creates test opportunity" ($oppPost.success -eq $true -and $oppId -ne "")
} catch {
    Assert-Test "Recruiter 1 creates test opportunity" $false $_.Exception.Message
}

$appPayload = @{
    opportunity = $oppId
    coverLetter = "Student application for dashboard metrics calculation test."
} | ConvertTo-Json

$appId = ""
try {
    $appPost = Invoke-RestMethod -Uri "$baseUrl/api/applications" -Method Post -Body $appPayload -Headers $studentHeaders
    $appId = $appPost.data._id
    Assert-Test "Student applies to test opportunity" ($appPost.success -eq $true -and $appId -ne "")
} catch {
    Assert-Test "Student applies to test opportunity" $false $_.Exception.Message
}

# Transition application status to 'Shortlisted'
try {
    $statusUpdate = @{ status = "Shortlisted" } | ConvertTo-Json
    $stRes = Invoke-RestMethod -Uri "$baseUrl/api/applications/$appId/status" -Method Put -Body $statusUpdate -Headers $recruiter1Headers
    Assert-Test "Recruiter 1 updates candidate status to 'Shortlisted'" ($stRes.success -eq $true -and $stRes.data.status -eq "Shortlisted")
} catch {
    Assert-Test "Recruiter 1 updates candidate status to 'Shortlisted'" $false $_.Exception.Message
}

# ==============================================================================
# SECTION 2: STUDENT DASHBOARD DATA & STATS DERIVATION
# ==============================================================================
Write-Host "`n--- Section 2: Student Dashboard Data Verification ---" -ForegroundColor Yellow

try {
    $myApps = Invoke-RestMethod -Uri "$baseUrl/api/applications/my?limit=100" -Method Get -Headers $studentHeaders
    $appList = @($myApps.data)
    $totalApps = $appList.Count
    $shortlisted = @($appList | Where-Object { $_.status -eq "Shortlisted" }).Count
    $applied = @($appList | Where-Object { $_.status -eq "Applied" }).Count

    $derivedOk = ($totalApps -ge 1 -and $shortlisted -ge 1)
    Assert-Test "Student dashboard data retrieval succeeds" ($myApps.success -eq $true)
    Assert-Test "Student application statistics correctly derived" ($derivedOk)
} catch {
    Assert-Test "Student dashboard data retrieval succeeds" $false $_.Exception.Message
    Assert-Test "Student application statistics correctly derived" $false
}

# ==============================================================================
# SECTION 3: RECRUITER DASHBOARD DATA & PIPELINE DERIVATION
# ==============================================================================
Write-Host "`n--- Section 3: Recruiter Dashboard Data Verification ---" -ForegroundColor Yellow

# Recruiter 1 fetches their opportunities
try {
    $myOpps = Invoke-RestMethod -Uri "$baseUrl/api/opportunities/my" -Method Get -Headers $recruiter1Headers
    $oppsList = @($myOpps.data)
    $totalOpps = $oppsList.Count
    $activeOpps = @($oppsList | Where-Object { $_.isActive -eq $true }).Count
    $inactiveOpps = @($oppsList | Where-Object { $_.isActive -eq $false }).Count

    $oppStatsOk = ($totalOpps -ge 1 -and $activeOpps -ge 1)
    Assert-Test "Recruiter 1 retrieves their opportunities" ($myOpps.success -eq $true)
    Assert-Test "Recruiter opportunity stats correctly derived" ($oppStatsOk)
} catch {
    Assert-Test "Recruiter 1 retrieves their opportunities" $false $_.Exception.Message
    Assert-Test "Recruiter opportunity stats correctly derived" $false
}

# Recruiter 1 fetches candidate applicants for their opportunity
try {
    $candsRes = Invoke-RestMethod -Uri "$baseUrl/api/applications/opportunity/$oppId" -Method Get -Headers $recruiter1Headers
    $candList = @($candsRes.data)
    $totalCands = $candList.Count
    $shortlistedCands = @($candList | Where-Object { $_.status -eq "Shortlisted" }).Count

    $candStatsOk = ($totalCands -ge 1 -and $shortlistedCands -ge 1)
    Assert-Test "Recruiter 1 retrieves applicants for owned opportunity" ($candsRes.success -eq $true)
    Assert-Test "Recruiter applicant pipeline stats correctly derived" ($candStatsOk)
} catch {
    Assert-Test "Recruiter 1 retrieves applicants for owned opportunity" $false $_.Exception.Message
    Assert-Test "Recruiter applicant pipeline stats correctly derived" $false
}

# ==============================================================================
# SECTION 4: ACCESS CONTROL & ISOLATION
# ==============================================================================
Write-Host "`n--- Section 4: Access Control & Data Isolation ---" -ForegroundColor Yellow

# Recruiter 2 CANNOT access Recruiter 1's opportunity applicants -> 403
try {
    Invoke-RestMethod -Uri "$baseUrl/api/applications/opportunity/$oppId" -Method Get -Headers $recruiter2Headers -ErrorAction Stop
    Assert-Test "Recruiter 2 forbidden from viewing Recruiter 1 applicants (403)" $false "Expected 403"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Assert-Test "Recruiter 2 forbidden from viewing Recruiter 1 applicants (403)" ($status -eq 403)
}

# Student CANNOT access recruiter applicants endpoint -> 403
try {
    Invoke-RestMethod -Uri "$baseUrl/api/applications/opportunity/$oppId" -Method Get -Headers $studentHeaders -ErrorAction Stop
    Assert-Test "Student forbidden from accessing recruiter applicant pool (403)" $false "Expected 403"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Assert-Test "Student forbidden from accessing recruiter applicant pool (403)" ($status -eq 403)
}

# Recruiter CANNOT access student-only application creation -> 403
try {
    Invoke-RestMethod -Uri "$baseUrl/api/applications" -Method Post -Body $appPayload -Headers $recruiter1Headers -ErrorAction Stop
    Assert-Test "Recruiter forbidden from submitting applications (403)" $false "Expected 403"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Assert-Test "Recruiter forbidden from submitting applications (403)" ($status -eq 403)
}

# Unauthenticated request to /api/applications/my -> 401
try {
    Invoke-RestMethod -Uri "$baseUrl/api/applications/my" -Method Get -ErrorAction Stop
    Assert-Test "Unauthenticated access rejected with 401" $false "Expected 401"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Assert-Test "Unauthenticated access rejected with 401" ($status -eq 401)
}

# ==============================================================================
# SECTION 5: TOLERANCE TO PARTIAL APPLICANT FAILURE
# ==============================================================================
Write-Host "`n--- Section 5: Resilience to Malformed/Non-Existent IDs ---" -ForegroundColor Yellow

# Querying applicants with non-existent or invalid ID returns 400 or 404 (does not crash API)
try {
    Invoke-RestMethod -Uri "$baseUrl/api/applications/opportunity/000000000000000000000000" -Method Get -Headers $recruiter1Headers -ErrorAction Stop
    Assert-Test "Non-existent opportunity returns 404 cleanly" $false "Expected 404"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Assert-Test "Non-existent opportunity returns 404 cleanly" ($status -eq 404)
}

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "PHASE 7 TEST SUMMARY: $passedCount / $totalCount Passed" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

if ($passedCount -eq $totalCount) {
    Write-Host "ALL PHASE 7 TESTS PASSED SUCCESSFULLY!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "SOME TESTS FAILED." -ForegroundColor Red
    exit 1
}
