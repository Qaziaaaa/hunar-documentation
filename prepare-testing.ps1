<#
.SYNOPSIS
    Synchronizes the developer's local branch with origin/dev for testing.

.DESCRIPTION
    This script prepares the local testing environment according to team workflow:

    1. Preserves the developer on their active personal/feature branch.
       The script NEVER switches to 'dev'.

    2. Safely verifies that the working tree has no uncommitted tracked changes.
       If tracked changes exist, the script aborts to prevent data loss.

    3. Detects untracked files and PRESERVES them.
       The script NEVER runs 'git clean' and does not delete untracked files.

    4. Fetches only 'origin/dev' and verifies that the reference exists.

    5. Displays the current local commit and latest origin/dev commit.

    6. Requires explicit confirmation before performing the destructive
       local operation:
           git reset --hard origin/dev

    7. Resets ONLY the local active branch to origin/dev.
       The developer remains on their own branch.
       Nothing is pushed to the remote.

    8. Verifies that:
           Current branch == original branch
           Local HEAD == origin/dev

    9. Detects application directories containing package.json and
       package-lock.json and runs 'npm ci'.

   10. Displays a final testing-readiness report.
#>

# =============================================================================
# UTF-8 OUTPUT
# =============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

function Write-Step {
    param([string]$Message)

    Write-Host "`n>>> $Message" -ForegroundColor Cyan
}


function Write-Success {
    param([string]$Message)

    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}


function Write-Warning {
    param([string]$Message)

    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}


function Write-Failure {
    param(
        [string]$Step,
        [string]$Details
    )

    Write-Host "`n================================================================================" -ForegroundColor Red
    Write-Host " [ERROR] STEP FAILED: $Step" -ForegroundColor Red

    if ($Details) {
        Write-Host " Details: $Details" -ForegroundColor Red
    }

    Write-Host "================================================================================" -ForegroundColor Red
    Write-Host "Environment preparation was ABORTED." -ForegroundColor Yellow
    Write-Host "The environment is NOT ready for testing." -ForegroundColor Yellow

    exit 1
}


function Get-SafeString {
    param($InputObject)

    if ($null -eq $InputObject) {
        return ""
    }

    return ($InputObject | Out-String).Trim()
}


function Prompt-User {
    param([string]$PromptMessage)

    try {
        if ([Console]::IsInputRedirected) {
            Write-Host -NoNewline "$PromptMessage "
            $inputLine = [Console]::In.ReadLine()
            Write-Host $inputLine
            return $inputLine
        }
    }
    catch {
        # Fall back to Read-Host.
    }

    return (Read-Host $PromptMessage)
}


# =============================================================================
# 1. CHECK PREREQUISITES
# =============================================================================

Write-Step "Step 1: Checking Git installation & repository root..."

try {

    $null = Get-Command git -ErrorAction Stop

    $gitVersionOutput = Get-SafeString (git --version 2>&1)

    if (
        $LASTEXITCODE -ne 0 -or
        [string]::IsNullOrWhiteSpace($gitVersionOutput)
    ) {
        Write-Failure `
            "Git check" `
            "Git command exited with code $LASTEXITCODE."
    }

    Write-Success "Git is installed: $gitVersionOutput"
}
catch {

    Write-Failure `
        "Git check" `
        "Git is not installed or is not available in PATH. Please install Git and try again."
}


# =============================================================================
# VERIFY REPOSITORY ROOT
# =============================================================================

try {

    $repoRootRaw = Get-SafeString (
        git rev-parse --show-toplevel 2>&1
    )

    if (
        $LASTEXITCODE -ne 0 -or
        [string]::IsNullOrWhiteSpace($repoRootRaw)
    ) {
        Write-Failure `
            "Repository check" `
            "Current directory is not inside a Git repository."
    }

    $repoRoot = (
        Resolve-Path $repoRootRaw
    ).Path.TrimEnd('\', '/')

    $currentDir = (
        Resolve-Path (Get-Location).Path
    ).Path.TrimEnd('\', '/')

    if ($repoRoot -ne $currentDir) {

        Write-Failure `
            "Directory check" `
            "The script must be run from the repository root directory.`n`nCurrent Directory : $currentDir`nRepository Root   : $repoRoot`n`nNavigate to the repository root and run:`n.\prepare-testing.ps1"
    }

    Write-Success "Verified repository root: $repoRoot"
}
catch {

    Write-Failure `
        "Repository check" `
        $_.Exception.Message
}


# =============================================================================
# 2. IDENTIFY CURRENT BRANCH
# =============================================================================

Write-Step "Step 2: Detecting current branch..."

$currentBranch = Get-SafeString (
    git rev-parse --abbrev-ref HEAD 2>&1
)

if (
    $LASTEXITCODE -ne 0 -or
    [string]::IsNullOrWhiteSpace($currentBranch) -or
    $currentBranch -eq "HEAD"
) {

    Write-Failure `
        "Branch check" `
        "You are in a detached HEAD state. Please switch to your personal/feature branch before running this script."
}

Write-Success "Active branch: $currentBranch"
Write-Host "You will remain on this branch throughout the process." -ForegroundColor DarkCyan


# =============================================================================
# 3. CHECK WORKING TREE
# =============================================================================

Write-Step "Step 3: Checking working tree status..."

Write-Host "--- Current Git Status ---" -ForegroundColor DarkGray

git status

if ($LASTEXITCODE -ne 0) {

    Write-Failure `
        "Git status inspection" `
        "Failed to retrieve Git status."
}


# -----------------------------------------------------------------------------
# CHECK TRACKED CHANGES
# -----------------------------------------------------------------------------

$dirtyTracked = Get-SafeString (
    git status --porcelain -uno 2>&1
)

if (-not [string]::IsNullOrWhiteSpace($dirtyTracked)) {

    Write-Host "`n[ERROR] Working tree has uncommitted tracked changes!" -ForegroundColor Red

    Write-Host "`nDetected tracked modifications / staged files:" -ForegroundColor Yellow

    Write-Host $dirtyTracked -ForegroundColor Yellow

    Write-Host "`nAction Required:" -ForegroundColor Red

    Write-Host "  1. Commit your changes" -ForegroundColor Yellow
    Write-Host "  2. OR stash your changes" -ForegroundColor Yellow
    Write-Host "  3. OR manually discard your changes" -ForegroundColor Yellow

    Write-Host "`nThe script will NOT reset your branch while tracked changes exist." -ForegroundColor Yellow
    Write-Host "This prevents accidental loss of your local work." -ForegroundColor Yellow

    Write-Failure `
        "Tracked changes check" `
        "Uncommitted tracked changes detected."
}

Write-Success "Working tree is clean of uncommitted tracked changes."


# -----------------------------------------------------------------------------
# CHECK UNTRACKED FILES
# -----------------------------------------------------------------------------

$untrackedFiles = Get-SafeString (
    git status --porcelain -uall 2>&1 |
    Where-Object {
        $_ -match '^\?\?'
    }
)

if (-not [string]::IsNullOrWhiteSpace($untrackedFiles)) {

    Write-Warning "Untracked files detected in your workspace:"

    Write-Host $untrackedFiles -ForegroundColor DarkYellow

    Write-Host "`nIMPORTANT:" -ForegroundColor Yellow

    Write-Host "  These files will NOT be deleted." -ForegroundColor Yellow
    Write-Host "  The script does NOT run 'git clean'." -ForegroundColor Yellow
    Write-Host "  Local files such as .env, configs and uploads are preserved." -ForegroundColor Yellow
}
else {

    Write-Success "No untracked files detected."
}


# =============================================================================
# 4. FETCH ORIGIN/DEV
# =============================================================================

Write-Step "Step 4: Fetching latest 'origin/dev'..."

git fetch origin dev

if ($LASTEXITCODE -ne 0) {

    Write-Failure `
        "Git fetch" `
        "'git fetch origin dev' failed. Verify your network connection, remote configuration and permissions."
}

Write-Success "Successfully fetched 'origin/dev'."


# -----------------------------------------------------------------------------
# VERIFY ORIGIN/DEV EXISTS
# -----------------------------------------------------------------------------

Write-Step "Verifying 'origin/dev' reference..."

$originDevVerify = Get-SafeString (
    git rev-parse --verify origin/dev 2>&1
)

if (
    $LASTEXITCODE -ne 0 -or
    [string]::IsNullOrWhiteSpace($originDevVerify)
) {

    Write-Failure `
        "Verify origin/dev" `
        "'origin/dev' does not exist or could not be verified after fetching."
}

Write-Success "Verified origin/dev at commit: $originDevVerify"


# =============================================================================
# 5. SHOW PRE-RESET INFORMATION
# =============================================================================

Write-Step "Step 5: Comparing current branch with latest origin/dev..."

$localHeadFull = Get-SafeString (
    git rev-parse HEAD 2>&1
)

$localHeadShort = Get-SafeString (
    git rev-parse --short HEAD 2>&1
)

$originDevFull = Get-SafeString (
    git rev-parse origin/dev 2>&1
)

$originDevShort = Get-SafeString (
    git rev-parse --short origin/dev 2>&1
)


Write-Host "`n--------------------------------------------------------------------------------" -ForegroundColor DarkGray

Write-Host "Current branch    : $currentBranch" -ForegroundColor Cyan

Write-Host "Current local HEAD: $localHeadShort ($localHeadFull)" -ForegroundColor Cyan

Write-Host "Latest origin/dev : $originDevShort ($originDevFull)" -ForegroundColor Cyan

Write-Host "--------------------------------------------------------------------------------" -ForegroundColor DarkGray


Write-Host "IMPORTANT:" -ForegroundColor Yellow

Write-Host "  - Your local '$currentBranch' branch will be moved to origin/dev." -ForegroundColor Yellow
Write-Host "  - Your branch name will NOT change." -ForegroundColor Yellow
Write-Host "  - You will remain on '$currentBranch'." -ForegroundColor Yellow
Write-Host "  - No remote branch will be modified." -ForegroundColor Yellow
Write-Host "  - Nothing will be pushed." -ForegroundColor Yellow
Write-Host "  - The local reset may remove commits from your local branch history." -ForegroundColor Yellow
Write-Host "--------------------------------------------------------------------------------`n" -ForegroundColor DarkGray


# =============================================================================
# USER CONFIRMATION
# =============================================================================

$confirm = Prompt-User "Continue with local synchronization? (yes/no)"

if (
    [string]::IsNullOrWhiteSpace($confirm) -or
    $confirm.Trim().ToLower() -notin @("yes", "y")
) {

    Write-Host "`n[ABORTED] Synchronization cancelled by user." -ForegroundColor Yellow

    Write-Host "No local branch changes were made." -ForegroundColor Yellow
    Write-Host "The earlier fetch of origin/dev was completed, but your branch was NOT reset." -ForegroundColor DarkYellow

    exit 0
}


# =============================================================================
# 6. RESET LOCAL BRANCH TO ORIGIN/DEV
# =============================================================================

Write-Step "Step 6: Resetting local branch '$currentBranch' to 'origin/dev'..."

Write-Host "Executing:" -ForegroundColor DarkGray
Write-Host "git reset --hard origin/dev" -ForegroundColor DarkGray

git reset --hard origin/dev

if ($LASTEXITCODE -ne 0) {

    Write-Failure `
        "Reset branch" `
        "'git reset --hard origin/dev' failed. If an untracked file conflicts with a tracked file from origin/dev, inspect and resolve the conflict manually."
}

Write-Success "Local branch '$currentBranch' reset to origin/dev."


# =============================================================================
# 7. VERIFY BRANCH AND COMMIT
# =============================================================================

Write-Step "Step 7: Verifying branch synchronization..."

$postResetBranch = Get-SafeString (
    git rev-parse --abbrev-ref HEAD 2>&1
)

$postResetHead = Get-SafeString (
    git rev-parse HEAD 2>&1
)

$postResetOriginDev = Get-SafeString (
    git rev-parse origin/dev 2>&1
)


# -----------------------------------------------------------------------------
# VERIFY BRANCH DID NOT CHANGE
# -----------------------------------------------------------------------------

if ($postResetBranch -ne $currentBranch) {

    Write-Failure `
        "Branch verification" `
        "Active branch changed unexpectedly!`nExpected: $currentBranch`nCurrent:  $postResetBranch"
}


# -----------------------------------------------------------------------------
# VERIFY LOCAL HEAD == ORIGIN/DEV
# -----------------------------------------------------------------------------

if ($postResetHead -ne $postResetOriginDev) {

    Write-Failure `
        "Commit synchronization verification" `
        "Local HEAD does not match origin/dev.`n`nLocal HEAD : $postResetHead`norigin/dev : $postResetOriginDev"
}


Write-Success "Branch verified: still on '$currentBranch'."

Write-Success "Synchronization verified: Local HEAD matches origin/dev."

Write-Host "Commit: $postResetHead" -ForegroundColor Green


# =============================================================================
# 8. CHECK NODE / NPM
# =============================================================================

Write-Step "Step 8: Checking Node.js and npm..."

try {

    $null = Get-Command npm -ErrorAction Stop
}
catch {

    Write-Failure `
        "npm check" `
        "npm is not installed or is not available in PATH. Please install Node.js and npm."
}


$nodeVersion = Get-SafeString (
    node --version 2>&1
)

$npmVersion = Get-SafeString (
    npm --version 2>&1
)


Write-Success "Node.js: $nodeVersion"

Write-Success "npm: $npmVersion"


# =============================================================================
# 9. DETECT APPLICATIONS AND RUN NPM CI
# =============================================================================

Write-Step "Step 9: Inspecting repository structure and installing dependencies..."

Write-Host "This may take several minutes depending on the project size." -ForegroundColor DarkCyan


# -----------------------------------------------------------------------------
# EXCLUDED DIRECTORIES
# -----------------------------------------------------------------------------

$excludedDirs = @(
    '.git',
    '.github',
    'node_modules',
    '.vscode',
    'dist',
    '.next',
    '.track',
    'uploads'
)


# -----------------------------------------------------------------------------
# DETECT SUB APPLICATIONS
# -----------------------------------------------------------------------------

$subApps = @(
    Get-ChildItem -Path $repoRoot -Directory |
    Where-Object {

        $_.Name -notin $excludedDirs -and

        (Test-Path (
            Join-Path $_.FullName "package.json"
        )) -and

        (Test-Path (
            Join-Path $_.FullName "package-lock.json"
        ))
    }
)


# -----------------------------------------------------------------------------
# CHECK ROOT APPLICATION
# -----------------------------------------------------------------------------

$hasRootPackage =
    (Test-Path (
        Join-Path $repoRoot "package.json"
    )) -and

    (Test-Path (
        Join-Path $repoRoot "package-lock.json"
    ))


# -----------------------------------------------------------------------------
# ROOT + SUB APPLICATIONS
# -----------------------------------------------------------------------------

if ($subApps.Count -gt 0) {

    Write-Host "`nDetected application directories:" -ForegroundColor Cyan

    foreach ($app in $subApps) {

        Write-Host "  - $($app.Name)" -ForegroundColor Cyan
    }


    # -------------------------------------------------------------------------
    # ROOT NPM CI
    # -------------------------------------------------------------------------

    if ($hasRootPackage) {

        Write-Host "`nRunning 'npm ci' in repository root..." -ForegroundColor Cyan

        Push-Location $repoRoot

        try {

            npm ci

            if ($LASTEXITCODE -ne 0) {

                Write-Failure `
                    "Dependency installation (Root)" `
                    "'npm ci' failed in root repository directory."
            }
        }
        finally {

            Pop-Location
        }

        Write-Success "Root dependencies installed."
    }


    # -------------------------------------------------------------------------
    # SUB APPLICATION NPM CI
    # -------------------------------------------------------------------------

    foreach ($app in $subApps) {

        Write-Host "`nRunning 'npm ci' in '$($app.Name)'..." -ForegroundColor Cyan

        Push-Location $app.FullName

        try {

            npm ci

            if ($LASTEXITCODE -ne 0) {

                Write-Failure `
                    "Dependency installation ($($app.Name))" `
                    "'npm ci' failed in '$($app.Name)' directory.`n`nTip: If you see an EPERM/unlink error (e.g. Prisma query_engine-windows.dll.node locked), make sure your running dev servers (npm run start:dev / npm run dev) are stopped before running this script."
            }
        }
        finally {

            Pop-Location
        }

        Write-Success "'$($app.Name)' dependencies installed."
    }
}


# -----------------------------------------------------------------------------
# ROOT ONLY APPLICATION
# -----------------------------------------------------------------------------

elseif ($hasRootPackage) {

    Write-Host "`nDetected root application with package.json and package-lock.json." -ForegroundColor Cyan

    Write-Host "Running 'npm ci' in repository root..." -ForegroundColor Cyan

    Push-Location $repoRoot

    try {

        npm ci

        if ($LASTEXITCODE -ne 0) {

            Write-Failure `
                "Dependency installation (Root)" `
                "'npm ci' failed in root repository directory."
        }
    }
    finally {

        Pop-Location
    }

    Write-Success "Root dependencies installed."
}


# -----------------------------------------------------------------------------
# NO VALID NODE APPLICATION FOUND
# -----------------------------------------------------------------------------

else {

    Write-Failure `
        "Project inspection" `
        "Could not find package.json + package-lock.json in the repository root or immediate application directories."
}


# =============================================================================
# 10. FINAL VERIFICATION
# =============================================================================

Write-Step "Step 10: Performing final verification..."


$finalBranch = Get-SafeString (
    git rev-parse --abbrev-ref HEAD 2>&1
)

$finalHeadFull = Get-SafeString (
    git rev-parse HEAD 2>&1
)

$finalHeadShort = Get-SafeString (
    git rev-parse --short HEAD 2>&1
)

$finalOriginDevFull = Get-SafeString (
    git rev-parse origin/dev 2>&1
)

$finalOriginDevShort = Get-SafeString (
    git rev-parse --short origin/dev 2>&1
)


# -----------------------------------------------------------------------------
# FINAL SYNCHRONIZATION CHECK
# -----------------------------------------------------------------------------

$isSynchronized = (
    $finalHeadFull -eq $finalOriginDevFull -and
    $finalBranch -eq $currentBranch
)


if (-not $isSynchronized) {

    Write-Failure `
        "Final synchronization verification" `
        "The final branch or commit does not match the expected testing state."
}


# -----------------------------------------------------------------------------
# CHECK FINAL GIT STATUS
# -----------------------------------------------------------------------------

$finalStatus = Get-SafeString (
    git status --porcelain 2>&1
)


# =============================================================================
# FINAL REPORT
# =============================================================================

Write-Host "`n================================================================================" -ForegroundColor Green

Write-Host "                         READY FOR TESTING" -ForegroundColor Green

Write-Host "================================================================================" -ForegroundColor Green

Write-Host ""

Write-Host "Branch                : $finalBranch" -ForegroundColor White

Write-Host "Testing Source        : origin/dev" -ForegroundColor White

Write-Host "Local Commit          : $finalHeadShort ($finalHeadFull)" -ForegroundColor White

Write-Host "origin/dev Commit     : $finalOriginDevShort ($finalOriginDevFull)" -ForegroundColor White

Write-Host ""

Write-Host "Branch Synchronized   : YES" -ForegroundColor Green

Write-Host "Remote Push           : NO (local only)" -ForegroundColor Green

Write-Host "Branch Changed        : NO" -ForegroundColor Green

Write-Host ""

Write-Host "Node.js Version       : $nodeVersion" -ForegroundColor White

Write-Host "npm Version           : $npmVersion" -ForegroundColor White

Write-Host "--------------------------------------------------------------------------------" -ForegroundColor DarkGray


# -----------------------------------------------------------------------------
# FINAL STATUS
# -----------------------------------------------------------------------------

Write-Host "Final Git Status:" -ForegroundColor Cyan

git status


# -----------------------------------------------------------------------------
# WARN IF FILES APPEARED AFTER NPM CI
# -----------------------------------------------------------------------------

if (-not [string]::IsNullOrWhiteSpace($finalStatus)) {

    Write-Host "`n--------------------------------------------------------------------------------" -ForegroundColor Yellow

    Write-Warning "Git reports local/untracked changes after dependency installation."

    Write-Host "These files were NOT automatically deleted." -ForegroundColor Yellow

    Write-Host "`nGit status details:" -ForegroundColor DarkYellow

    Write-Host $finalStatus -ForegroundColor DarkYellow

    Write-Host "--------------------------------------------------------------------------------" -ForegroundColor Yellow
}
else {

    Write-Success "Final working tree is clean."
}


Write-Host "`n================================================================================" -ForegroundColor Green

Write-Host "                       TESTING ENVIRONMENT READY" -ForegroundColor Green

Write-Host "================================================================================`n" -ForegroundColor Green
