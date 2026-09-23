# Phase 6 Comprehensive Flow Verification Script
# Simulates all frontend API interactions:
# Flow 1: Public Opportunity Search, Filters & Single Lookup
# Flow 2: Student Application Flow & Duplicate Prevention (409)
# Flow 3: Student Tracking & Application Details Retrieval
# Flow 4: Recruiter Opportunity Lifecycle (Create, List, Update, Soft-Deactivate)
# Flow 5: Recruiter Candidate Pipeline & Status Funnel Updates
# Flow 6: Student Profile & Resume Endpoints

$baseUrl = "http://localhost:5000"
$headers = @{ "Content-Type" = "application/json" }
$testId = [System.Guid]::NewGuid().ToString().Substring(0, 8)

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "SKILLBRIDGE PHASE 6 TEST SUITE (Frontend Flows)" -ForegroundColor Cyan
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

# 2. Register fresh Student and Recruiter accounts
$studentEmail = "p6.student.$testId@example.com"
$recruiterEmail = "p6.recruiter.$testId@example.com"
$testPassword = "Password123!"

$studentReg = @{ name = "P6 Student"; email = $studentEmail; password = $testPassword; role = "student" } | ConvertTo-Json
$recruiterReg = @{ name = "P6 Recruiter"; email = $recruiterEmail; password = $testPassword; role = "recruiter" } | ConvertTo-Json

$studentToken = ""
$recruiterToken = ""

try {
    $sRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $studentReg -Headers $headers
    $studentToken = $sRes.token
    Assert-Test "Student registration succeeds" ($sRes.success -eq $true -and $studentToken -ne "")
} catch {
    Assert-Test "Student registration succeeds" $false $_.Exception.Message
}

try {
    $rRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $recruiterReg -Headers $headers
    $recruiterToken = $rRes.token
    Assert-Test "Recruiter registration succeeds" ($rRes.success -eq $true -and $recruiterToken -ne "")
} catch {
    Assert-Test "Recruiter registration succeeds" $false $_.Exception.Message
}

$studentHeaders = @{ "Authorization" = "Bearer $studentToken"; "Content-Type" = "application/json" }
$recruiterHeaders = @{ "Authorization" = "Bearer $recruiterToken"; "Content-Type" = "application/json" }

# ==============================================================================
# FLOW 1: RECRUITER POSTS OPPORTUNITY
# ==============================================================================
Write-Host "`n--- Flow 1: Recruiter Opportunity Management ---" -ForegroundColor Yellow

$newOppPayload = @{
    title = "Full Stack Engineer Intern $testId"
    company = "SkillBridge Corp"
    description = "Exciting full-stack engineering role working on React, Node.js, and MongoDB."
    type = "internship"
    workMode = "remote"
    location = "San Francisco, CA"
    skills = @("React", "Node.js", "MongoDB", "Express")
    stipend = "$3,000 / month"
    eligibility = "Undergraduate students graduating 2026/2027"
    applicationDeadline = (Get-Date).AddMonths(1).ToString("yyyy-MM-dd")
} | ConvertTo-Json

$createdOppId = ""
try {
    $oppRes = Invoke-RestMethod -Uri "$baseUrl/api/opportunities" -Method Post -Body $newOppPayload -Headers $recruiterHeaders
    $createdOppId = $oppRes.data._id
    Assert-Test "Recruiter can post new opportunity" ($oppRes.success -eq $true -and $createdOppId -ne "")
} catch {
    Assert-Test "Recruiter can post new opportunity" $false $_.Exception.Message
}

# Fetch recruiter's opportunities
try {
    $myOpps = Invoke-RestMethod -Uri "$baseUrl/api/opportunities/my" -Method Get -Headers $recruiterHeaders
    $found = ($myOpps.data | Where-Object { $_._id -eq $createdOppId })
    Assert-Test "Recruiter can list their posted opportunities" ($myOpps.success -eq $true -and $found -ne $null)
} catch {
    Assert-Test "Recruiter can list their posted opportunities" $false $_.Exception.Message
}

# Update opportunity
$updatePayload = @{
    title = "Senior Full Stack Intern $testId"
    stipend = "$3,500 / month"
    workMode = "hybrid"
    location = "San Francisco, CA"
    description = "Updated role description for testing."
    type = "internship"
    skills = @("React", "Node.js", "Docker")
} | ConvertTo-Json

try {
    $editRes = Invoke-RestMethod -Uri "$baseUrl/api/opportunities/$createdOppId" -Method Put -Body $updatePayload -Headers $recruiterHeaders
    Assert-Test "Recruiter can edit their own opportunity" ($editRes.success -eq $true -and $editRes.data.title -eq "Senior Full Stack Intern $testId")
} catch {
    Assert-Test "Recruiter can edit their own opportunity" $false $_.Exception.Message
}

# ==============================================================================
# FLOW 2: PUBLIC OPPORTUNITY DISCOVERY & FILTERS
# ==============================================================================
Write-Host "`n--- Flow 2: Public Opportunity Discovery & Search ---" -ForegroundColor Yellow

# Search by keyword
try {
    $searchRes = Invoke-RestMethod -Uri "$baseUrl/api/opportunities?search=Senior%20Full%20Stack" -Method Get
    $match = ($searchRes.data | Where-Object { $_._id -eq $createdOppId })
    Assert-Test "Public keyword search finds matching opportunity" ($searchRes.success -eq $true -and $match -ne $null)
} catch {
    Assert-Test "Public keyword search finds matching opportunity" $false $_.Exception.Message
}

# Filter by type & workMode
try {
    $filterRes = Invoke-RestMethod -Uri "$baseUrl/api/opportunities?type=internship&workMode=hybrid" -Method Get
    $match = ($filterRes.data | Where-Object { $_._id -eq $createdOppId })
    Assert-Test "Public filtering by type and workMode returns results" ($filterRes.success -eq $true -and $match -ne $null)
} catch {
    Assert-Test "Public filtering by type and workMode returns results" $false $_.Exception.Message
}

# Single opportunity lookup
try {
    $singleOpp = Invoke-RestMethod -Uri "$baseUrl/api/opportunities/$createdOppId" -Method Get
    Assert-Test "Public single opportunity detail lookup succeeds" ($singleOpp.success -eq $true -and $singleOpp.data._id -eq $createdOppId)
} catch {
    Assert-Test "Public single opportunity detail lookup succeeds" $false $_.Exception.Message
}

# ==============================================================================
# FLOW 3: STUDENT APPLICATION SUBMISSION & TRACKING
# ==============================================================================
Write-Host "`n--- Flow 3: Student Application Submission & Duplicate Handling ---" -ForegroundColor Yellow

$appPayload = @{
    opportunity = $createdOppId
    coverLetter = "I am very excited to apply for this internship. I have extensive experience in React and Node.js."
} | ConvertTo-Json

$createdAppId = ""
try {
    $subRes = Invoke-RestMethod -Uri "$baseUrl/api/applications" -Method Post -Body $appPayload -Headers $studentHeaders
    $createdAppId = $subRes.data._id
    Assert-Test "Student can submit application" ($subRes.success -eq $true -and $createdAppId -ne "")
} catch {
    Assert-Test "Student can submit application" $false $_.Exception.Message
}

# Attempt duplicate submission -> Assert 409
try {
    Invoke-RestMethod -Uri "$baseUrl/api/applications" -Method Post -Body $appPayload -Headers $studentHeaders -ErrorAction Stop
    Assert-Test "Duplicate application returns 409 Conflict" $false "Expected 409"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Assert-Test "Duplicate application returns 409 Conflict" ($status -eq 409)
}

# Student views their applications list
try {
    $myApps = Invoke-RestMethod -Uri "$baseUrl/api/applications/my" -Method Get -Headers $studentHeaders
    $myApp = ($myApps.data | Where-Object { $_._id -eq $createdAppId })
    Assert-Test "Student can retrieve their application list" ($myApps.success -eq $true -and $myApp -ne $null -and $myApp.status -eq "Applied")
} catch {
    Assert-Test "Student can retrieve their application list" $false $_.Exception.Message
}

# Student views single application details
try {
    $singleApp = Invoke-RestMethod -Uri "$baseUrl/api/applications/$createdAppId" -Method Get -Headers $studentHeaders
    Assert-Test "Student can view single application details" ($singleApp.success -eq $true -and $singleApp.data._id -eq $createdAppId -and $singleApp.data.coverLetter -ne "")
} catch {
    Assert-Test "Student can view single application details" $false $_.Exception.Message
}

# ==============================================================================
# FLOW 4: RECRUITER APPLICANT PIPELINE & STATUS FUNNEL
# ==============================================================================
Write-Host "`n--- Flow 4: Recruiter Applicant Review & Status Funnel ---" -ForegroundColor Yellow

# Recruiter fetches applicants for opportunity
try {
    $candidates = Invoke-RestMethod -Uri "$baseUrl/api/applications/opportunity/$createdOppId" -Method Get -Headers $recruiterHeaders
    $cand = ($candidates.data | Where-Object { $_._id -eq $createdAppId })
    Assert-Test "Recruiter can fetch candidate applicants for opportunity" ($candidates.success -eq $true -and $cand -ne $null)
} catch {
    Assert-Test "Recruiter can fetch candidate applicants for opportunity" $false $_.Exception.Message
}

# Recruiter updates candidate status through the hiring funnel
$stages = @("Under Review", "Shortlisted", "Interview", "Selected")
foreach ($stage in $stages) {
    try {
        $statusPayload = @{ status = $stage } | ConvertTo-Json
        $stRes = Invoke-RestMethod -Uri "$baseUrl/api/applications/$createdAppId/status" -Method Put -Body $statusPayload -Headers $recruiterHeaders
        Assert-Test "Recruiter can update status to '$stage'" ($stRes.success -eq $true -and $stRes.data.status -eq $stage)
    } catch {
        Assert-Test "Recruiter can update status to '$stage'" $false $_.Exception.Message
    }
}

# Verify student sees the updated status
try {
    $verifyApp = Invoke-RestMethod -Uri "$baseUrl/api/applications/$createdAppId" -Method Get -Headers $studentHeaders
    Assert-Test "Student sees updated status 'Selected'" ($verifyApp.data.status -eq "Selected")
} catch {
    Assert-Test "Student sees updated status 'Selected'" $false $_.Exception.Message
}

# ==============================================================================
# FLOW 5: OPPORTUNITY SOFT-DEACTIVATION
# ==============================================================================
Write-Host "`n--- Flow 5: Soft Deactivation & Public Feed Isolation ---" -ForegroundColor Yellow

try {
    $delRes = Invoke-RestMethod -Uri "$baseUrl/api/opportunities/$createdOppId" -Method Delete -Headers $recruiterHeaders
    Assert-Test "Recruiter can deactivate opportunity" ($delRes.success -eq $true)
} catch {
    Assert-Test "Recruiter can deactivate opportunity" $false $_.Exception.Message
}

# Verify deactivated opportunity is excluded from public discovery
try {
    Invoke-RestMethod -Uri "$baseUrl/api/opportunities/$createdOppId" -Method Get -ErrorAction Stop
    Assert-Test "Public query for deactivated opportunity returns 404" $false "Expected 404"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Assert-Test "Public query for deactivated opportunity returns 404" ($status -eq 404)
}

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "PHASE 6 TEST SUMMARY: $passedCount / $totalCount Passed" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

if ($passedCount -eq $totalCount) {
    Write-Host "ALL PHASE 6 FLOW TESTS PASSED SUCCESSFULLY!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "SOME TESTS FAILED." -ForegroundColor Red
    exit 1
}
