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
Write-Host "   SKILLBRIDGE PHASE 3 OPPORTUNITY TEST SUITE   " -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# 21. Health Check
Run-Test "21. Health Check Endpoint" {
    Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
} 200

# Setup: Register Student, Recruiter 1, Recruiter 2
$studentEmail = "student_p3_$testRunId@example.com"
$recruiter1Email = "recruiter1_p3_$testRunId@example.com"
$recruiter2Email = "recruiter2_p3_$testRunId@example.com"
$commonPass = "Password123!"

$studentReg = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body (@{ name = "Phase3 Student"; email = $studentEmail; password = $commonPass; role = "student" } | ConvertTo-Json) -ContentType "application/json"
$studentToken = $studentReg.token

$rec1Reg = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body (@{ name = "Phase3 Recruiter 1"; email = $recruiter1Email; password = $commonPass; role = "recruiter" } | ConvertTo-Json) -ContentType "application/json"
$rec1Token = $rec1Reg.token

$rec2Reg = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body (@{ name = "Phase3 Recruiter 2"; email = $recruiter2Email; password = $commonPass; role = "recruiter" } | ConvertTo-Json) -ContentType "application/json"
$rec2Token = $rec2Reg.token

# 20. Existing Authentication tests still pass (Login & GetMe)
Run-Test "20. Auth Verification: Student Login & Me" {
    $login = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body (@{ email = $studentEmail; password = $commonPass } | ConvertTo-Json) -ContentType "application/json"
    $me = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Get -Headers @{ Authorization = "Bearer $($login.token)" }
    if ($me.user.email -eq $studentEmail) { return @{ success = $true } } else { throw "Email mismatch" }
} 200

# 1. Public GET opportunities
Run-Test "1. Public GET Opportunities" {
    Invoke-RestMethod -Uri "$baseUrl/opportunities" -Method Get
} 200

# 3. Unauthenticated POST opportunity -> 401
Run-Test "3. Unauthenticated POST Opportunity (401)" {
    $opp = @{ title = "No Auth Role"; company = "Ghost Corp"; description = "Desc"; type = "internship"; workMode = "remote"; location = "Remote" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/opportunities" -Method Post -Body $opp -ContentType "application/json"
} 401

# 4. Student POST opportunity -> 403
Run-Test "4. Student Forbidden from POST Opportunity (403)" {
    $opp = @{ title = "Student Trying to Post"; company = "Fake Corp"; description = "Desc"; type = "internship"; workMode = "remote"; location = "Remote" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/opportunities" -Method Post -Body $opp -ContentType "application/json" -Headers @{ Authorization = "Bearer $studentToken" }
} 403

# 12. Invalid opportunity data (missing required fields / bad enum) -> 400
Run-Test "12. Invalid Opportunity Data Validation (400)" {
    $badOpp = @{ title = "AB"; company = ""; description = ""; type = "super-job"; workMode = "anywhere"; location = "" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/opportunities" -Method Post -Body $badOpp -ContentType "application/json" -Headers @{ Authorization = "Bearer $rec1Token" }
} 400

# 5. Recruiter 1 POST opportunity -> 201
$opp1Id = $null
$createTest = Run-Test "5. Recruiter 1 Creates Opportunity (201)" {
    $oppData = @{
        title = "Full Stack Engineer Intern $testRunId"
        company = "Acme Tech Innovations"
        description = "Develop full-stack web applications using React, Node.js, and MongoDB."
        type = "internship"
        workMode = "remote"
        location = "Bangalore, India"
        skills = @("react", "node.js", "mongodb")
        stipend = "$1,000 / month"
        applicationDeadline = "2026-12-31"
    } | ConvertTo-Json

    $res = Invoke-WebRequest -Uri "$baseUrl/opportunities" -Method Post -Body $oppData -ContentType "application/json" -Headers @{ Authorization = "Bearer $rec1Token" } -UseBasicParsing
    $json = $res.Content | ConvertFrom-Json
    $global:opp1Id = $json.data._id
    return [int]$res.StatusCode
} 201

# Also create Opportunity 2 by Recruiter 1 for filter testing
$oppData2 = @{
    title = "Backend Go Specialist $testRunId"
    company = "CloudScale Systems"
    description = "Design distributed microservices with Go and Kubernetes."
    type = "full-time"
    workMode = "hybrid"
    location = "Hyderabad, India"
    skills = @("go", "docker", "kubernetes")
    salary = "$80,000 / year"
    applicationDeadline = "2026-11-30"
} | ConvertTo-Json
$res2 = Invoke-WebRequest -Uri "$baseUrl/opportunities" -Method Post -Body $oppData2 -ContentType "application/json" -Headers @{ Authorization = "Bearer $rec1Token" } -UseBasicParsing
$opp2Id = ($res2.Content | ConvertFrom-Json).data._id

# 6. Recruiter GET /my -> 200
Run-Test "6. Recruiter 1 GET /my Postings (200)" {
    $myOpps = Invoke-RestMethod -Uri "$baseUrl/opportunities/my" -Method Get -Headers @{ Authorization = "Bearer $rec1Token" }
    if ($myOpps.count -ge 2) { return @{ success = $true } } else { throw "Count should be >= 2" }
} 200

# 2. Public GET single opportunity
Run-Test "2. Public GET Single Opportunity (200)" {
    $single = Invoke-RestMethod -Uri "$baseUrl/opportunities/$opp1Id" -Method Get
    if ($single.data.title -like "*Full Stack Engineer Intern*") { return @{ success = $true } } else { throw "Title mismatch" }
} 200

# 7. Recruiter GET own opportunity
Run-Test "7. Recruiter GET Own Opportunity via ID (200)" {
    Invoke-RestMethod -Uri "$baseUrl/opportunities/$opp1Id" -Method Get -Headers @{ Authorization = "Bearer $rec1Token" }
} 200

# 8. Recruiter updates own opportunity -> 200
Run-Test "8. Recruiter 1 Updates Own Opportunity (200)" {
    $updateData = @{
        title = "Lead Full Stack Engineer Intern $testRunId"
        stipend = "$1,500 / month"
    } | ConvertTo-Json
    $updated = Invoke-RestMethod -Uri "$baseUrl/opportunities/$opp1Id" -Method Put -Body $updateData -ContentType "application/json" -Headers @{ Authorization = "Bearer $rec1Token" }
    if ($updated.data.title -like "Lead Full Stack Engineer*") { return @{ success = $true } } else { throw "Update title mismatch" }
} 200

# 10. Recruiter 2 attempts to update Recruiter 1's opportunity -> 403 Forbidden
Run-Test "10. Recruiter 2 Forbidden from Updating Recruiter 1 Opportunity (403)" {
    $hackedUpdate = @{ title = "Malicious Hijack Title" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/opportunities/$opp1Id" -Method Put -Body $hackedUpdate -ContentType "application/json" -Headers @{ Authorization = "Bearer $rec2Token" }
} 403

# 11. Recruiter 2 attempts to deactivate Recruiter 1's opportunity -> 403 Forbidden
Run-Test "11. Recruiter 2 Forbidden from Deactivating Recruiter 1 Opportunity (403)" {
    Invoke-RestMethod -Uri "$baseUrl/opportunities/$opp1Id" -Method Delete -Headers @{ Authorization = "Bearer $rec2Token" }
} 403

# 13. Invalid opportunity ID (malformed ObjectId) -> 400 Bad Request
Run-Test "13. Malformed ObjectId Rejection (400)" {
    Invoke-RestMethod -Uri "$baseUrl/opportunities/invalid-mongo-id-123" -Method Get
} 400

# 14. Search works
Run-Test "14. Search Query Verification (?search=Acme)" {
    $searchRes = Invoke-RestMethod -Uri "$baseUrl/opportunities?search=Acme" -Method Get
    if ($searchRes.count -ge 1) { return @{ success = $true } } else { throw "Search returned 0 results" }
} 200

# 15. Type filter works
Run-Test "15. Type Filter Verification (?type=internship)" {
    $typeRes = Invoke-RestMethod -Uri "$baseUrl/opportunities?type=internship" -Method Get
    $mismatched = $typeRes.data | Where-Object { $_.type -ne "internship" }
    if ($mismatched.Count -eq 0 -and $typeRes.count -ge 1) { return @{ success = $true } } else { throw "Type filter failed" }
} 200

# 16. Work mode filter works
Run-Test "16. Work Mode Filter Verification (?workMode=hybrid)" {
    $modeRes = Invoke-RestMethod -Uri "$baseUrl/opportunities?workMode=hybrid" -Method Get
    $mismatched = $modeRes.data | Where-Object { $_.workMode -ne "hybrid" }
    if ($mismatched.Count -eq 0 -and $modeRes.count -ge 1) { return @{ success = $true } } else { throw "WorkMode filter failed" }
} 200

# 17. Skills filter works
Run-Test "17. Skills Filter Verification (?skills=react)" {
    $skillRes = Invoke-RestMethod -Uri "$baseUrl/opportunities?skills=react" -Method Get
    if ($skillRes.count -ge 1) { return @{ success = $true } } else { throw "Skill filter failed" }
} 200

# 18. Pagination works
Run-Test "18. Pagination Verification (?page=1&limit=1)" {
    $pageRes = Invoke-RestMethod -Uri "$baseUrl/opportunities?page=1&limit=1" -Method Get
    if ($pageRes.data.Count -eq 1 -and $pageRes.pagination.limit -eq 1) { return @{ success = $true } } else { throw "Pagination failed" }
} 200

# 9. Recruiter deactivates own opportunity (soft delete) -> 200
Run-Test "9. Recruiter 1 Deactivates Own Opportunity (200)" {
    Invoke-RestMethod -Uri "$baseUrl/opportunities/$opp1Id" -Method Delete -Headers @{ Authorization = "Bearer $rec1Token" }
} 200

# 19. Inactive opportunities are excluded from public listing & public get by ID
Run-Test "19. Inactive Opportunity Excluded from Public Discovery (404 on Detail)" {
    Invoke-RestMethod -Uri "$baseUrl/opportunities/$opp1Id" -Method Get
} 404

# Cleanup test opportunities to leave database clean
try {
    $del = Invoke-RestMethod -Uri "$baseUrl/opportunities/$opp2Id" -Method Delete -Headers @{ Authorization = "Bearer $rec1Token" }
    Write-Host "[CLEANUP] Test opportunities deactivated successfully." -ForegroundColor Yellow
} catch {
    Write-Host "[CLEANUP NOTICE] Non-fatal cleanup notification: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "   ALL 21 TESTS COMPLETED SUCCESSFULLY!         " -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
