#!/bin/bash

# HUNAR PROJECT TRACKER AUTO-UPDATER
# Run this script to update MASTER_PROJECT_TRACKER.md with current progress
# Usage: bash update-tracker.sh              # Show progress only
#        bash update-tracker.sh --apply      # Update tracker file
#        bash update-tracker.sh --audit      # Run full ownership audit
#        bash update-tracker.sh --all        # Update tracker + run audit

set -e

TRACKER_FILE="MASTER_PROJECT_TRACKER.md"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/hunar-frontend/src"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo "🔄 Updating HUNAR Project Tracker..."
echo ""

# ============================================================
# FUNCTION: Count completed tasks per dev based on file existence
# ============================================================

count_shahzad_tasks() {
    local done=0
    local total=38

    # M1: Auth (done)
    [[ -f "$FRONTEND_DIR/features/auth/components/worker-signup-flow.tsx" ]] && ((done++))
    [[ -f "$FRONTEND_DIR/features/auth/components/sign-in-form.tsx" ]] && ((done++))
    [[ -f "$FRONTEND_DIR/features/worker-onboarding/components/wizard-shell.tsx" ]] && ((done++))
    [[ -f "$FRONTEND_DIR/features/worker-onboarding/components/step1-personal-details.tsx" ]] && ((done++))
    [[ -f "$FRONTEND_DIR/features/worker-onboarding/components/step2-skills.tsx" ]] && ((done++))
    [[ -f "$FRONTEND_DIR/features/worker-onboarding/components/step3-experience.tsx" ]] && ((done++))
    [[ -f "$FRONTEND_DIR/features/worker-onboarding/components/step4-service-areas.tsx" ]] && ((done++))
    [[ -f "$FRONTEND_DIR/features/worker-onboarding/components/step5-documents.tsx" ]] && ((done++))
    [[ -f "$FRONTEND_DIR/features/worker-onboarding/components/step6-review.tsx" ]] && ((done++))
    [[ -f "$FRONTEND_DIR/features/worker-verification/components/verification-shell.tsx" ]] && ((done++))
    [[ -f "$FRONTEND_DIR/features/worker-dashboard/components/worker-dashboard-shell.tsx" ]] && ((done++))
    [[ -f "$FRONTEND_DIR/features/worker-dashboard/components/dashboard-header.tsx" ]] && ((done++))

    # M2: Jobs (check for new files)
    [[ -f "$FRONTEND_DIR/features/worker-dashboard/components/job-feed.tsx" ]] && ((done++))
    [[ -f "$FRONTEND_DIR/features/worker-dashboard/components/job-card.tsx" ]] && ((done++))
    [[ -f "$FRONTEND_DIR/features/worker-dashboard/components/job-filters.tsx" ]] && ((done++))

    echo "$done $total"
}

count_faizan_tasks() {
    local done=0
    local total=39

    # M1: Auth shared (done)
    [[ -f "$FRONTEND_DIR/features/auth/components/otp-input.tsx" ]] && ((done++))
    [[ -f "$FRONTEND_DIR/features/auth/components/phone-step.tsx" ]] && ((done++))
    [[ -f "$FRONTEND_DIR/features/auth/components/password-step.tsx" ]] && ((done++))
    [[ -f "$FRONTEND_DIR/features/auth/components/auth-shell.tsx" ]] && ((done++))
    [[ -f "$FRONTEND_DIR/features/auth/components/auth-brand.tsx" ]] && ((done++))
    [[ -f "$FRONTEND_DIR/features/auth/components/auth-top-bar.tsx" ]] && ((done++))
    [[ -f "$FRONTEND_DIR/features/auth/components/auth-trust-footer.tsx" ]] && ((done++))
    [[ -f "$FRONTEND_DIR/features/auth/api/auth-api.ts" ]] && ((done++))

    # M2: Admin (check for new files)
    [[ -f "$FRONTEND_DIR/features/admin/admin-dashboard-shell.tsx" ]] && ((done++))
    [[ -f "$FRONTEND_DIR/features/admin/components/kpi-cards.tsx" ]] && ((done++))

    echo "$done $total"
}

count_abdullah_tasks() {
    local done=0
    local total=30

    # M1: Customer auth
    [[ -f "$FRONTEND_DIR/app/[locale]/(auth)/customer/sign-up/page.tsx" ]] && ((done++))
    [[ -f "$FRONTEND_DIR/app/[locale]/(auth)/customer/sign-in/page.tsx" ]] && ((done++))
    [[ -f "$FRONTEND_DIR/app/[locale]/(customer)/customer/dashboard/page.tsx" ]] && ((done++))

    # M2: Customer flow
    [[ -f "$FRONTEND_DIR/app/[locale]/(customer)/customer/post-job/page.tsx" ]] && ((done++))
    [[ -f "$FRONTEND_DIR/features/customer/components/job-detail.tsx" ]] && ((done++))
    [[ -f "$FRONTEND_DIR/features/customer/components/worker-profile-modal.tsx" ]] && ((done++))

    echo "$done $total"
}

# ============================================================
# FUNCTION: Count git commits per dev
# ============================================================

count_commits() {
    local author="$1"
    cd "$PROJECT_ROOT"
    git log --all --author="$author" --oneline 2>/dev/null | wc -l
}

# ============================================================
# Get counts
# ============================================================

read -r shahzad_done shahzad_total <<< $(count_shahzad_tasks)
read -r faizan_done faizan_total <<< $(count_faizan_tasks)
read -r abdullah_done abdullah_total <<< $(count_abdullah_tasks)

# Calculate percentages
shahzad_pct=$((shahzad_done * 100 / shahzad_total))
faizan_pct=$((faizan_done * 100 / faizan_total))
abdullah_pct=$((abdullah_done * 100 / abdullah_total))

# Overall frontend progress
total_done=$((shahzad_done + faizan_done + abdullah_done))
total_all=$((shahzad_total + faizan_total + abdullah_total))
overall_pct=$((total_done * 100 / total_all))

# ============================================================
# Generate progress bars
# ============================================================

progress_bar() {
    local pct=$1
    local filled=$((pct / 5))
    local empty=$((20 - filled))
    local bar=""
    for ((i=0; i<filled; i++)); do bar+="█"; done
    for ((i=0; i<empty; i++)); do bar+="░"; done
    echo "$bar $pct%"
}

shahzad_bar=$(progress_bar $shahzad_pct)
faizan_bar=$(progress_bar $faizan_pct)
abdullah_bar=$(progress_bar $abdullah_pct)
overall_bar=$(progress_bar $overall_pct)

# ============================================================
# Count git commits
# ============================================================

shahzad_commits=$(count_commits "Shahzad")
faizan_commits=$(count_commits "Faizan")
abdullah_commits=$(count_commits "Abdullah")
hakim_commits=$(count_commits "Hakim")
shafqat_commits=$(count_commits "Shafqat")
hashim_commits=$(count_commits "Hashim")

# ============================================================
# Get current date
# ============================================================

current_date=$(date "+%Y-%m-%d %H:%M")

# ============================================================
# Print summary
# ============================================================

echo "📊 PROGRESS SUMMARY"
echo "===================="
echo ""
echo "Overall:      $overall_bar"
echo "Shahzad:      $shahzad_bar ($shahzad_done/$shahzad_total tasks)"
echo "Faizan:       $faizan_bar ($faizan_done/$faizan_total tasks)"
echo "Abdullah:     $abdullah_bar ($abdullah_done/$abdullah_total tasks)"
echo ""
echo "📝 GIT COMMITS"
echo "===================="
echo "Shahzad:  $shahzad_commits commits"
echo "Faizan:   $faizan_commits commits"
echo "Abdullah: $abdullah_commits commits"
echo "Hakim:    $hakim_commits commits"
echo "Shafqat:  $shafqat_commits commits"
echo "Hashim:   $hashim_commits commits"
echo ""
echo "Last updated: $current_date"
echo ""
echo "✅ To update the tracker file, run:"
echo "   bash update-tracker.sh --apply"
echo ""

# ============================================================
# Apply changes if --apply flag is passed
# ============================================================

if [[ "$1" == "--apply" ]]; then
    echo "📝 Applying changes to $TRACKER_FILE..."

    # Update the overall progress bar
    sed -i "s|TOTAL PROGRESS: .*|TOTAL PROGRESS: $overall_bar|" "$TRACKER_FILE"

    # Update per-dev progress
    sed -i "/### Shahzad/,/^---/{
        s|PROGRESS: .*|PROGRESS: $shahzad_bar|
        s|\*\*TOTAL\*\* |**TOTAL** |
        s|\*\*[0-9]*\*\* \*\*[0-9]*\*\*|**$shahzad_total** **$shahzad_done**|
    }" "$TRACKER_FILE"

    sed -i "/### Faizan/,/^---/{
        s|PROGRESS: .*|PROGRESS: $faizan_bar|
        s|\*\*TOTAL\*\* |**TOTAL** |
        s|\*\*[0-9]*\*\* \*\*[0-9]*\*\*|**$faizan_total** **$faizan_done**|
    }" "$TRACKER_FILE"

    sed -i "/### Abdullah/,/^---/{
        s|PROGRESS: .*|PROGRESS: $abdullah_bar|
        s|\*\*TOTAL\*\* |**TOTAL** |
        s|\*\*[0-9]*\*\* \*\*[0-9]*\*\*|**$abdullah_total** **$abdullah_done**|
    }" "$TRACKER_FILE"

    # Add to standup log
    standup_entry="| $current_date | Auto-update | Progress: Overall $overall_pct%, Shahzad $shahzad_pct%, Faizan $faizan_pct%, Abdullah $abdullah_pct% | — |"
    sed -i "/| — | — | — | |/a\\
$standup_entry" "$TRACKER_FILE"

    echo "✅ Tracker updated successfully!"
    echo ""
    echo "📊 Current Progress:"
    echo "   Overall: $overall_bar"
    echo "   Shahzad: $shahzad_bar"
    echo "   Faizan:  $faizan_bar"
    echo "   Abdullah: $abdullah_bar"
else
    echo "💡 Run with --apply to update the tracker file:"
    echo "   bash update-tracker.sh --apply"
fi

# ============================================================
# OWNERSHIP AUDIT (runs with --audit or --all flag)
# ============================================================

if [[ "$1" == "--audit" ]] || [[ "$1" == "--all" ]]; then
    echo ""
    echo "============================================"
    echo "  CODE OWNERSHIP AUDIT"
    echo "============================================"
    echo ""
    
    # Ownership rules
    declare -A OWNERS
    OWNERS["hunar-frontend/src/features/auth/"]="faizan"
    OWNERS["hunar-frontend/src/features/admin/"]="faizan"
    OWNERS["hunar-frontend/src/features/worker-onboarding/"]="shahzad"
    OWNERS["hunar-frontend/src/features/worker-verification/"]="shahzad"
    OWNERS["hunar-frontend/src/features/worker-dashboard/"]="shahzad"
    OWNERS["hunar-frontend/src/features/jobs/"]="abdullah"
    OWNERS["hunar-frontend/src/features/negotiation/"]="abdullah"
    OWNERS["hunar-frontend/src/features/chat/"]="abdullah"
    OWNERS["hunar-frontend/src/features/payments/"]="abdullah"
    OWNERS["hunar-frontend/src/features/tracking/"]="abdullah"
    OWNERS["hunar-backend/src/modules/auth/"]="hashim-malik"
    OWNERS["hunar-backend/src/modules/admin/"]="hashim-malik"
    OWNERS["hunar-backend/src/modules/users/"]="hashim-malik"
    OWNERS["hunar-backend/src/modules/notifications/"]="hashim-malik"
    OWNERS["hunar-backend/src/modules/jobs/"]="hakim"
    OWNERS["hunar-backend/src/modules/offers/"]="hakim"
    OWNERS["hunar-backend/src/modules/visits/"]="hakim"
    OWNERS["hunar-backend/src/modules/repair/"]="hakim"
    OWNERS["hunar-backend/src/modules/commissions/"]="hakim"
    OWNERS["hunar-backend/src/modules/chat/"]="hakim"
    OWNERS["hunar-backend/src/modules/uploads/"]="hakim"
    OWNERS["hunar-backend/src/modules/reviews/"]="hakim"
    OWNERS["hunar-backend/src/modules/payments/"]="shafqatullah"
    OWNERS["hunar-backend/src/modules/location/"]="shafqatullah"
    OWNERS["hunar-backend/src/modules/search/"]="shafqatullah"
    
    # Git aliases
    declare -A GIT_TO_GITHUB
    GIT_TO_GITHUB["hashim"]="hashim-malik"
    GIT_TO_GITHUB["shafqat"]="shafqatullah"
    
    VIOLATIONS=0
    TOTAL_FILES=0
    
    echo "Checking who last modified each file..."
    echo ""
    
    for PATTERN in "${!OWNERS[@]}"; do
        OWNER="${OWNERS[$PATTERN]}"
        
        SEARCH_DIR="$PROJECT_ROOT/$PATTERN"
        if [ -d "$SEARCH_DIR" ]; then
            while IFS= read -r FILE; do
                [ -z "$FILE" ] && continue
                REL_PATH="${FILE#$PROJECT_ROOT/}"
                TOTAL_FILES=$((TOTAL_FILES + 1))
                
                LAST_AUTHOR=$(git -C "$PROJECT_ROOT" log -1 --format="%an" -- "$REL_PATH" 2>/dev/null || echo "unknown")
                GITHUB_NAME="${GIT_TO_GITHUB[$LAST_AUTHOR]:-$LAST_AUTHOR}"
                
                if [ "$GITHUB_NAME" != "$OWNER" ] && [ "$LAST_AUTHOR" != "$OWNER" ]; then
                    VIOLATIONS=$((VIOLATIONS + 1))
                    COMMIT_DATE=$(git -C "$PROJECT_ROOT" log -1 --format="%ad" --date=short -- "$REL_PATH" 2>/dev/null || echo "unknown")
                    echo -e "  ${RED}WRONG OWNER: $REL_PATH${NC}"
                    echo "    Expected: @$OWNER"
                    echo "    Last author: @$GITHUB_NAME ($COMMIT_DATE)"
                    echo ""
                fi
            done < <(find "$SEARCH_DIR" \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) 2>/dev/null | head -30)
        fi
    done
    
    echo "============================================"
    echo "  AUDIT SUMMARY"
    echo "============================================"
    echo ""
    echo "Total files checked: $TOTAL_FILES"
    echo -e "Ownership violations: ${RED}$VIOLATIONS${NC}"
    echo ""
    
    if [ $VIOLATIONS -eq 0 ]; then
        echo -e "${GREEN}ALL CLEAR - No ownership violations detected.${NC}"
    else
        echo -e "${RED}WARNING: $VIOLATIONS file(s) modified by wrong owner!${NC}"
        echo "Review the violations above."
    fi
    echo ""
fi
