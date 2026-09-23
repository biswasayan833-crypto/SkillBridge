# SkillBridge Full Regression Test Runner
$scratchDir = $PSScriptRoot

$scripts = @(
    'test_auth.ps1',
    'test_phase3_opportunities.ps1',
    'test_phase4_applications.ps1',
    'test_phase5_profile_resume.ps1',
    'test_phase6_frontend_api.ps1',
    'test_phase7_dashboards.ps1',
    'test_phase8_security.ps1',
    'test_phase8_6_login.ps1'
)

$results = @()
$grandPassed = 0
$grandTotal = 0

foreach ($script in $scripts) {
    $scriptPath = Join-Path $scratchDir $script
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "Running: $script" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    
    $output = & powershell -NoProfile -ExecutionPolicy Bypass -File $scriptPath 2>&1 | Out-String
    
    # Try different regex patterns for the summary line
    $passed = 0
    $total = 0
    $found = $false
    
    if ($output -match '(\d+)\s*/\s*(\d+)\s*(tests?\s*passed|passed)') {
        $passed = [int]$matches[1]
        $total = [int]$matches[2]
        $found = $true
    } elseif ($output -match 'ALL\s+(\d+)\s+TESTS?\s+COMPLETED') {
        $passed = [int]$matches[1]
        $total = [int]$matches[1]
        $found = $true
    } elseif ($output -match 'ALL\s+(\d+)\s+PHASE\s+4\s+TESTS') {
        $passed = [int]$matches[1]
        $total = [int]$matches[1]
        $found = $true
    }
    
    if ($found) {
        $grandPassed += $passed
        $grandTotal += $total
        $status = if ($passed -eq $total) { 'PASSED' } else { 'FAILED' }
        $results += [PSCustomObject]@{
            Suite = $script
            Passed = $passed
            Total = $total
            Status = $status
        }
        Write-Host "Result: $passed / $total Passed ($status)`n" -ForegroundColor $(if ($status -eq 'PASSED') { 'Green' } else { 'Red' })
    } else {
        Write-Host $output
        $results += [PSCustomObject]@{
            Suite = $script
            Passed = 0
            Total = 0
            Status = 'UNKNOWN'
        }
    }

}

Write-Host "==========================================" -ForegroundColor Yellow
Write-Host "GRAND SUMMARY" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow
$results | Format-Table -AutoSize
Write-Host "Grand Total: $grandPassed / $grandTotal Tests Passed" -ForegroundColor $(if ($grandPassed -eq $grandTotal -and $grandTotal -eq 185) { 'Green' } else { 'Red' })
