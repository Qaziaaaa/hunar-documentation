# 🚀 Team Testing Guide: Environment Synchronization

This guide explains how developers and QA team members synchronize their local environments with the official `origin/dev` testing build using [`prepare-testing.ps1`](./prepare-testing.ps1).

---

## 🎯 Purpose

Every developer remains on their own personal/feature branch (e.g. `feat/your-name`), but their **LOCAL branch is synchronized to match the exact latest `origin/dev` commit** before testing.

- ✅ **No branch switching**: You stay on your own branch (`Branch Changed: NO`).
- ✅ **No remote pushing**: Nothing is pushed to GitHub (`Remote Push: NO`).
- ✅ **No accidental data loss**: Untracked files (`.env`, local configs, uploads) are **never deleted**.
- ✅ **No version drift**: Clean `npm ci` installs 100% reproducible dependencies for the backend, frontend, and root workspace.

---

## ⏱️ Prerequisites Before Running

1. **Commit or stash your changes**:
   The script checks for uncommitted tracked changes. If dirty, it stops immediately to protect your work.
2. **Stop active development servers**:
   Press `Ctrl + C` in all terminals running:
   - `npm run start:dev` (Backend)
   - `npm run dev` (Frontend)
   *(On Windows, running servers lock binary files like Prisma's query engine DLL, which will block `npm ci`).*

---

## 🛠️ Step-by-Step Instructions

### Step 1: Open PowerShell in Repository Root
Open **Windows PowerShell** in the root project folder (`Hunar/`).

### Step 2: Execute the Script
Run:

```powershell
.\prepare-testing.ps1
```

> **Note**: If your PowerShell execution policy blocks script execution, run:
> ```powershell
> powershell -ExecutionPolicy Bypass -File .\prepare-testing.ps1
> ```

### Step 3: Review and Confirm
The script will display your current branch, local commit, and latest `origin/dev` commit. When prompted:

```text
Continue with local synchronization? (yes/no): y
```

Type **`y`** (or **`yes`**) and press **Enter**.

---

## 🔍 What Happens Automatically

1. **Prerequisite & Root Validation**: Confirms Git is installed and you are in the repo root.
2. **Safety Check**: Confirms working tree has no uncommitted tracked changes.
3. **Fetch & Verify**: Fetches `origin/dev` and verifies its SHA.
4. **Local Reset**: Runs `git reset --hard origin/dev` on your active branch.
5. **Dependency Installation**: Runs `npm ci` in `hunar-backend`, `hunar-frontend`, and root.
6. **Final Report**: Verifies that `HEAD == origin/dev` and prints the testing readiness summary.

---

## ✅ Success Output Checklist

At the end of the script, confirm your output shows:

```text
================================================================================
                         READY FOR TESTING
================================================================================

Branch                : feat/<your-branch>
Testing Source        : origin/dev
Local Commit          : <commit-sha>
origin/dev Commit     : <commit-sha>

Branch Synchronized   : YES
Remote Push           : NO (local only)
Branch Changed        : NO

Node.js Version       : v...
npm Version           : ...
================================================================================
```

---

## ⚠️ Important Testing Rule

Before beginning any testing:

> **Verify that the `Local Commit` SHA on your screen matches the official testing commit announced by the team lead.**

If your commit SHA matches, your environment is 100% ready for testing!

---

## ❓ Troubleshooting

| Issue | Solution |
|---|---|
| `Script execution is disabled on this system` | Run `powershell -ExecutionPolicy Bypass -File .\prepare-testing.ps1`. |
| `EPERM: operation not permitted, unlink query_engine-windows.dll.node` | Stop your running backend dev server (`Ctrl + C`) and re-run the script. |
| `Working tree has uncommitted tracked changes` | Commit (`git commit`) or stash (`git stash`) your work before running. |
