# =============================================================================
#  PowerShell API Authentication Test Script
# =============================================================================
#  This script will:
#  1. Attempt to register a new user.
#  2. Log in with that user's credentials.
#  3. Capture the JWT token from the login response.
#  4. Use the token to access a protected endpoint.
# =============================================================================

# --- Configuration ---
# Set the base URL for your API.
# Ensure your local API server is running and accessible at this address.
$baseUrl = "http://127.0.0.1:8000/api/v1/auth"

# --- Fix for Character Display (Emojis) ---
# This command ensures that emojis like ✅ and ❌ display correctly in the terminal.
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "--- Starting API Test Suite (`"$(Get-Date)`") ---" -ForegroundColor Yellow


# =============================================================================
#  STEP 1: Register a New User
# =============================================================================
Write-Host "`n[1/4] Attempting to register a new user..."
$registerBody = @{
    email            = "testfix@test.com"
    username         = "testfix"
    password         = "TestPassword123"
    confirm_password = "TestPassword123"
}

try {
    # We use -ErrorAction Stop to ensure that if this fails, the 'catch' block will run.
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/register" -Method Post -Body ($registerBody | ConvertTo-Json) -ContentType "application/json" -ErrorAction Stop
    Write-Host "✅ SUCCESS: Registration endpoint returned a successful response."
}
catch {
    # This block will catch errors, such as when the user already exists (HTTP 4xx error).
    Write-Warning "⚠️ WARNING: Registration endpoint failed. This is expected if the user already exists."
    # We will continue to the login step, as the user may have been created in a previous run.
}


# =============================================================================
#  STEP 2: Log In to Get the JWT Token
# =============================================================================
Write-Host "`n[2/4] Attempting to log in..."
$loginBody = @{
    email    = "testfix@test.com"
    password = "TestPassword123"
}

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/login" -Method Post -Body ($loginBody | ConvertTo-Json) -ContentType "application/json" -ErrorAction Stop
}
catch {
    Write-Error "❌ FATAL: The Login request itself failed. Check API server logs. Error: $($_.Exception.Message)"
    # Stop the script if the API call itself fails (e.g., server down, 500 error)
    return 
}

# =============================================================================
#  STEP 3: Capture the Token from the Response
# =============================================================================
Write-Host "`n[3/4] Analyzing login response to find the token..."

# --- THIS IS THE CORRECTED LINE ---
# Based on your API's nested response, we access the token like this:
$jwtToken = $loginResponse.token.access_token

if ($jwtToken) {
    Write-Host "✅ SUCCESS: Token found and captured successfully."
} else {
    Write-Error "❌ FATAL: Login API call was successful, but a token could not be found in the response body. Please check the 'DEBUG' output above and correct the field name in this script."
    return # Stop the script if no token can be found
}


# =============================================================================
#  STEP 4: Test the Protected Endpoint
# =============================================================================
Write-Host "`n[4/4] Attempting to access protected '/me' endpoint with the token..."

# Create the headers object required for Bearer Token authorization
$headers = @{
    "Authorization" = "Bearer $jwtToken"
}

try {
    # GET is the default method, so -Method is not required here.
    $meResponse = Invoke-RestMethod -Uri "$baseUrl/me" -Headers $headers -ErrorAction Stop
    Write-Host "✅ SUCCESS: Protected endpoint accessed successfully!"
    Write-Host "`n--- User Data from /me Endpoint ---"
    $meResponse | ConvertTo-Json
    Write-Host "------------------------------------"
}
catch {
    Write-Error "❌ FATAL: Access to protected endpoint failed. The token might be invalid or expired. Error: $($_.Exception.Message)"
}

Write-Host "`n--- API Test Suite Finished ---" -ForegroundColor Yellow