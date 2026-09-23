# ==============================================================================
# SkillBridge Phase 8 Security & Production Hardening Test Suite
# ==============================================================================

$baseUrl = "http://localhost:5000"
$runId = [guid]::NewGuid().ToString().Substring(0, 8)
$totalTests = 0
$passedTests = 0

function Assert-Test {
    param (
        [string]$testName,
        [bool]$condition,
        [string]$details = ""
    )
    $script:totalTests++
    if ($condition) {
        $script:passedTests++
        Write-Host "  [PASS] $testName" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] $testName" -ForegroundColor Red
        if ($details) {
            Write-Host "         Reason: $details" -ForegroundColor Yellow
        }
    }
}

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "SKILLBRIDGE PHASE 8 SECURITY TEST SUITE" -ForegroundColor Cyan
Write-Host "Run ID: $runId" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# ------------------------------------------------------------------------------
# 1. Server Health & Security HTTP Headers
# ------------------------------------------------------------------------------
Write-Host "`n--- Section 1: Security HTTP Headers ---" -ForegroundColor Yellow

try {
    $healthResp = Invoke-WebRequest -Uri "$baseUrl/api/health" -Method Get -UseBasicParsing
    Assert-Test "API server is healthy (200)" ($healthResp.StatusCode -eq 200)

    $headers = $healthResp.Headers
    $hasContentTypeOpts = ($headers["X-Content-Type-Options"] -eq "nosniff")
    Assert-Test "Security Header: X-Content-Type-Options is 'nosniff'" $hasContentTypeOpts

    $hasFrameOpts = ($headers["X-Frame-Options"] -eq "SAMEORIGIN" -or $headers["X-Frame-Options"] -eq "DENY")
    Assert-Test "Security Header: X-Frame-Options is configured" $hasFrameOpts

    $hasNoPoweredBy = ($headers["X-Powered-By"] -eq $null)
    Assert-Test "Security Header: X-Powered-By header is suppressed" $hasNoPoweredBy
} catch {
    Assert-Test "API server is healthy" $false $_.Exception.Message
}

# ------------------------------------------------------------------------------
# 2. CORS Hardening
# ------------------------------------------------------------------------------
Write-Host "`n--- Section 2: CORS Origin Hardening ---" -ForegroundColor Yellow

# Allowed Origin (http://localhost:5173) -> Should succeed
try {
    $corsAllowedResp = Invoke-WebRequest -Uri "$baseUrl/api/health" -Method Get -Headers @{ "Origin" = "http://localhost:5173" } -UseBasicParsing
    Assert-Test "CORS: Trusted origin (http://localhost:5173) allowed" ($corsAllowedResp.StatusCode -eq 200)
} catch {
    Assert-Test "CORS: Trusted origin allowed" $false $_.Exception.Message
}

# Untrusted Origin (http://malicious-attacker.com) -> Should reject with 403
try {
    $corsDenied = Invoke-WebRequest -Uri "$baseUrl/api/health" -Method Get -Headers @{ "Origin" = "http://malicious-attacker.com" } -UseBasicParsing
    Assert-Test "CORS: Untrusted origin rejected with 403" $false "Received status: $($corsDenied.StatusCode)"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Assert-Test "CORS: Untrusted origin rejected with 403" ($statusCode -eq 403) "Status: $statusCode"
}

# ------------------------------------------------------------------------------
# 3. Authentication & Rate Limiting Hardening
# ------------------------------------------------------------------------------
Write-Host "`n--- Section 3: Authentication & Rate Limiter Security ---" -ForegroundColor Yellow

$studentEmail = "sec_std_${runId}@skillbridge.com"
$recruiter1Email = "sec_rec1_${runId}@skillbridge.com"
$recruiter2Email = "sec_rec2_${runId}@skillbridge.com"
$testPassword = "SecPassw0rd!#2026"

# 3.1 Self-registration as admin is forbidden
try {
    $adminPayload = @{
        name = "Hacker Admin"
        email = "admin_${runId}@test.com"
        password = $testPassword
        role = "admin"
    } | ConvertTo-Json
    $adminReg = Invoke-WebRequest -Uri "$baseUrl/api/auth/register" -Method Post -Body $adminPayload -ContentType "application/json" -UseBasicParsing
    Assert-Test "Prevent direct self-registration as admin (400)" $false "Admin registration should be forbidden"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Assert-Test "Prevent direct self-registration as admin (400)" ($statusCode -eq 400) "Status: $statusCode"
}

# Register legitimate Student
$stdRegPayload = @{ name = "Security Student"; email = $studentEmail; password = $testPassword; role = "student" } | ConvertTo-Json
$stdRegRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $stdRegPayload -ContentType "application/json"
$studentToken = $stdRegRes.token

# Register Recruiter 1
$rec1RegPayload = @{ name = "Security Recruiter 1"; email = $recruiter1Email; password = $testPassword; role = "recruiter" } | ConvertTo-Json
$rec1RegRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $rec1RegPayload -ContentType "application/json"
$recruiter1Token = $rec1RegRes.token

# Register Recruiter 2
$rec2RegPayload = @{ name = "Security Recruiter 2"; email = $recruiter2Email; password = $testPassword; role = "recruiter" } | ConvertTo-Json
$rec2RegRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $rec2RegPayload -ContentType "application/json"
$recruiter2Token = $rec2RegRes.token

Assert-Test "Student and Recruiters registered successfully" ($studentToken -and $recruiter1Token -and $recruiter2Token)

# 3.2 Login with wrong password rejected with 401
try {
    $wrongPassPayload = @{ email = $studentEmail; password = "WrongPassword999!" } | ConvertTo-Json
    $badLogin = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method Post -Body $wrongPassPayload -ContentType "application/json" -UseBasicParsing
    Assert-Test "Login with invalid password rejected with 401" $false
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Assert-Test "Login with invalid password rejected with 401" ($statusCode -eq 401)
}

# 3.3 Protected route without token rejected with 401
try {
    $noTokenRes = Invoke-WebRequest -Uri "$baseUrl/api/auth/me" -Method Get -UseBasicParsing
    Assert-Test "Protected route without token returns 401" $false
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Assert-Test "Protected route without token returns 401" ($statusCode -eq 401)
}

# 3.4 Protected route with forged token rejected with 401
try {
    $forgedRes = Invoke-WebRequest -Uri "$baseUrl/api/auth/me" -Method Get -Headers @{ "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.forged.sig" } -UseBasicParsing
    Assert-Test "Protected route with forged token returns 401" $false
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Assert-Test "Protected route with forged token returns 401" ($statusCode -eq 401)
}

# 3.5 Passwords never exposed in /me profile
$meRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/me" -Method Get -Headers @{ "Authorization" = "Bearer $studentToken" }
Assert-Test "Password omitted from user profile response" ($meRes.user.password -eq $null)

# ------------------------------------------------------------------------------
# 4. Role-Based Access Control (RBAC) & Authorization Boundaries
# ------------------------------------------------------------------------------
Write-Host "`n--- Section 4: Role-Based Access Control & Ownership Isolation ---" -ForegroundColor Yellow

# 4.1 Student forbidden from recruiter-only endpoint
try {
    $recOnlyRes = Invoke-WebRequest -Uri "$baseUrl/api/auth/recruiter-only" -Method Get -Headers @{ "Authorization" = "Bearer $studentToken" } -UseBasicParsing
    Assert-Test "Student forbidden from recruiter-only route (403)" $false
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Assert-Test "Student forbidden from recruiter-only route (403)" ($statusCode -eq 403)
}

# 4.2 Student forbidden from creating opportunity
try {
    $oppPayload = @{
        title = "Malicious Opportunity"
        company = "Evil Corp"
        description = "Unauthorized creation attempt"
        type = "internship"
        workMode = "remote"
        location = "Remote"
    } | ConvertTo-Json
    $stdOppCreate = Invoke-WebRequest -Uri "$baseUrl/api/opportunities" -Method Post -Body $oppPayload -ContentType "application/json" -Headers @{ "Authorization" = "Bearer $studentToken" } -UseBasicParsing
    Assert-Test "Student forbidden from creating opportunity (403)" $false
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Assert-Test "Student forbidden from creating opportunity (403)" ($statusCode -eq 403)
}

# Recruiter 1 creates an opportunity for cross-tenant testing
$validOppPayload = @{
    title = "Cybersecurity Analyst Intern"
    company = "Fortress Corp"
    description = "Analyze threat telemetry and secure cloud infrastructure."
    type = "internship"
    workMode = "remote"
    location = "San Francisco, CA"
    skills = @("python", "siem", "firewalls")
    stipend = "$35/hr"
} | ConvertTo-Json
$opp1Res = Invoke-RestMethod -Uri "$baseUrl/api/opportunities" -Method Post -Body $validOppPayload -ContentType "application/json" -Headers @{ "Authorization" = "Bearer $recruiter1Token" }
$opp1Id = $opp1Res.data._id
Assert-Test "Recruiter 1 creates legitimate opportunity" ($opp1Id -ne $null)

# 4.3 Recruiter 2 forbidden from modifying Recruiter 1's opportunity
try {
    $tamperPayload = @{ title = "Hijacked Opportunity Title" } | ConvertTo-Json
    $tamperRes = Invoke-WebRequest -Uri "$baseUrl/api/opportunities/$opp1Id" -Method Put -Body $tamperPayload -ContentType "application/json" -Headers @{ "Authorization" = "Bearer $recruiter2Token" } -UseBasicParsing
    Assert-Test "Cross-tenant: Recruiter 2 forbidden from modifying Recruiter 1 opportunity (403)" $false
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Assert-Test "Cross-tenant: Recruiter 2 forbidden from modifying Recruiter 1 opportunity (403)" ($statusCode -eq 403)
}

# Student applies to Opportunity 1
$appPayload = @{ opportunity = $opp1Id; coverLetter = "Passionate about security." } | ConvertTo-Json
$app1Res = Invoke-RestMethod -Uri "$baseUrl/api/applications" -Method Post -Body $appPayload -ContentType "application/json" -Headers @{ "Authorization" = "Bearer $studentToken" }
$app1Id = $app1Res.data._id
Assert-Test "Student submits application to Opportunity 1" ($app1Id -ne $null)

# 4.4 Student forbidden from updating their own application status
try {
    $statusTamper = @{ status = "Selected" } | ConvertTo-Json
    $stdStatusRes = Invoke-WebRequest -Uri "$baseUrl/api/applications/$app1Id/status" -Method Put -Body $statusTamper -ContentType "application/json" -Headers @{ "Authorization" = "Bearer $studentToken" } -UseBasicParsing
    Assert-Test "Student forbidden from updating application status (403)" $false
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Assert-Test "Student forbidden from updating application status (403)" ($statusCode -eq 403)
}

# 4.5 Recruiter 2 forbidden from inspecting Recruiter 1's applicants
try {
    $rec2AppView = Invoke-WebRequest -Uri "$baseUrl/api/applications/opportunity/$opp1Id" -Method Get -Headers @{ "Authorization" = "Bearer $recruiter2Token" } -UseBasicParsing
    Assert-Test "Cross-tenant: Recruiter 2 forbidden from viewing Recruiter 1 applicants (403)" $false
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Assert-Test "Cross-tenant: Recruiter 2 forbidden from viewing Recruiter 1 applicants (403)" ($statusCode -eq 403)
}

# ------------------------------------------------------------------------------
# 5. Input Validation & Injection Resistance
# ------------------------------------------------------------------------------
Write-Host "`n--- Section 5: Input Validation & Injection Protection ---" -ForegroundColor Yellow

# 5.1 ReDoS / Regex special characters in search does NOT crash (returns 200)
try {
    $dangerousSearch = "[unclosed(regex+*?^$|"
    $encodedSearch = [System.Uri]::EscapeDataString($dangerousSearch)
    $searchRes = Invoke-RestMethod -Uri "$baseUrl/api/opportunities?search=$encodedSearch" -Method Get
    Assert-Test "ReDoS / Regex special characters in search handled safely without 500 crash" ($searchRes.success -eq $true)
} catch {
    Assert-Test "ReDoS / Regex special characters in search handled safely" $false $_.Exception.Message
}

# 5.2 Malformed ObjectId rejected with 400
try {
    $badIdRes = Invoke-WebRequest -Uri "$baseUrl/api/opportunities/invalid-non-hex-id" -Method Get -UseBasicParsing
    Assert-Test "Malformed ObjectId rejected with 400" $false
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Assert-Test "Malformed ObjectId rejected with 400" ($statusCode -eq 400)
}

# 5.3 Duplicate application blocked with 409
try {
    $dupRes = Invoke-WebRequest -Uri "$baseUrl/api/applications" -Method Post -Body $appPayload -ContentType "application/json" -Headers @{ "Authorization" = "Bearer $studentToken" } -UseBasicParsing
    Assert-Test "Duplicate application prevented with 409 Conflict" $false
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Assert-Test "Duplicate application prevented with 409 Conflict" ($statusCode -eq 409)
}

# 5.4 Profile forbidden fields (role, password tampering) rejected with 400
try {
    $profileTamper = @{ role = "admin" } | ConvertTo-Json
    $profRes = Invoke-WebRequest -Uri "$baseUrl/api/users/profile" -Method Put -Body $profileTamper -ContentType "application/json" -Headers @{ "Authorization" = "Bearer $studentToken" } -UseBasicParsing
    Assert-Test "Profile tampering (forbidden role field) rejected with 400" $false
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Assert-Test "Profile tampering (forbidden role field) rejected with 400" ($statusCode -eq 400)
}

# ------------------------------------------------------------------------------
# 6. File Upload Security
# ------------------------------------------------------------------------------
Write-Host "`n--- Section 6: File Upload Security ---" -ForegroundColor Yellow

$tempTxtPath = [System.IO.Path]::GetTempFileName() + ".txt"
[System.IO.File]::WriteAllText($tempTxtPath, "This is plain text, not a resume document.")

function Upload-FileMultipart {
    param (
        [string]$FilePath,
        [string]$Token,
        [string]$MimeType = "text/plain"
    )
    $boundary = [System.Guid]::NewGuid().ToString()
    $fileBytes = [System.IO.File]::ReadAllBytes($FilePath)
    $fileName = [System.IO.Path]::GetFileName($FilePath)
    
    $LF = "`r`n"
    $body = "--$boundary$LF"
    $body += "Content-Disposition: form-data; name=`"resume`"; filename=`"$fileName`"$LF"
    $body += "Content-Type: $MimeType$LF$LF"
    
    $bodyPrefixBytes = [System.Text.Encoding]::ASCII.GetBytes($body)
    $bodySuffixBytes = [System.Text.Encoding]::ASCII.GetBytes("$LF--$boundary--$LF")
    
    $totalBodyBytes = [byte[]]::new($bodyPrefixBytes.Length + $fileBytes.Length + $bodySuffixBytes.Length)
    [System.Buffer]::BlockCopy($bodyPrefixBytes, 0, $totalBodyBytes, 0, $bodyPrefixBytes.Length)
    [System.Buffer]::BlockCopy($fileBytes, 0, $totalBodyBytes, $bodyPrefixBytes.Length, $fileBytes.Length)
    [System.Buffer]::BlockCopy($bodySuffixBytes, 0, $totalBodyBytes, $bodyPrefixBytes.Length + $fileBytes.Length, $bodySuffixBytes.Length)

    $request = [System.Net.HttpWebRequest]::Create("$baseUrl/api/users/resume")
    $request.Method = "POST"
    $request.ContentType = "multipart/form-data; boundary=$boundary"
    $request.Headers.Add("Authorization", "Bearer $Token")
    $request.ContentLength = $totalBodyBytes.Length

    try {
        $stream = $request.GetRequestStream()
        $stream.Write($totalBodyBytes, 0, $totalBodyBytes.Length)
        $stream.Close()
        $response = $request.GetResponse()
        return @{ StatusCode = [int]$response.StatusCode }
    } catch [System.Net.WebException] {
        $resp = $_.Exception.Response
        if ($resp) {
            return @{ StatusCode = [int]$resp.StatusCode }
        }
        return @{ StatusCode = 500 }
    }
}

# 6.1 Disallowed extension (.txt) rejected with 400
$txtUpload = Upload-FileMultipart -FilePath $tempTxtPath -Token $studentToken -MimeType "text/plain"
Assert-Test "Uploading invalid file type (.txt) rejected with 400" ($txtUpload.StatusCode -eq 400) "Status: $($txtUpload.StatusCode)"
Remove-Item -Path $tempTxtPath -Force -ErrorAction SilentlyContinue

# 6.2 Recruiter forbidden from uploading resume (student-only feature)
$fakePdfPath = [System.IO.Path]::GetTempFileName() + ".pdf"
[System.IO.File]::WriteAllBytes($fakePdfPath, [byte[]]@(0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x35)) # %PDF-1.5
$recUpload = Upload-FileMultipart -FilePath $fakePdfPath -Token $recruiter1Token -MimeType "application/pdf"
Assert-Test "Recruiter forbidden from uploading resume (403)" ($recUpload.StatusCode -eq 403) "Status: $($recUpload.StatusCode)"

# 6.3 Legitimate student PDF upload succeeds
$stdUpload = Upload-FileMultipart -FilePath $fakePdfPath -Token $studentToken -MimeType "application/pdf"
Assert-Test "Student valid PDF upload succeeds (200)" ($stdUpload.StatusCode -eq 200) "Status: $($stdUpload.StatusCode)"
Remove-Item -Path $fakePdfPath -Force -ErrorAction SilentlyContinue

# 6.4 Static directory /uploads has nosniff header
try {
    $staticCheck = Invoke-WebRequest -Uri "$baseUrl/uploads/" -Method Get -UseBasicParsing
} catch {
    # 404 or 403 on directory root is expected when index is disabled
    $staticHeaders = $_.Exception.Response.Headers
    $hasStaticNosniff = ($staticHeaders["X-Content-Type-Options"] -eq "nosniff")
    Assert-Test "Static upload route enforces X-Content-Type-Options: nosniff" $hasStaticNosniff
}

# ------------------------------------------------------------------------------
# 7. Error Handling & Information Disclosure
# ------------------------------------------------------------------------------
Write-Host "`n--- Section 7: Information Disclosure & Error Sanitization ---" -ForegroundColor Yellow

# 7.1 Unknown route returns 404 with clean message
try {
    $unknownRes = Invoke-RestMethod -Uri "$baseUrl/api/non-existent-route-xyz" -Method Get
    Assert-Test "Non-existent route returns 404 cleanly" $false
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $body = $_.ErrorDetails.Message
    if (-not $body) {
        $body = $_.Exception.Message
    }
    $clean404 = ($statusCode -eq 404 -and $body -match "API endpoint not found")
    Assert-Test "Non-existent route returns 404 cleanly without stack trace" $clean404
}

# ------------------------------------------------------------------------------
# Summary
# ------------------------------------------------------------------------------
Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "PHASE 8 SECURITY TEST SUMMARY: $passedTests / $totalTests Passed" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

if ($passedTests -eq $totalTests) {
    Write-Host "ALL PHASE 8 SECURITY TESTS PASSED SUCCESSFULLY!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "SOME PHASE 8 SECURITY TESTS FAILED." -ForegroundColor Red
    exit 1
}
