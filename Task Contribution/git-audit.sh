#!/bin/bash

# ============================================
# HUNAR CODE OWNERSHIP AUDIT SCRIPT
# ============================================
# Run this script to detect ownership violations.
# It checks who modified files and flags violations.
#
# Usage:
#   ./git-audit.sh                    # Last 7 days
#   ./git-audit.sh 14                 # Last 14 days
#   ./git-audit.sh 30                 # Last 30 days
#   ./git-audit.sh all                # All history

set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DAYS="${1:-7}"
VIOLATIONS=0
TOTAL_CHECKS=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo "============================================"
echo "  HUNAR CODE OWNERSHIP AUDIT"
echo "============================================"
echo ""

# Determine time range
if [ "$DAYS" = "all" ]; then
    SINCE=""
    echo "Time range: ALL HISTORY"
else
    SINCE="--since=${DAYS} days ago"
    echo "Time range: Last $DAYS days"
fi
echo ""

# ============================================
# DEFINE OWNERSHIP RULES
# ============================================
# Format: DIRECTORY_PATTERN=OWNER_USERNAME
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

# Git aliases to GitHub usernames
declare -A GIT_TO_GITHUB
GIT_TO_GITHUB["hashim"]="hashim-malik"
GIT_TO_GITHUB["shafqat"]="shafqatullah"

# ============================================
# SCAN EACH MEMBER'S BRANCH
# ============================================
MEMBER_BRANCHES=("feat/abdullah" "feat/faizan" "feat/hakim" "feat/hashim-malik" "feat/shafqatullah" "feat/shahzad")

for BRANCH in "${MEMBER_BRANCHES[@]}"; do
    MEMBER=$(echo "$BRANCH" | sed 's/feat\///')
    echo -e "${CYAN}--- Checking branch: $BRANCH (member: $MEMBER) ---${NC}"
    
    # Get commits on this branch not in dev
    COMMITS=$(git log origin/dev..HEAD --author="$MEMBER" --oneline $SINCE 2>/dev/null || \
              git log origin/dev..HEAD --oneline $SINCE 2>/dev/null | head -50)
    
    if [ -z "$COMMITS" ]; then
        echo "  No commits found."
        echo ""
        continue
    fi
    
    # Get files changed by this member on this branch
    FILES_CHANGED=$(git diff origin/dev...HEAD --name-only 2>/dev/null || echo "")
    
    if [ -z "$FILES_CHANGED" ]; then
        echo "  No file changes detected."
        echo ""
        continue
    fi
    
    # Check each file for ownership violations
    while IFS= read -r FILE; do
        [ -z "$FILE" ] && continue
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
        
        # Find who owns this file
        OWNER=""
        for PATTERN in "${!OWNERS[@]}"; do
            if [[ "$FILE" == "$PATTERN"* ]]; then
                OWNER="${OWNERS[$PATTERN]}"
                break
            fi
        done
        
        # Skip shared/infrastructure files
        if [ -z "$OWNER" ]; then
            continue
        fi
        
        # Get the author of the last commit on this file
        LAST_AUTHOR=$(git log -1 --format="%an" -- "$FILE" 2>/dev/null || echo "unknown")
        
        # Check git aliases
        GITHUB_NAME="${GIT_TO_GITHUB[$LAST_AUTHOR]:-$LAST_AUTHOR}"
        
        # Compare
        if [ "$GITHUB_NAME" != "$OWNER" ] && [ "$LAST_AUTHOR" != "$OWNER" ]; then
            VIOLATIONS=$((VIOLATIONS + 1))
            COMMIT_DATE=$(git log -1 --format="%ad" --date=short -- "$FILE" 2>/dev/null || echo "unknown")
            COMMIT_MSG=$(git log -1 --format="%s" -- "$FILE" 2>/dev/null || echo "unknown")
            echo -e "  ${RED}VIOLATION: $FILE${NC}"
            echo "    Owner: @$OWNER"
            echo "    Last modified by: @$GITHUB_NAME ($COMMIT_DATE)"
            echo "    Commit: $COMMIT_MSG"
            echo ""
        fi
    done <<< "$FILES_CHANGED"
    
    echo ""
done

# ============================================
# BLAME AUDIT - Check current files
# ============================================
echo ""
echo "============================================"
echo "  CURRENT FILE OWNERSHIP (Git Blame)"
echo "============================================"
echo ""

echo "Checking who last modified each file in assigned areas..."
echo ""

BLAME_VIOLATIONS=0

for PATTERN in "${!OWNERS[@]}"; do
    OWNER="${OWNERS[$PATTERN]}"
    
    # Find files matching this pattern
    SEARCH_DIR="$REPO_ROOT/$PATTERN"
    if [ -d "$SEARCH_DIR" ]; then
        while IFS= read -r FILE; do
            [ -z "$FILE" ] && continue
            REL_PATH="${FILE#$REPO_ROOT/}"
            
            # Get the author who last touched this file
            LAST_AUTHOR=$(git -C "$REPO_ROOT" log -1 --format="%an" -- "$REL_PATH" 2>/dev/null || echo "unknown")
            GITHUB_NAME="${GIT_TO_GITHUB[$LAST_AUTHOR]:-$LAST_AUTHOR}"
            
            if [ "$GITHUB_NAME" != "$OWNER" ] && [ "$LAST_AUTHOR" != "$OWNER" ]; then
                BLAME_VIOLATIONS=$((BLAME_VIOLATIONS + 1))
                echo -e "  ${RED}WRONG OWNER: $REL_PATH${NC}"
                echo "    Expected: @$OWNER"
                echo "    Last author: @$GITHUB_NAME"
                echo ""
            fi
        done < <(find "$SEARCH_DIR" \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) 2>/dev/null | head -20)
    fi
done

# ============================================
# SUMMARY
# ============================================
echo ""
echo "============================================"
echo "  AUDIT SUMMARY"
echo "============================================"
echo ""
echo "Total files checked: $TOTAL_CHECKS"
echo -e "Branch violations: ${RED}$VIOLATIONS${NC}"
echo -e "Blame violations:  ${RED}$BLAME_VIOLATIONS${NC}"
echo ""

TOTAL_VIOLATIONS=$((VIOLATIONS + BLAME_VIOLATIONS))

if [ $TOTAL_VIOLATIONS -eq 0 ]; then
    echo -e "${GREEN}ALL CLEAR - No ownership violations detected.${NC}"
else
    echo -e "${RED}WARNING: $TOTAL_VIOLATIONS ownership violation(s) detected!${NC}"
    echo ""
    echo "Review the violations above. Members may have worked on code"
    echo "that was assigned to someone else."
fi
echo ""
echo "============================================"
