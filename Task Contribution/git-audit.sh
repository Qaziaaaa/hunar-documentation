#!/bin/bash

# ============================================
# HUNAR CODE OWNERSHIP AUDIT SCRIPT
# ============================================
# Tracks who modified files and flags violations.
# LEADER is EXCLUDED from tracking.
# Only tracks violations AFTER baseline date.
#
# Usage:
#   ./git-audit.sh              # Since baseline (default)
#   ./git-audit.sh 7            # Last 7 days
#   ./git-audit.sh 30           # Last 30 days
#   ./git-audit.sh reset        # Reset baseline to now

set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BASELINE_FILE="$REPO_ROOT/Task Contribution/.audit-baseline"
DAYS="${1:-7}"
VIOLATIONS=0
TOTAL_CHECKS=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# ============================================
# LEADER - Excluded from all tracking
# These names/emails are NEVER flagged
# ============================================
LEADER_NAMES=("Qaziaaaa" "qaziaaaa" "Muhammad Farhan Ahmad" "farhan" "admin")
LEADER_EMAILS=("qaziaaaa@users.noreply.github.com")

is_leader() {
    local author="$1"
    local email="$2"
    
    for name in "${LEADER_NAMES[@]}"; do
        if [[ "$author" == *"$name"* ]]; then
            return 0
        fi
    done
    
    for mail in "${LEADER_EMAILS[@]}"; do
        if [[ "$email" == *"$mail"* ]]; then
            return 0
        fi
    done
    
    return 1
}

# ============================================
# RESET BASELINE
# ============================================
if [ "$DAYS" = "reset" ]; then
    date "+%Y-%m-%d %H:%M:%S" > "$BASELINE_FILE"
    echo "Baseline reset to: $(cat "$BASELINE_FILE")"
    echo "Only violations from now will be tracked."
    exit 0
fi

# ============================================
# READ OR SET BASELINE
# ============================================
if [ -f "$BASELINE_FILE" ]; then
    BASELINE_DATE=$(cat "$BASELINE_FILE")
    BASELINE_SHORT=$(echo "$BASELINE_DATE" | cut -d' ' -f1)
    echo ""
    echo "============================================"
    echo "  HUNAR CODE OWNERSHIP AUDIT"
    echo "============================================"
    echo ""
    echo "Tracking since: $BASELINE_DATE (baseline)"
    echo "Leader commits are excluded."
    echo ""
else
    date "+%Y-%m-%d %H:%M:%S" > "$BASELINE_FILE"
    BASELINE_DATE=$(cat "$BASELINE_FILE")
    BASELINE_SHORT=$(echo "$BASELINE_DATE" | cut -d' ' -f1)
    echo ""
    echo "============================================"
    echo "  HUNAR CODE OWNERSHIP AUDIT"
    echo "============================================"
    echo ""
    echo "First run - baseline set to: $BASELINE_DATE"
    echo "Leader commits are excluded."
    echo ""
fi

# ============================================
# TIME RANGE
# ============================================
if [ "$DAYS" = "all" ]; then
    SINCE=""
    echo "Time range: ALL HISTORY (but only violations after baseline)"
elif [ "$DAYS" = "baseline" ]; then
    SINCE="--since=$BASELINE_DATE"
    echo "Time range: Since baseline ($BASELINE_DATE)"
else
    SINCE="--since=${DAYS} days ago"
    echo "Time range: Last $DAYS days"
fi
echo ""

# ============================================
# OWNERSHIP RULES
# ============================================
declare -A OWNERS

# Frontend
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

# Backend
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
GIT_TO_GITHUB["Shehzad1961"]="shahzad"
GIT_TO_GITHUB["Muhammad Abdullah"]="abdullah"

# ============================================
# BLAME AUDIT - Check current files
# ============================================
echo "============================================"
echo "  FILE OWNERSHIP CHECK (Git Blame)"
echo "============================================"
echo ""

BLAME_VIOLATIONS=0

for PATTERN in "${!OWNERS[@]}"; do
    OWNER="${OWNERS[$PATTERN]}"
    
        SEARCH_DIR="$REPO_ROOT/$PATTERN"
    if [ -d "$SEARCH_DIR" ]; then
        while IFS= read -r FILE; do
            [ -z "$FILE" ] && continue
            REL_PATH="${FILE#$REPO_ROOT/}"
            
            # Get author info with full timestamp
            LAST_AUTHOR=$(git -C "$REPO_ROOT" log -1 --format="%an" -- "$REL_PATH" 2>/dev/null || echo "unknown")
            LAST_EMAIL=$(git -C "$REPO_ROOT" log -1 --format="%ae" -- "$REL_PATH" 2>/dev/null || echo "unknown")
            COMMIT_TIMESTAMP=$(git -C "$REPO_ROOT" log -1 --format="%aI" -- "$REL_PATH" 2>/dev/null || echo "unknown")
            COMMIT_DATE=$(echo "$COMMIT_TIMESTAMP" | cut -d'T' -f1)
            # Normalize for comparison
            TS_NORM=$(echo "$COMMIT_TIMESTAMP" | sed 's/T/ /;s/+.*//;s/Z//')
            
            # Skip if leader
            is_leader "$LAST_AUTHOR" "$LAST_EMAIL" && continue
            
            # Skip if before baseline (compare timestamps)
            if [[ "$TS_NORM" < "$BASELINE_DATE" ]]; then
                continue
            fi
            
            # Skip if before baseline
            if [[ "$COMMIT_DATE" < "$BASELINE_DATE" ]]; then
                continue
            fi
            
            GITHUB_NAME="${GIT_TO_GITHUB[$LAST_AUTHOR]:-$LAST_AUTHOR}"
            
            if [ "$GITHUB_NAME" != "$OWNER" ] && [ "$LAST_AUTHOR" != "$OWNER" ]; then
                BLAME_VIOLATIONS=$((BLAME_VIOLATIONS + 1))
                echo -e "  ${RED}WRONG OWNER: $REL_PATH${NC}"
                echo "    Expected: @$OWNER"
                echo "    Last author: @$GITHUB_NAME ($COMMIT_DATE)"
                echo ""
            fi
        done < <(find "$SEARCH_DIR" \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) 2>/dev/null)
    fi
done

# ============================================
# COMMIT AUDIT - Check recent commits
# ============================================
echo ""
echo "============================================"
echo "  RECENT COMMIT AUDIT"
echo "============================================"
echo ""

COMMIT_VIOLATIONS=0
MEMBER_BRANCHES=("feat/abdullah" "feat/faizan" "feat/hakim" "feat/hashim-malik" "feat/shafqatullah" "feat/shahzad")

for BRANCH in "${MEMBER_BRANCHES[@]}"; do
    MEMBER=$(echo "$BRANCH" | sed 's/feat\///')
    
    # Get commits after baseline
    COMMITS=""
    if [ -n "$SINCE" ]; then
        COMMITS=$(git -C "$REPO_ROOT" log "origin/dev..$BRANCH" --oneline $SINCE --author="$MEMBER" 2>/dev/null || echo "")
    else
        COMMITS=$(git -C "$REPO_ROOT" log "origin/dev..$BRANCH" --oneline --author="$MEMBER" 2>/dev/null || echo "")
    fi
    
    if [ -z "$COMMITS" ]; then
        continue
    fi
    
    echo -e "${CYAN}--- Branch: $BRANCH ---${NC}"
    
    # Get files changed
    FILES_CHANGED=$(git -C "$REPO_ROOT" diff "origin/dev...$BRANCH" --name-only 2>/dev/null || echo "")
    
    while IFS= read -r FILE; do
        [ -z "$FILE" ] && continue
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
        
        OWNER=""
        for PATTERN in "${!OWNERS[@]}"; do
            if [[ "$FILE" == "$PATTERN"* ]]; then
                OWNER="${OWNERS[$PATTERN]}"
                break
            fi
        done
        
        [ -z "$OWNER" ] && continue
        
        LAST_AUTHOR=$(git -C "$REPO_ROOT" log -1 --format="%an" -- "$FILE" 2>/dev/null || echo "unknown")
        LAST_EMAIL=$(git -C "$REPO_ROOT" log -1 --format="%ae" -- "$FILE" 2>/dev/null || echo "unknown")
        COMMIT_DATE=$(git -C "$REPO_ROOT" log -1 --format="%ad" --date=short -- "$FILE" 2>/dev/null || echo "unknown")
        
        # Skip leader
        is_leader "$LAST_AUTHOR" "$LAST_EMAIL" && continue
        
        # Skip before baseline
        [[ "$COMMIT_DATE" < "$BASELINE_DATE" ]] && continue
        
        GITHUB_NAME="${GIT_TO_GITHUB[$LAST_AUTHOR]:-$LAST_AUTHOR}"
        
        if [ "$GITHUB_NAME" != "$OWNER" ] && [ "$LAST_AUTHOR" != "$OWNER" ]; then
            COMMIT_VIOLATIONS=$((COMMIT_VIOLATIONS + 1))
            echo -e "  ${RED}VIOLATION: $FILE${NC}"
            echo "    Owner: @$OWNER | Modified by: @$GITHUB_NAME ($COMMIT_DATE)"
            echo ""
        fi
    done <<< "$FILES_CHANGED"
done

# ============================================
# SUMMARY
# ============================================
echo ""
echo "============================================"
echo "  AUDIT SUMMARY"
echo "============================================"
echo ""
echo "Baseline: $BASELINE_DATE"
echo -e "Blame violations: ${RED}$BLAME_VIOLATIONS${NC}"
echo -e "Commit violations: ${RED}$COMMIT_VIOLATIONS${NC}"
echo ""

TOTAL_VIOLATIONS=$((BLAME_VIOLATIONS + COMMIT_VIOLATIONS))

if [ $TOTAL_VIOLATIONS -eq 0 ]; then
    echo -e "${GREEN}ALL CLEAR - No ownership violations since $BASELINE_DATE.${NC}"
else
    echo -e "${RED}WARNING: $TOTAL_VIOLATIONS violation(s) detected since $BASELINE_DATE!${NC}"
    echo ""
    echo "Members worked on code assigned to someone else."
    echo "Run: grep 'WRONG OWNER' this-file to list all violations."
fi
echo ""
echo "============================================"
