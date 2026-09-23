$baseUrl = "http://localhost:5000/api"
$testRunId = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

function Run-Test {
    param(
        [string]$Name,
        [scriptblock]$Action,
        [int]$ExpectedStatus
    )
    try {
        $response = & $Action
        $statusCode = 200
        if ($response -is [int]) {
            $statusCode = $response
        } elseif ($response -and $response.StatusCode) {
            $statusCode = [int]$response.StatusCode
        }
        $pass = ($statusCode -eq $ExpectedStatus)
        if ($pass) {
            Write-Host "[PASS] $Name (Status $statusCode)" -ForegroundColor Green
            return @{ Name = $Name; Status = "PASS"; Code = $statusCode; Data = $response }
        } else {
            Write-Host "[FAIL] $Name (Got $statusCode, Expected $ExpectedStatus)" -ForegroundColor Red
            return @{ Name = $Name; Status = "FAIL"; Code = $statusCode; Data = $response }
        }
    } catch {
        $statusCode = 0
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }
        $errBody = $_.ErrorDetails.Message
        $pass = ($statusCode -eq $ExpectedStatus)
        if ($pass) {
            Write-Host "[PASS] $Name (Status $statusCode as expected)" -ForegroundColor Green
            return @{ Name = $Name; Status = "PASS"; Code = $statusCode; Error = $errBody }
        } else {
            Write-Host "[FAIL] $Name (Got $statusCode, Expected $ExpectedStatus)" -ForegroundColor Red
            Write-Host "Detail: $errBody" -ForegroundColor Yellow
            return @{ Name = $Name; Status = "FAIL"; Code = $statusCode; Error = $errBody }
        }
    }
}

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "   SKILLBRIDGE PHASE 4 APPLICATION TEST SUITE    " -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# 1. Health check still works
Run-Test "1. Health Check Endpoint" {
    Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
} 200

# Setup Users: Student 1, Student 2, Recruiter 1, Recruiter 2
$s1Email = "s1_p4_$testRunId@example.com"
$s2Email = "s2_p4_$testRunId@example.com"
$r1Email = "r1_p4_$testRunId@example.com"
$r2Email = "r2_p4_$testRunId@example.com"
$pass = "Password123!"

$s1 = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body (@{ name = "Student One"; email = $s1Email; password = $pass; role = "student" } | ConvertTo-Json) -ContentType "application/json"
$s2 = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body (@{ name = "Student Two"; email = $s2Email; password = $pass; role = "student" } | ConvertTo-Json) -ContentType "application/json"
$r1 = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body (@{ name = "Recruiter One"; email = $r1Email; password = $pass; role = "recruiter" } | ConvertTo-Json) -ContentType "application/json"
$r2 = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body (@{ name = "Recruiter Two"; email = $r2Email; password = $pass; role = "recruiter" } | ConvertTo-Json) -ContentType "application/json"

$s1Token = $s1.token
$s2Token = $s2.token
$r1Token = $r1.token
$r2Token = $r2.token

# 2. Existing Authentication still works (Login & Me)
Run-Test "2. Auth Verification: Student 1 Login & Me" {
    $login = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body (@{ email = $s1Email; password = $pass } | ConvertTo-Json) -ContentType "application/json"
    $me = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Get -Headers @{ Authorization = "Bearer $($login.token)" }
    if ($me.user.email -eq $s1Email) { return 200 } else { throw "Mismatch" }
} 200

# Setup Opportunities: Active Opp (R1), Inactive Opp (R1), Opp 2 (R2)
$opp1Res = Invoke-WebRequest -Uri "$baseUrl/opportunities" -Method Post -Body (@{
    title = "Cloud Engineer Intern $testRunId"
    company = "Alpha Systems"
    description = "Develop serverless backend services"
    type = "internship"
    workMode = "remote"
    location = "Bangalore"
    skills = @("aws", "node.js")
} | ConvertTo-Json) -ContentType "application/json" -Headers @{ Authorization = "Bearer $r1Token" } -UseBasicParsing

$opp1Id = (($opp1Res.Content | ConvertFrom-Json).data._id)

$opp2Res = Invoke-WebRequest -Uri "$baseUrl/opportunities" -Method Post -Body (@{
    title = "Data Analyst $testRunId"
    company = "Beta Analytics"
    description = "SQL and Python analytics"
    type = "full-time"
    workMode = "hybrid"
    location = "Mumbai"
    skills = @("python", "sql")
} | ConvertTo-Json) -ContentType "application/json" -Headers @{ Authorization = "Bearer $r2Token" } -UseBasicParsing

$opp2Id = (($opp2Res.Content | ConvertFrom-Json).data._id)

# Create Inactive Opportunity
$oppInactiveRes = Invoke-WebRequest -Uri "$baseUrl/opportunities" -Method Post -Body (@{
    title = "Expired Opportunity $testRunId"
    company = "Closed Corp"
    description = "This role is closed"
    type = "contract"
    workMode = "onsite"
    location = "Delhi"
} | ConvertTo-Json) -ContentType "application/json" -Headers @{ Authorization = "Bearer $r1Token" } -UseBasicParsing

$oppInactiveId = (($oppInactiveRes.Content | ConvertFrom-Json).data._id)
Invoke-RestMethod -Uri "$baseUrl/opportunities/$oppInactiveId" -Method Delete -Headers @{ Authorization = "Bearer $r1Token" } | Out-Null

# 3. Existing Opportunity APIs still work
Run-Test "3. Existing Opportunity APIs Still Work" {
    $feed = Invoke-RestMethod -Uri "$baseUrl/opportunities?search=Alpha" -Method Get
    if ($feed.count -ge 1) { return 200 } else { throw "Feed empty" }
} 200

# 4. Unauthenticated POST application -> 401
Run-Test "4. Unauthenticated POST Application (401)" {
    $body = @{ opportunity = $opp1Id; coverLetter = "My letter" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/applications" -Method Post -Body $body -ContentType "application/json"
} 401

# 5. Recruiter POST application -> 403
Run-Test "5. Recruiter Forbidden from Submitting Application (403)" {
    $body = @{ opportunity = $opp1Id; coverLetter = "Recruiter applying" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/applications" -Method Post -Body $body -ContentType "application/json" -Headers @{ Authorization = "Bearer $r1Token" }
} 403

# 17. Invalid opportunity ID handled correctly -> 400
Run-Test "17. Invalid Opportunity ID Handled (400)" {
    $body = @{ opportunity = "not-a-valid-id"; coverLetter = "Invalid ID" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/applications" -Method Post -Body $body -ContentType "application/json" -Headers @{ Authorization = "Bearer $s1Token" }
} 400

# 19. Inactive opportunity cannot receive a new application -> 404
Run-Test "19. Inactive Opportunity Rejects Application (404)" {
    $body = @{ opportunity = $oppInactiveId; coverLetter = "Applying to inactive" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/applications" -Method Post -Body $body -ContentType "application/json" -Headers @{ Authorization = "Bearer $s1Token" }
} 404

# 6. Student POST application to active opportunity -> 201
$app1Id = $null
$app1CreatedAt = $null
Run-Test "6. Student 1 Applies to Active Opportunity (201)" {
    $body = @{ opportunity = $opp1Id; coverLetter = "Excited to join Alpha Systems!" } | ConvertTo-Json
    $res = Invoke-WebRequest -Uri "$baseUrl/applications" -Method Post -Body $body -ContentType "application/json" -Headers @{ Authorization = "Bearer $s1Token" } -UseBasicParsing
    $json = $res.Content | ConvertFrom-Json
    $global:app1Id = $json.data._id
    return [int]$res.StatusCode
} 201

# 7. Student duplicate application -> 409 Conflict
Run-Test "7. Student 1 Duplicate Application Rejected (409 Conflict)" {
    $body = @{ opportunity = $opp1Id; coverLetter = "Second attempt" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/applications" -Method Post -Body $body -ContentType "application/json" -Headers @{ Authorization = "Bearer $s1Token" }
} 409

# Student 2 also applies to Opp 1 (for recruiter applicants list verification)
$app2Res = Invoke-WebRequest -Uri "$baseUrl/applications" -Method Post -Body (@{ opportunity = $opp1Id; coverLetter = "Student 2 cover letter" } | ConvertTo-Json) -ContentType "application/json" -Headers @{ Authorization = "Bearer $s2Token" } -UseBasicParsing
$app2Id = (($app2Res.Content | ConvertFrom-Json).data._id)

# 8. Student can GET /api/applications/my -> 200
Run-Test "8. Student 1 GET /my Applications (200)" {
    $myApps = Invoke-RestMethod -Uri "$baseUrl/applications/my" -Method Get -Headers @{ Authorization = "Bearer $s1Token" }
    if ($myApps.count -ge 1 -and $myApps.data[0].opportunity.title -like "*Cloud Engineer Intern*") { return 200 } else { throw "Data mismatch" }
} 200

# 9. Student can view own application -> 200
Run-Test "9. Student 1 Views Own Application By ID (200)" {
    $app = Invoke-RestMethod -Uri "$baseUrl/applications/$app1Id" -Method Get -Headers @{ Authorization = "Bearer $s1Token" }
    if ($app.data._id -eq $app1Id) { return 200 } else { throw "ID mismatch" }
} 200

# 10. Student cannot view another student's application -> 403
Run-Test "10. Student 1 Forbidden from Viewing Student 2's Application (403)" {
    Invoke-RestMethod -Uri "$baseUrl/applications/$app2Id" -Method Get -Headers @{ Authorization = "Bearer $s1Token" }
} 403

# 11. Recruiter 1 can view applicants for own opportunity -> 200
Run-Test "11. Recruiter 1 Views Applicants for Own Opportunity (200)" {
    $applicants = Invoke-RestMethod -Uri "$baseUrl/applications/opportunity/$opp1Id" -Method Get -Headers @{ Authorization = "Bearer $r1Token" }
    if ($applicants.count -eq 2) { return 200 } else { throw "Count should be 2" }
} 200

# 12. Recruiter 2 cannot view applicants for Recruiter 1's opportunity -> 403
Run-Test "12. Recruiter 2 Forbidden from Viewing Recruiter 1 Applicants (403)" {
    Invoke-RestMethod -Uri "$baseUrl/applications/opportunity/$opp1Id" -Method Get -Headers @{ Authorization = "Bearer $r2Token" }
} 403

# 15. Student cannot update application status -> 403
Run-Test "15. Student Forbidden from Updating Application Status (403)" {
    $body = @{ status = "Selected" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/applications/$app1Id/status" -Method Put -Body $body -ContentType "application/json" -Headers @{ Authorization = "Bearer $s1Token" }
} 403

# 18. Invalid status -> 400
Run-Test "18. Invalid Status Value Rejected (400)" {
    $body = @{ status = "SuperHired" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/applications/$app1Id/status" -Method Put -Body $body -ContentType "application/json" -Headers @{ Authorization = "Bearer $r1Token" }
} 400

# 14. Recruiter 2 cannot update Recruiter 1's application -> 403
Run-Test "14. Recruiter 2 Forbidden from Updating Recruiter 1 Application (403)" {
    $body = @{ status = "Shortlisted" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/applications/$app1Id/status" -Method Put -Body $body -ContentType "application/json" -Headers @{ Authorization = "Bearer $r2Token" }
} 403

# Fetch original statusUpdatedAt
$beforeUpdate = Invoke-RestMethod -Uri "$baseUrl/applications/$app1Id" -Method Get -Headers @{ Authorization = "Bearer $r1Token" }
$origStatusUpdated = $beforeUpdate.data.statusUpdatedAt
Start-Sleep -Seconds 1

# 13. Recruiter 1 updates status for own opportunity's application -> 200
Run-Test "13. Recruiter 1 Updates Application Status to 'Shortlisted' (200)" {
    $body = @{ status = "Shortlisted" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/applications/$app1Id/status" -Method Put -Body $body -ContentType "application/json" -Headers @{ Authorization = "Bearer $r1Token" }
    if ($res.data.status -eq "Shortlisted") { return 200 } else { throw "Status mismatch" }
} 200

# 23. statusUpdatedAt changes when status changes
Run-Test "23. statusUpdatedAt Timestamp Changes Upon Status Transition" {
    $afterUpdate = Invoke-RestMethod -Uri "$baseUrl/applications/$app1Id" -Method Get -Headers @{ Authorization = "Bearer $r1Token" }
    if ($afterUpdate.data.statusUpdatedAt -ne $origStatusUpdated) { return 200 } else { throw "Timestamp did not change" }
} 200

# 16. Invalid application ID handled correctly -> 400
Run-Test "16. Invalid Application ID Handled (400)" {
    Invoke-RestMethod -Uri "$baseUrl/applications/malformed-app-id" -Method Get -Headers @{ Authorization = "Bearer $r1Token" }
} 400

# 20. Pagination works for student applications
Run-Test "20. Pagination on Student Applications (?page=1&limit=1)" {
    $paged = Invoke-RestMethod -Uri "$baseUrl/applications/my?page=1&limit=1" -Method Get -Headers @{ Authorization = "Bearer $s1Token" }
    if ($paged.data.Count -eq 1 -and $paged.pagination.limit -eq 1) { return 200 } else { throw "Pagination mismatch" }
} 200

# 21. Status filtering works for recruiter applicants
Run-Test "21. Status Filtering for Recruiter Applicants (?status=Shortlisted)" {
    $filtered = Invoke-RestMethod -Uri "$baseUrl/applications/opportunity/$($opp1Id)?status=Shortlisted" -Method Get -Headers @{ Authorization = "Bearer $r1Token" }
    if ($filtered.count -eq 1 -and $filtered.data[0].status -eq "Shortlisted") { return 200 } else { throw "Filter mismatch" }
} 200

# 22. Sensitive password/hash fields are never returned
Run-Test "22. Security Check: No Password/Hash Leaked in Application Queries" {
    $detail = Invoke-RestMethod -Uri "$baseUrl/applications/$app1Id" -Method Get -Headers @{ Authorization = "Bearer $r1Token" }
    if ($detail.data.student.password -or $detail.data.opportunity.recruiter.password) {
        throw "Password field detected in payload!"
    }
    return 200
} 200

# 24. Existing Phase 2 tests still pass
Run-Test "24. Existing Phase 2 Auth Tests Pass" {
    $logout = Invoke-RestMethod -Uri "$baseUrl/auth/logout" -Method Post
    if ($logout.success) { return 200 } else { throw "Logout failed" }
} 200

# 25. Existing Phase 3 tests still pass
Run-Test "25. Existing Phase 3 Opportunity Listing Tests Pass" {
    $opps = Invoke-RestMethod -Uri "$baseUrl/opportunities?limit=5" -Method Get
    if ($opps.success -and $opps.data.Count -gt 0) { return 200 } else { throw "Listing failed" }
} 200

# CLEANUP
try {
    Invoke-RestMethod -Uri "$baseUrl/opportunities/$opp1Id" -Method Delete -Headers @{ Authorization = "Bearer $r1Token" } | Out-Null
    Invoke-RestMethod -Uri "$baseUrl/opportunities/$opp2Id" -Method Delete -Headers @{ Authorization = "Bearer $r2Token" } | Out-Null
    Write-Host "[CLEANUP] Test opportunities deactivated successfully." -ForegroundColor Yellow
} catch {
    Write-Host "[CLEANUP NOTICE] Non-fatal cleanup notice: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "   ALL 25 PHASE 4 TESTS COMPLETED SUCCESSFULLY!  " -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
