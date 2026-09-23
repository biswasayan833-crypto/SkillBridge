# Phase 5 Verification Test Script
# Tests:
# 1. Profile retrieval (GET /api/users/profile)
# 2. Profile update (PUT /api/users/profile)
# 3. Forbidden field rejection (role, password, email, resume, _id)
# 4. Field validations (graduationYear, github URL, skills array)
# 5. Role authorization (POST / DELETE resume student-only, 403 for recruiter)
# 6. File type restrictions (.pdf and .docx only, reject .txt / .png)
# 7. File size limit (reject > 5MB)
# 8. Resume upload and persistence in DB & disk
# 9. Resume replacement and automatic cleanup of previous file
# 10. Direct file retrieval via GET /api/users/resume and static /uploads/resumes/
# 11. Resume deletion and disk cleanup
# 12. Regression checks for Phase 2, 3, 4 APIs

$baseUrl = "http://localhost:5000"
$headers = @{ "Content-Type" = "application/json" }
$testId = [System.Guid]::NewGuid().ToString().Substring(0, 8)

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "SKILLBRIDGE PHASE 5 TEST SUITE (Profile & Resume)" -ForegroundColor Cyan
Write-Host "Test Run ID: $testId" -ForegroundColor Cyan
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
    Write-Host "Fatal: Cannot connect to API server at $baseUrl. Ensure server is running." -ForegroundColor Red
    exit 1
}

# 2. Register Test Users
$studentEmail = "student.p5.$testId@example.com"
$recruiterEmail = "recruiter.p5.$testId@example.com"
$testPassword = "Password123!"

$studentRegPayload = @{
    name = "Phase5 Student"
    email = $studentEmail
    password = $testPassword
    role = "student"
} | ConvertTo-Json

$recruiterRegPayload = @{
    name = "Phase5 Recruiter"
    email = $recruiterEmail
    password = $testPassword
    role = "recruiter"
} | ConvertTo-Json

$studentToken = ""
$studentUser = $null
$recruiterToken = ""

try {
    $studentRegRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $studentRegPayload -Headers $headers
    $studentToken = $studentRegRes.token
    $studentUser = $studentRegRes.user
    Assert-Test "Student registration succeeded" ($studentRegRes.success -eq $true -and $studentToken -ne "")
} catch {
    Assert-Test "Student registration succeeded" $false $_.Exception.Message
}

try {
    $recruiterRegRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $recruiterRegPayload -Headers $headers
    $recruiterToken = $recruiterRegRes.token
    Assert-Test "Recruiter registration succeeded" ($recruiterRegRes.success -eq $true -and $recruiterToken -ne "")
} catch {
    Assert-Test "Recruiter registration succeeded" $false $_.Exception.Message
}

$studentAuthHeaders = @{
    "Authorization" = "Bearer $studentToken"
    "Content-Type" = "application/json"
}

$recruiterAuthHeaders = @{
    "Authorization" = "Bearer $recruiterToken"
    "Content-Type" = "application/json"
}

# ==============================================================================
# PROFILE TESTS
# ==============================================================================
Write-Host "`n--- Testing Profile Endpoints ---" -ForegroundColor Yellow

# Test 1: GET /api/users/profile unauthenticated -> 401
try {
    Invoke-RestMethod -Uri "$baseUrl/api/users/profile" -Method Get -ErrorAction Stop
    Assert-Test "GET /api/users/profile without token returns 401" $false "Expected 401"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Assert-Test "GET /api/users/profile without token returns 401" ($status -eq 401)
}

# Test 2: GET /api/users/profile authenticated -> 200 with sanitized user
try {
    $profRes = Invoke-RestMethod -Uri "$baseUrl/api/users/profile" -Method Get -Headers $studentAuthHeaders
    $hasNoPass = ($profRes.user.password -eq $null)
    $hasFields = ($profRes.user.email -eq $studentEmail -and $profRes.user.role -eq "student" -and $profRes.user.resume -ne $null)
    Assert-Test "GET /api/users/profile returns 200 and omits password" ($profRes.success -eq $true -and $hasNoPass -and $hasFields)
} catch {
    Assert-Test "GET /api/users/profile returns 200 and omits password" $false $_.Exception.Message
}

# Test 3: PUT /api/users/profile valid updates
$validUpdatePayload = @{
    phone = "+1 555 123 4567"
    location = "San Francisco, CA"
    college = "Stanford University"
    degree = "B.S. Computer Science"
    graduationYear = 2026
    bio = "Aspiring software engineer interested in distributed systems."
    skills = @("JavaScript", "React", "Node.js", "MongoDB", "Docker")
    github = "https://github.com/phase5student"
    linkedin = "https://linkedin.com/in/phase5student"
} | ConvertTo-Json

try {
    $upRes = Invoke-RestMethod -Uri "$baseUrl/api/users/profile" -Method Put -Body $validUpdatePayload -Headers $studentAuthHeaders
    $u = $upRes.user
    $match = ($u.college -eq "Stanford University" -and $u.degree -eq "B.S. Computer Science" -and $u.graduationYear -eq 2026 -and $u.skills.Count -eq 5 -and $u.github -eq "https://github.com/phase5student")
    Assert-Test "PUT /api/users/profile updates allowed fields successfully" ($upRes.success -eq $true -and $match)
} catch {
    Assert-Test "PUT /api/users/profile updates allowed fields successfully" $false $_.Exception.Message
}

# Test 4: PUT /api/users/profile trying to modify role -> 400
try {
    $badRolePayload = @{ role = "admin" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/users/profile" -Method Put -Body $badRolePayload -Headers $studentAuthHeaders -ErrorAction Stop
    Assert-Test "PUT /api/users/profile rejects role modification with 400" $false "Expected 400"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Assert-Test "PUT /api/users/profile rejects role modification with 400" ($status -eq 400)
}

# Test 5: PUT /api/users/profile trying to modify password -> 400
try {
    $badPassPayload = @{ password = "NewPassword123!" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/users/profile" -Method Put -Body $badPassPayload -Headers $studentAuthHeaders -ErrorAction Stop
    Assert-Test "PUT /api/users/profile rejects password modification with 400" $false "Expected 400"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Assert-Test "PUT /api/users/profile rejects password modification with 400" ($status -eq 400)
}

# Test 6: PUT /api/users/profile trying to modify email -> 400
try {
    $badEmailPayload = @{ email = "newemail@example.com" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/users/profile" -Method Put -Body $badEmailPayload -Headers $studentAuthHeaders -ErrorAction Stop
    Assert-Test "PUT /api/users/profile rejects email modification with 400" $false "Expected 400"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Assert-Test "PUT /api/users/profile rejects email modification with 400" ($status -eq 400)
}

# Test 7: PUT /api/users/profile trying to modify resume directly -> 400
try {
    $badResumePayload = @{ resume = @{ url = "/fake.pdf" } } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/users/profile" -Method Put -Body $badResumePayload -Headers $studentAuthHeaders -ErrorAction Stop
    Assert-Test "PUT /api/users/profile rejects direct resume modification with 400" $false "Expected 400"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Assert-Test "PUT /api/users/profile rejects direct resume modification with 400" ($status -eq 400)
}

# Test 8: PUT /api/users/profile with invalid GitHub URL -> 400
try {
    $badUrlPayload = @{ github = "not-a-valid-url" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/users/profile" -Method Put -Body $badUrlPayload -Headers $studentAuthHeaders -ErrorAction Stop
    Assert-Test "PUT /api/users/profile rejects invalid github URL with 400" $false "Expected 400"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Assert-Test "PUT /api/users/profile rejects invalid github URL with 400" ($status -eq 400)
}

# Test 9: PUT /api/users/profile with invalid graduation year (e.g. 1850) -> 400
try {
    $badYearPayload = @{ graduationYear = 1850 } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/users/profile" -Method Put -Body $badYearPayload -Headers $studentAuthHeaders -ErrorAction Stop
    Assert-Test "PUT /api/users/profile rejects out-of-range graduationYear with 400" $false "Expected 400"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Assert-Test "PUT /api/users/profile rejects out-of-range graduationYear with 400" ($status -eq 400)
}

# ==============================================================================
# RESUME TESTS
# ==============================================================================
Write-Host "`n--- Testing Resume Upload & Management Endpoints ---" -ForegroundColor Yellow

# Helper function to perform multipart form-data upload via curl.exe
function Upload-ResumeFile {
    param(
        [string]$FilePath,
        [string]$Token,
        [string]$MimeType = ""
    )
    $args = @("-s", "-w", "\n%{http_code}", "-X", "POST", "$baseUrl/api/users/resume", "-H", "Authorization: Bearer $Token")
    if ($MimeType) {
        $args += "-F", "resume=@$FilePath;type=$MimeType"
    } else {
        $args += "-F", "resume=@$FilePath"
    }
    $raw = & curl.exe @args
    $lines = $raw -split "`n"
    $statusCode = [int]($lines[-1].Trim())
    $body = ($lines[0..($lines.Count - 2)] -join "`n").Trim()
    return @{ StatusCode = $statusCode; Body = $body }
}

# Create temp files for testing
$tempDir = [System.IO.Path]::GetTempPath()
$pdfPath = [System.IO.Path]::Combine($tempDir, "test_resume_$testId.pdf")
$docxPath = [System.IO.Path]::Combine($tempDir, "test_resume_$testId.docx")
$txtPath = [System.IO.Path]::Combine($tempDir, "test_bad_$testId.txt")
$oversizePdfPath = [System.IO.Path]::Combine($tempDir, "test_oversize_$testId.pdf")

# Generate mock PDF (starting with %PDF- header)
[System.IO.File]::WriteAllBytes($pdfPath, [System.Text.Encoding]::ASCII.GetBytes("%PDF-1.4 Mock PDF Content For Phase 5 Testing"))

# Generate mock DOCX (ZIP format or valid binary signature)
[System.IO.File]::WriteAllBytes($docxPath, [System.Text.Encoding]::ASCII.GetBytes("PK`0`0 Mock DOCX Content For Phase 5 Testing"))

# Generate mock TXT
[System.IO.File]::WriteAllText($txtPath, "Invalid plain text resume")

# Generate 5.5MB file for size limit testing
$oversizeBytes = New-Object byte[] (6 * 1024 * 1024)
[System.IO.File]::WriteAllBytes($oversizePdfPath, $oversizeBytes)

# Test 10: GET /api/users/resume before upload -> 404
try {
    Invoke-RestMethod -Uri "$baseUrl/api/users/resume" -Method Get -Headers $studentAuthHeaders -ErrorAction Stop
    Assert-Test "GET /api/users/resume before upload returns 404" $false "Expected 404"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Assert-Test "GET /api/users/resume before upload returns 404" ($status -eq 404)
}

# Test 11: POST /api/users/resume without token -> 401
$noTokenUpload = Upload-ResumeFile -FilePath $pdfPath -Token "" -MimeType "application/pdf"
Assert-Test "POST /api/users/resume without token returns 401" ($noTokenUpload.StatusCode -eq 401)

# Test 12: POST /api/users/resume as recruiter -> 403
$recruiterUpload = Upload-ResumeFile -FilePath $pdfPath -Token $recruiterToken -MimeType "application/pdf"
Assert-Test "POST /api/users/resume as recruiter returns 403 Forbidden" ($recruiterUpload.StatusCode -eq 403)

# Test 13: POST /api/users/resume with invalid file type (.txt) -> 400
$badTypeUpload = Upload-ResumeFile -FilePath $txtPath -Token $studentToken -MimeType "text/plain"
Assert-Test "POST /api/users/resume with .txt file returns 400" ($badTypeUpload.StatusCode -eq 400)

# Test 14: POST /api/users/resume with oversized file (>5MB) -> 400
$oversizeUpload = Upload-ResumeFile -FilePath $oversizePdfPath -Token $studentToken -MimeType "application/pdf"
Assert-Test "POST /api/users/resume with file >5MB returns 400" ($oversizeUpload.StatusCode -eq 400)

# Test 15: POST /api/users/resume with valid PDF -> 200
$pdfUpload = Upload-ResumeFile -FilePath $pdfPath -Token $studentToken -MimeType "application/pdf"
$firstFilename = ""
if ($pdfUpload.StatusCode -eq 200) {
    $uploadJson = $pdfUpload.Body | ConvertFrom-Json
    $firstFilename = $uploadJson.resume.filename
    $resOk = ($uploadJson.success -eq $true -and $firstFilename -match "\.pdf$")
    Assert-Test "POST /api/users/resume uploads valid PDF successfully" $resOk
} else {
    Assert-Test "POST /api/users/resume uploads valid PDF successfully" $false "Status: $($pdfUpload.StatusCode) Body: $($pdfUpload.Body)"
}

# Test 16: Verify PDF file physically exists on server disk
$uploadDiskDir = "c:\Users\Ayan Biswas\Desktop\SkillBridge\server\uploads\resumes"
$firstFileOnDisk = [System.IO.Path]::Combine($uploadDiskDir, $firstFilename)
Assert-Test "Uploaded PDF exists physically on server disk" ([System.IO.File]::Exists($firstFileOnDisk))

# Test 17: GET /api/users/resume downloads the uploaded resume -> 200
try {
    $downloadRes = Invoke-WebRequest -Uri "$baseUrl/api/users/resume" -Method Get -Headers @{ "Authorization" = "Bearer $studentToken" } -UseBasicParsing
    $contentMatch = ($downloadRes.StatusCode -eq 200 -and $downloadRes.Content.Length -gt 0)
    Assert-Test "GET /api/users/resume streams the uploaded file" $contentMatch
} catch {
    Assert-Test "GET /api/users/resume streams the uploaded file" $false $_.Exception.Message
}

# Test 18: Static route GET /uploads/resumes/<filename> serves the file
try {
    $staticRes = Invoke-WebRequest -Uri "$baseUrl/uploads/resumes/$firstFilename" -Method Get -UseBasicParsing
    Assert-Test "Static route GET /uploads/resumes/<filename> serves file" ($staticRes.StatusCode -eq 200)
} catch {
    Assert-Test "Static route GET /uploads/resumes/<filename> serves file" $false $_.Exception.Message
}

# Test 19: POST /api/users/resume replaces existing PDF with DOCX -> 200
$docxMime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
$docxUpload = Upload-ResumeFile -FilePath $docxPath -Token $studentToken -MimeType $docxMime
$secondFilename = ""
if ($docxUpload.StatusCode -eq 200) {
    $docxJson = $docxUpload.Body | ConvertFrom-Json
    $secondFilename = $docxJson.resume.filename
    $replaceOk = ($docxJson.success -eq $true -and $secondFilename -match "\.docx$" -and $secondFilename -ne $firstFilename)
    Assert-Test "POST /api/users/resume replaces PDF with DOCX" $replaceOk
} else {
    Assert-Test "POST /api/users/resume replaces PDF with DOCX" $false "Status: $($docxUpload.StatusCode) Body: $($docxUpload.Body)"
}

# Test 20: Verify old PDF was deleted from disk and new DOCX exists
$firstStillExists = [System.IO.File]::Exists($firstFileOnDisk)
$secondFileOnDisk = [System.IO.Path]::Combine($uploadDiskDir, $secondFilename)
$secondExists = [System.IO.File]::Exists($secondFileOnDisk)
Assert-Test "Old PDF unlinked and new DOCX exists on server disk" ((!$firstStillExists) -and $secondExists)

# Test 21: DELETE /api/users/resume as recruiter -> 403
try {
    Invoke-RestMethod -Uri "$baseUrl/api/users/resume" -Method Delete -Headers $recruiterAuthHeaders -ErrorAction Stop
    Assert-Test "DELETE /api/users/resume as recruiter returns 403 Forbidden" $false "Expected 403"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Assert-Test "DELETE /api/users/resume as recruiter returns 403 Forbidden" ($status -eq 403)
}

# Test 22: DELETE /api/users/resume as student -> 200
try {
    $delRes = Invoke-RestMethod -Uri "$baseUrl/api/users/resume" -Method Delete -Headers $studentAuthHeaders
    Assert-Test "DELETE /api/users/resume as student returns 200" ($delRes.success -eq $true)
} catch {
    Assert-Test "DELETE /api/users/resume as student returns 200" $false $_.Exception.Message
}

# Test 23: Verify DOCX was deleted from disk after DELETE
$secondStillExists = [System.IO.File]::Exists($secondFileOnDisk)
Assert-Test "Physical resume file removed from disk after deletion" (!$secondStillExists)

# Test 24: GET /api/users/resume after delete returns 404
try {
    Invoke-RestMethod -Uri "$baseUrl/api/users/resume" -Method Get -Headers $studentAuthHeaders -ErrorAction Stop
    Assert-Test "GET /api/users/resume after delete returns 404" $false "Expected 404"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Assert-Test "GET /api/users/resume after delete returns 404" ($status -eq 404)
}

# Test 25: Profile reflects empty resume metadata
try {
    $profAfterDel = Invoke-RestMethod -Uri "$baseUrl/api/users/profile" -Method Get -Headers $studentAuthHeaders
    $clearedMeta = ($profAfterDel.user.resume.filename -eq "" -or $profAfterDel.user.resume.filename -eq $null)
    Assert-Test "User profile reflects cleared resume metadata" ($clearedMeta)
} catch {
    Assert-Test "User profile reflects cleared resume metadata" $false $_.Exception.Message
}

# ==============================================================================
# REGRESSION CHECKS (Phases 2, 3, 4)
# ==============================================================================
Write-Host "`n--- Regression Checks (Phase 2 Auth, Phase 3 Opportunity, Phase 4 Application) ---" -ForegroundColor Yellow

# Test 26: Auth /me endpoint (Phase 2)
try {
    $meRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/me" -Method Get -Headers $studentAuthHeaders
    Assert-Test "GET /api/auth/me succeeds (Phase 2 regression)" ($meRes.success -eq $true -and $meRes.user.email -eq $studentEmail)
} catch {
    Assert-Test "GET /api/auth/me succeeds (Phase 2 regression)" $false $_.Exception.Message
}

# Test 27: Public Opportunity listings (Phase 3)
try {
    $oppsRes = Invoke-RestMethod -Uri "$baseUrl/api/opportunities" -Method Get
    Assert-Test "GET /api/opportunities succeeds (Phase 3 regression)" ($oppsRes.success -eq $true)
} catch {
    Assert-Test "GET /api/opportunities succeeds (Phase 3 regression)" $false $_.Exception.Message
}

# Test 28: Student Applications listing (Phase 4)
try {
    $appsRes = Invoke-RestMethod -Uri "$baseUrl/api/applications/my" -Method Get -Headers $studentAuthHeaders
    Assert-Test "GET /api/applications/my succeeds (Phase 4 regression)" ($appsRes.success -eq $true)
} catch {
    Assert-Test "GET /api/applications/my succeeds (Phase 4 regression)" $false $_.Exception.Message
}

# Cleanup local temp test files
Remove-Item -Path $pdfPath -Force -ErrorAction SilentlyContinue
Remove-Item -Path $docxPath -Force -ErrorAction SilentlyContinue
Remove-Item -Path $txtPath -Force -ErrorAction SilentlyContinue
Remove-Item -Path $oversizePdfPath -Force -ErrorAction SilentlyContinue

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "PHASE 5 TEST SUMMARY: $passedCount / $totalCount Passed" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

if ($passedCount -eq $totalCount) {
    Write-Host "ALL PHASE 5 TESTS PASSED SUCCESSFULLY!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "SOME TESTS FAILED." -ForegroundColor Red
    exit 1
}
