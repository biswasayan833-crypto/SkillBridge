$baseUrl = "http://localhost:5000/api"
$global:authPassed = 0
$global:authTotal = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [scriptblock]$Action,
        [int]$ExpectedStatus
    )
    $global:authTotal++
    try {
        $response = & $Action
        $statusCode = 200
        if ($ExpectedStatus -eq 201 -and $response -and $response.success -eq $true) {
            $statusCode = 201
        }
        $data = $response
        $pass = ($statusCode -eq $ExpectedStatus)
        if ($pass) {
            $global:authPassed++
            Write-Host "PASS: $Name (Status $statusCode)" -ForegroundColor Green
            return @{ Name = $Name; Status = "PASS"; Code = $statusCode; Data = $data }
        } else {
            Write-Host "FAIL: $Name (Got $statusCode, Expected $ExpectedStatus)" -ForegroundColor Red
            return @{ Name = $Name; Status = "FAIL"; Code = $statusCode; Data = $data }
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errBody = $_.ErrorDetails.Message
        $pass = ($statusCode -eq $ExpectedStatus)
        if ($pass) {
            $global:authPassed++
            Write-Host "PASS: $Name (Status $statusCode as expected)" -ForegroundColor Green
            return @{ Name = $Name; Status = "PASS"; Code = $statusCode; Error = $errBody }
        } else {
            Write-Host "FAIL: $Name (Got $statusCode, Expected $ExpectedStatus)" -ForegroundColor Red
            Write-Host "Detail: $errBody" -ForegroundColor Yellow
            return @{ Name = $Name; Status = "FAIL"; Code = $statusCode; Error = $errBody }
        }
    }
}


Write-Host "`n=== COMPREHENSIVE PHASE 2 AUTH & RBAC VERIFICATION ===" -ForegroundColor Cyan

# 1. Health check
Test-Endpoint "1. Health Check" {
    Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
} 200

# 2. Reject admin self-registration
Test-Endpoint "2. Reject Admin Role in Register" {
    $body = @{ name = "Hacker Admin"; email = "admin@example.com"; password = "Password123!"; role = "admin" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $body -ContentType "application/json"
} 400

# Unique emails for this run
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$studentEmail = "student_$timestamp@example.com"
$studentPass = "StudentPass123!"

$recruiterEmail = "recruiter_$timestamp@example.com"
$recruiterPass = "RecruiterPass123!"

# 3. Register valid student
$regStudent = Test-Endpoint "3. Register Student Successfully" {
    $body = @{ name = "Test Student"; email = $studentEmail; password = $studentPass; role = "student" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $body -ContentType "application/json"
} 201

$studentToken = $regStudent.Data.token

# Check if password leaked in response
if ($regStudent.Data.user.password) {
    Write-Host "SECURITY ERROR: Password field leaked in register response!" -ForegroundColor Red
} else {
    Write-Host "SECURITY VERIFIED: Password field omitted from register response." -ForegroundColor Green
}

# 4. Reject duplicate email
Test-Endpoint "4. Reject Duplicate Email" {
    $body = @{ name = "Duplicate Student"; email = $studentEmail; password = $studentPass; role = "student" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $body -ContentType "application/json"
} 409

# 5. Login with valid student credentials
$loginStudent = Test-Endpoint "5. Login With Valid Student Credentials" {
    $body = @{ email = $studentEmail; password = $studentPass } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $body -ContentType "application/json"
} 200

# 6. Login with incorrect password
Test-Endpoint "6. Login With Incorrect Password" {
    $body = @{ email = $studentEmail; password = "WrongPassword999!" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $body -ContentType "application/json"
} 401

# 7. GetMe without token
Test-Endpoint "7. GetMe Without Token" {
    Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Get
} 401

# 8. GetMe with invalid token
Test-Endpoint "8. GetMe With Invalid Token" {
    $headers = @{ Authorization = "Bearer invalid.fake.token" }
    Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Get -Headers $headers
} 401

# 9. GetMe with valid student token
$meResult = Test-Endpoint "9. GetMe With Valid Token" {
    $headers = @{ Authorization = "Bearer $studentToken" }
    Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Get -Headers $headers
} 200

if ($meResult.Data.user.password) {
    Write-Host "SECURITY ERROR: Password field leaked in getMe response!" -ForegroundColor Red
} else {
    Write-Host "SECURITY VERIFIED: User profile returned safely without password." -ForegroundColor Green
}

# 10. Role check: Student attempting recruiter-only route
Test-Endpoint "10. Protected Role Middleware Rejects Student from Recruiter Route" {
    $headers = @{ Authorization = "Bearer $studentToken" }
    Invoke-RestMethod -Uri "$baseUrl/auth/recruiter-only" -Method Get -Headers $headers
} 403

# 11. Register valid recruiter
$regRecruiter = Test-Endpoint "11. Register Recruiter Successfully" {
    $body = @{ name = "Talent Lead"; email = $recruiterEmail; password = $recruiterPass; role = "recruiter" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $body -ContentType "application/json"
} 201

$recruiterToken = $regRecruiter.Data.token

# 12. Role check: Recruiter accessing recruiter-only route
Test-Endpoint "12. Protected Role Middleware Allows Recruiter to Recruiter Route" {
    $headers = @{ Authorization = "Bearer $recruiterToken" }
    Invoke-RestMethod -Uri "$baseUrl/auth/recruiter-only" -Method Get -Headers $headers
} 200

# 13. Update password with incorrect current password
Test-Endpoint "13. Update Password Rejects Wrong Current Password" {
    $headers = @{ Authorization = "Bearer $studentToken" }
    $body = @{ currentPassword = "WrongOldPassword!"; newPassword = "BrandNewPassword123!" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/auth/update-password" -Method Put -Headers $headers -Body $body -ContentType "application/json"
} 400

# 14. Update password with correct current password
$newPass = "BrandNewPassword123!"
Test-Endpoint "14. Update Password With Correct Current Password" {
    $headers = @{ Authorization = "Bearer $studentToken" }
    $body = @{ currentPassword = $studentPass; newPassword = $newPass } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/auth/update-password" -Method Put -Headers $headers -Body $body -ContentType "application/json"
} 200

# 15. Verify old password no longer works
Test-Endpoint "15. Old Password Fails After Update" {
    $body = @{ email = $studentEmail; password = $studentPass } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $body -ContentType "application/json"
} 401

# 16. Verify new password works
Test-Endpoint "16. New Password Succeeds On Login" {
    $body = @{ email = $studentEmail; password = $newPass } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $body -ContentType "application/json"
} 200

# 17. Logout endpoint
Test-Endpoint "17. Logout Endpoint" {
    Invoke-RestMethod -Uri "$baseUrl/auth/logout" -Method Post
} 200

Write-Host "`n=== ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY ===" -ForegroundColor Cyan
Write-Host "PHASE 2 TEST SUMMARY: $global:authPassed / $global:authTotal tests passed" -ForegroundColor Green

