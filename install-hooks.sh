#!/bin/bash

# ============================================
# HUNAR HOOK INSTALLER
# ============================================
# Run this to install the pre-commit hook.
# Usage: ./install-hooks.sh

set -e

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
HOOKS_DIR="$REPO_ROOT/.git/hooks"
SOURCE_HOOK="$REPO_ROOT/.github/hooks/pre-commit"

echo ""
echo "Installing HUNAR pre-commit hook..."
echo ""

# Check if .git exists
if [ ! -d "$REPO_ROOT/.git" ]; then
    echo "ERROR: Not a git repository. Run this from the project root."
    exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p "$HOOKS_DIR"

# Copy the hook
cp "$SOURCE_HOOK" "$HOOKS_DIR/pre-commit"
chmod +x "$HOOKS_DIR/pre-commit"

echo "Pre-commit hook installed successfully!"
echo ""
echo "The hook will now check for ownership violations on every commit."
echo "To bypass: git commit --no-verify"
echo ""
