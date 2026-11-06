# WorkerFix (HUNAR Platform)

WorkerFix / HUNAR is a home-services marketplace platform consisting of a modular NestJS backend and Next.js frontend.

---

## Testing Environment Preparation

To ensure all developers and testers are aligned on the exact same codebase and dependencies without local drift, use the `prepare-testing.ps1` script before any testing cycle.

### Goal & Workflow

Every developer **remains on their own feature/personal branch**, but their **LOCAL branch is synchronized to exactly the latest `origin/dev` commit** before testing:

```text
origin/dev       → ABC123
feat/abdullah    → ABC123
feat/farhan      → ABC123
feat/faizan      → ABC123
```

- Developers are **NEVER switched to the `dev` branch**.
- The script **NEVER pushes anything to the remote** (`Remote Push: NO`).
- Untracked files (`.env`, local configuration, uploads, logs) are **never automatically deleted**.

```text
Developer's feature branch
        ↓
Check: working tree has no uncommitted tracked changes
        ↓
Fetch origin/dev & verify origin/dev exists
        ↓
Reset LOCAL feature branch → origin/dev
        ↓
Verify branch unchanged & HEAD == origin/dev
        ↓
npm ci (backend, frontend, root)
        ↓
Ready for testing (Branch Synchronized: YES)
```

### What `prepare-testing.ps1` Does

1. **Prerequisite & Root Check**: Checks Git installation and verifies execution from the Git repository root.
2. **Current Branch Detection**: Identifies the active branch (e.g., `feat/abdullah`) and guarantees you will remain on it.
3. **Tracked Changes Safety Guard**: Checks `git status --porcelain -uno`. If you have staged or unstaged tracked changes, the script aborts immediately with instructions to commit, stash, or discard them. It will **not** reset while tracked changes exist.
4. **Preserve Untracked Files**: Detects and displays untracked files with a warning, but **does not delete them**.
5. **Fetch `origin/dev` Only**: Runs `git fetch origin dev` and validates `git rev-parse --verify origin/dev`.
6. **Pre-Reset Comparison & Confirmation**: Displays your current local HEAD and the target `origin/dev` commit, and asks for explicit confirmation: `Continue? (yes/no)`.
7. **Reset Local Branch**: Runs `git reset --hard origin/dev` directly on your feature branch.
8. **Formal Verification**: Confirms that you are still on your feature branch and that `LOCAL HEAD == origin/dev`.
9. **Dependency Installation (`npm ci`)**: Runs `npm ci` in each application directory (`hunar-backend`, `hunar-frontend`, and root) where both `package.json` and `package-lock.json` exist.
10. **Final Report**:
   ```text
   ================================================================================
                                READY FOR TESTING
   ================================================================================
   Branch                : feat/abdullah
   Testing Source        : origin/dev
   Local Commit          : abc1234
   origin/dev Commit     : abc1234
   Branch Synchronized   : YES
   Remote Push           : NO (local only)

   Node.js Version       : v...
   npm Version           : ...
   ================================================================================
   ```

### How Developers Run It

1. **Stop active development servers**: If you have `npm run start:dev` or `npm run dev` running in other terminals, stop them (`Ctrl + C`) so Windows releases locks on DLLs (e.g., Prisma query engine).
2. From the repository root in Windows PowerShell, run:

```powershell
.\prepare-testing.ps1
```

> **Note**: If your PowerShell execution policy blocks local script execution, run:
> ```powershell
> powershell -ExecutionPolicy Bypass -File .\prepare-testing.ps1
> ```

### Team Synchronization & Official Commit SHA

- **Team Alignment**: Every developer and tester **must have the identical commit SHA** before beginning any testing session.
- **Team Lead Announcement**: The **official testing commit should be announced by the team lead** prior to testing.
- **Verification**: Check that `Branch Synchronized: YES` appears and that `Local Commit` matches the team lead's announcement.

---

## Repository Structure

- `hunar-backend/`: NestJS modular backend API (PostgreSQL + PostGIS, Prisma, Redis, Socket.IO).
- `hunar-frontend/`: Next.js frontend application (App Router, TypeScript).
- `package.json`: Root workspace configuration and scripts.
- `prepare-testing.ps1`: Automated testing preparation script.

---

## Local Development Quickstart

- **Start all services**:
  ```bash
  npm run dev
  ```
- **Backend only**:
  ```bash
  npm run dev:backend
  ```
- **Frontend only**:
  ```bash
  npm run dev:frontend
  ```
