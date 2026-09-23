# Production Mode Startup Verification Script
$serverDir = "c:\Users\Ayan Biswas\Desktop\SkillBridge\server"

Write-Host "Starting SkillBridge Backend in NODE_ENV=production on Port 5001..." -ForegroundColor Cyan

# Start node in background
$procInfo = New-Object System.Diagnostics.ProcessStartInfo
$procInfo.FileName = "node"
$procInfo.Arguments = "src/server.js"
$procInfo.WorkingDirectory = $serverDir
$procInfo.EnvironmentVariables["PORT"] = "5001"
$procInfo.EnvironmentVariables["NODE_ENV"] = "production"
$procInfo.EnvironmentVariables["CLIENT_URL"] = "http://localhost:5173,http://127.0.0.1:5173"
$procInfo.UseShellExecute = $false
$procInfo.RedirectStandardOutput = $true
$procInfo.RedirectStandardError = $true

$proc = [System.Diagnostics.Process]::Start($procInfo)

# Wait 4 seconds for server to bind & connect to MongoDB Atlas
Start-Sleep -Seconds 4

$testsPassed = 0
$totalTests = 4

try {
    # 1. Health check
    Write-Host "1. Testing GET /api/health on production server..."
    $res = Invoke-WebRequest -Uri "http://localhost:5001/api/health" -UseBasicParsing -TimeoutSec 5
    if ($res.StatusCode -eq 200) {
        Write-Host "   [PASS] Production server health returned 200 OK" -ForegroundColor Green
        $testsPassed++
    }
    
    # 2. Verify security headers (Helmet)
    $xContentType = $res.Headers["X-Content-Type-Options"]
    if ($xContentType -eq "nosniff") {
        Write-Host "   [PASS] Production Helmet header X-Content-Type-Options: nosniff active" -ForegroundColor Green
        $testsPassed++
    }
    
    # 3. Test Invalid Login rejection (401)
    Write-Host "2. Testing POST /api/auth/login with invalid password..."
    try {
        $body = @{ email = "nonexistent_prod_check@example.com"; password = "WrongPassword123!" } | ConvertTo-Json
        Invoke-WebRequest -Uri "http://localhost:5001/api/auth/login" -Method Post -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 5
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 401) {
            Write-Host "   [PASS] Production login rejected invalid credentials with 401 Unauthorized" -ForegroundColor Green
            $testsPassed++
        }
    }
    
    # 4. Test Protected API without token (401)
    Write-Host "3. Testing GET /api/users/profile without token..."
    try {
        Invoke-WebRequest -Uri "http://localhost:5001/api/users/profile" -UseBasicParsing -TimeoutSec 5
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 401) {
            Write-Host "   [PASS] Production protected endpoint rejected unauthenticated request with 401 Unauthorized" -ForegroundColor Green
            $testsPassed++
        }
    }
} finally {
    # Clean up process
    if (-not $proc.HasExited) {
        $proc.Kill()
        Write-Host "Production test process terminated cleanly." -ForegroundColor Yellow
    }
}

Write-Host "Production Startup Verification: $testsPassed / $totalTests Passed" -ForegroundColor $(if ($testsPassed -eq $totalTests) { 'Green' } else { 'Red' })
