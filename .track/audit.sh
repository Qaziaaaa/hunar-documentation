#!/bin/bash
# HUNAR AUDIT - Check ownership violations
# Usage: .track/audit.sh           # Since baseline
#        .track/audit.sh 7         # Last 7 days
#        .track/audit.sh reset     # Reset baseline

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
source "$REPO_ROOT/.track/config.sh"

BASELINE_FILE="$REPO_ROOT/.track/baseline"
[ -f "$BASELINE_FILE" ] && BASELINE=$(cat "$BASELINE_FILE") || BASELINE=$(date "+%Y-%m-%d %H:%M:%S")

# Colors
R='\033[0;31m'; G='\033[0;32m'; C='\033[0;36m'; NC='\033[0m'

# Reset
if [ "$1" = "reset" ]; then
    date "+%Y-%m-%d %H:%M:%S" > "$BASELINE_FILE"
    echo -e "${G}Baseline reset to now.${NC}"
    exit 0
fi

VIOLATIONS=0

for PATTERN in "${!OWNERS[@]}"; do
    OWNER="${OWNERS[$PATTERN]}"
    DIR="$REPO_ROOT/$PATTERN"
    [ -d "$DIR" ] || continue

    while IFS= read -r FILE; do
        [ -z "$FILE" ] && continue
        REL="${FILE#$REPO_ROOT/}"

        AUTHOR=$(git -C "$REPO_ROOT" log -1 --format="%an" -- "$REL" 2>/dev/null || echo "unknown")
        TS=$(git -C "$REPO_ROOT" log -1 --format="%aI" -- "$REL" 2>/dev/null || echo "unknown")
        TS_NORM=$(echo "$TS" | sed 's/T/ /;s/+.*//;s/Z//')

        is_leader "$AUTHOR" && continue
        [[ "$TS_NORM" < "$BASELINE" ]] && continue

        GITHUB=$(resolve_github "$AUTHOR")
        if [ "$GITHUB" != "$OWNER" ]; then
            VIOLATIONS=$((VIOLATIONS + 1))
            echo -e "  ${R}$(basename $REL)${NC}  owner:@$OWNER  by:@$GITHUB"
        fi
    done < <(find "$DIR" \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null)
done

if [ $VIOLATIONS -eq 0 ]; then
    echo -e "  ${G}No violations${NC}"
else
    echo -e "  ${R}$VIOLATIONS violation(s)${NC}"
fi
