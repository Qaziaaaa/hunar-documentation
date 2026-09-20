#!/bin/bash
# ============================================
# HUNAR TRACKER - CONFIGURATION
# ============================================
# All ownership rules in one place.
# Edit this file when team changes.

# Leader (excluded from all tracking)
LEADER_GIT_NAMES=("Qaziaaaa" "qaziaaaa" "Muhammad Farhan Ahmad" "farhan" "admin")
LEADER_EMAILS=("qaziaaaa@users.noreply.github.com")

# Git username -> GitHub username mapping
declare -A GIT_MAP
GIT_MAP["hashim"]="hashim-malik"
GIT_MAP["shafqat"]="shafqatullah"
GIT_MAP["Shehzad1961"]="shahzad"
GIT_MAP["Muhammad Abdullah"]="abdullah"
GIT_MAP["Hakim Ullah"]="hakim"
GIT_MAP["Shafqat Ullah"]="shafqatullah"

# Ownership rules: DIRECTORY=OWNER
declare -A OWNERS

# Frontend - Faizan
OWNERS["hunar-frontend/src/features/auth/"]="faizan"
OWNERS["hunar-frontend/src/features/admin/"]="faizan"

# Frontend - Shahzad
OWNERS["hunar-frontend/src/features/worker-onboarding/"]="shahzad"
OWNERS["hunar-frontend/src/features/worker-verification/"]="shahzad"
OWNERS["hunar-frontend/src/features/worker-dashboard/"]="shahzad"

# Frontend - Abdullah
OWNERS["hunar-frontend/src/features/jobs/"]="abdullah"
OWNERS["hunar-frontend/src/features/negotiation/"]="abdullah"
OWNERS["hunar-frontend/src/features/chat/"]="abdullah"
OWNERS["hunar-frontend/src/features/payments/"]="abdullah"
OWNERS["hunar-frontend/src/features/tracking/"]="abdullah"

# Backend - Hashim
OWNERS["hunar-backend/src/modules/auth/"]="hashim-malik"
OWNERS["hunar-backend/src/modules/admin/"]="hashim-malik"
OWNERS["hunar-backend/src/modules/users/"]="hashim-malik"
OWNERS["hunar-backend/src/modules/notifications/"]="hashim-malik"

# Backend - Hakim
OWNERS["hunar-backend/src/modules/jobs/"]="hakim"
OWNERS["hunar-backend/src/modules/offers/"]="hakim"
OWNERS["hunar-backend/src/modules/visits/"]="hakim"
OWNERS["hunar-backend/src/modules/repair/"]="hakim"
OWNERS["hunar-backend/src/modules/commissions/"]="hakim"
OWNERS["hunar-backend/src/modules/chat/"]="hakim"
OWNERS["hunar-backend/src/modules/uploads/"]="hakim"
OWNERS["hunar-backend/src/modules/reviews/"]="hakim"

# Backend - Shafqat
OWNERS["hunar-backend/src/modules/payments/"]="shafqatullah"
OWNERS["hunar-backend/src/modules/location/"]="shafqatullah"
OWNERS["hunar-backend/src/modules/search/"]="shafqatullah"

# Helper: check if author is leader
is_leader() {
    local author="$1"
    for name in "${LEADER_GIT_NAMES[@]}"; do
        [[ "$author" == *"$name"* ]] && return 0
    done
    return 1
}

# Helper: resolve git name to github username
resolve_github() {
    local git_name="$1"
    echo "${GIT_MAP[$git_name]:-$git_name}"
}
