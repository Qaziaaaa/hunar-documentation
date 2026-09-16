# Coding Standards — Hunar / Fixora (Home Services Platform)

**Author:** Shafqat Ullah
**Document Type:** Coding Standards
**Version:** 1.0
**Status:** Draft — Pending Team Review

> This document defines how **every developer** on the team should write code, so that all of us follow the same style. These standards are based on common industry practices (Airbnb style guide, Google TypeScript Style Guide, Conventional Commits, Prettier, and official Next.js / NestJS guidance) and are adapted to our actual tech stack: **Next.js + TypeScript + NestJS + Node.js/Express + PostgreSQL**.

---

## 1. Naming Conventions

How variables, functions, classes, and constants are named.

| Kind              | Convention        | Example                          |
| ----------------- | ----------------- | -------------------------------- |
| Variables         | `camelCase`       | `const userName = "Qazi";`       |
| Functions         | `camelCase`       | `getUserById(id)`                |
| Classes / Services| `PascalCase`      | `class UserService {}`           |
| React Components  | `PascalCase`      | `UserProfile`                    |
| Constants         | `UPPER_SNAKE_CASE`| `const MAX_RETRIES = 3;`         |
| Booleans          | `camelCase` (is/has/can) | `const isActive = true;`   |
| Enums             | `PascalCase` type, UPPER values | `enum Role { ADMIN, USER }` |

**Example:**

```typescript
const userName = "Qazi";

function getUserById(id: number): User | null {
  // ...
}

class UserService {
  // ...
}
```

### Rules
- Always use meaningful, descriptive names. `getUserById` not `getuserbyid`.
- Do **not** abbreviate unless the abbreviation is widely known (`http`, `id`, `url`).
- Use **nouns** for variables/classes and **verbs** for functions.
- Prefer `const` over `let`; use `let` only when the value must change.

---

## 2. File & Folder Naming

Naming convention for files and folders across the codebase.

| Type                | Convention         | Example                          |
| ------------------- | ------------------ | -------------------------------- |
| Folder (general)    | `kebab-case`       | `user-management/`               |
| NestJS service file | `kebab-case`       | `auth.service.ts`                |
| NestJS controller   | `kebab-case`       | `user.controller.ts`             |
| Next.js page        | `kebab-case`       | `job-tracking.tsx`               |
| React component file| `PascalCase`       | `UserProfile.tsx`                |
| Config file         | `.env`, `.prettierrc` | `.eslintrc.cjs`               |

**Examples:**

```text
src/
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   └── users/
│       ├── user.controller.ts
│       └── user.service.ts
```

---

## 3. Variables

- Use `camelCase` for variable names.
- Always declare variables with `const` by default; only use `let` when reassignment is required.
- Never use `var`.
- Never leave unused variables (enforced by ESLint).
- Unit test and config constants should be `UPPER_SNAKE_CASE`.

**Example:**

```typescript
const maxRetries = 3;
const apiBaseUrl = process.env.API_BASE_URL;

if (attempts < maxRetries) {
  // retry logic
}
```

---

## 4. Functions

- Name functions starting with a **verb**: `createUser()`, `getUserById()`, `validateToken()`.
- One function should do **one thing** — keep functions small and focused.
- Use descriptive parameters; avoid boolean flags where possible (split into two functions instead).
- Use **arrow functions** for callbacks/handlers.
- Return types are mandatory on exported functions (TypeScript).

**Example:**

```typescript
// Good
function createUser(email: string): User {
  // ...
}

// Avoid
function user(): User {
  // too vague
}
```

---

## 5. Components (React / Next.js)

- Component names are `PascalCase`: `UserProfile.tsx`.
- One component per file.
- Use **function components**, not class components.
- File name should match the component name exactly.
- Use TypeScript types/interfaces for props, named `XxxProps`.

**Example:**

```tsx
// UserProfile.tsx
export interface UserProfileProps {
  name: string;
  role: Role;
}

export default function UserProfile({ name, role }: UserProfileProps) {
  return (
    <div>
      <h2>{name}</h2>
      <span>{role}</span>
    </div>
  );
} 
```

---

## 6. API Standards

- Use **RESTful** naming: resources as nouns, HTTP methods as actions.
- Use **plural** resource names and **kebab-case** for path segments.
- Nest endpoints under `/api/`.

| Method | Endpoint                | Purpose              |
| ------ | ----------------------- | -------------------- |
| GET    | `/api/users`            | List users           |
| GET    | `/api/users/:id`        | Get one user         |
| POST   | `/api/users`            | Create user          |
| PATCH  | `/api/users/:id`        | Update user          |
| DELETE | `/api/users/:id`        | Delete user          |
| POST   | `/api/auth/login`       | Login                |
| POST   | `/api/jobs`             | Create a job         |

**Rules**
- Don't expose internal DB IDs in URLs where avoidable; use GUIDs/UUIDs for public IDs.
- Always return proper HTTP status codes (`200`, `201`, `400`, `401`, `404`, `500`).
- Response shape should be consistent (see Error Handling).
- Version the API when needed (`/api/v1/...`).

---

## 7. Error Handling

- Always return the **correct HTTP status code** and a **clear message**.
- Use a consistent error response shape on the backend.
- Use NestJS **exception filters** for centralized error handling; never swallow errors.
- Never expose internal stack traces or DB details to the client.
- Log errors on the server with enough context.

**Consistent error shape:**

```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

**Example (NestJS):**

```typescript
@Get(':id')
getUser(@Param('id') id: string) {
  const user = this.userService.findById(id);
  if (!user) {
    throw new NotFoundException(`User ${id} not found`);
  }
  return user;
}
```

---

## 8. Comments

- Comment the **why**, not the obvious **what**.
- Avoid redundant comments that just restate the code.
- Use **JSDoc** for exported/public functions, classes, and interfaces.
- Mark tricky logic, decisions, and non-obvious trade-offs.
- Remove commented-out code — rely on version control instead.

**Example:**

```typescript
// Retry only idempotent requests; payouts must never be retried blindly.
const maxRetries = 3;
```

---

## 9. Git Standards

Use **Conventional Commits** with a `type(scope): subject` format.

| Type      | Usage                                   |
| --------- | --------------------------------------- |
| `feat`    | A new feature                           |
| `fix`     | A bug fix                               |
| `docs`    | Documentation only                      |
| `refactor`| Code change that neither fixes a bug nor adds a feature |
| `test`    | Adding or updating tests                |
| `chore`   | Maintenance / tooling                   |

**Examples:**

```text
feat: add login API
fix: resolve authentication bug
docs: update API documentation
refactor: improve user service
test: add login tests
chore: update dependencies
```

**Branch naming** — `type/short-description`:

```text
feature/add-user-authentication
fix/login-timeout
docs/update-api-guide
```

**Rules**
- Write small, focused commits; do **not** mix unrelated changes.
- Always commit only the intended files; never commit secrets.
- Write commit messages in present tense (`add`, not `added`).

---

## 10. Code Formatting

Use **Prettier** for automatic, consistent formatting and **ESLint** for linting.

- **Indentation:** 2 spaces
- **Quotes:** single quotes
- **Semicolons:** always
- **Trailing commas:** always (where valid)
- **Line length:** 100 characters (soft)
- **End of file:** newline at end

**Example `.prettierrc`:**

```json
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "trailingComma": "all",
  "endOfLine": "lf"
}
```

---

## 11. Security

Every developer **must** follow these basic security rules.

❌ **Never commit:**
- `.env` files
- API keys / secrets
- passwords
- database credentials
- tokens / session keys

✅ **Do instead:**
- Use environment variables for all secrets.
- Keep `.env` in `.gitignore`, provide a `.env.example` with placeholder values.
- Use validation libraries (e.g., `class-validator`) to validate all inputs.
- Apply least-privilege DB roles.
- Sanitize/validate user input to prevent injection and XSS.

**Example `.gitignore`:**

```text
.env
node_modules/
dist/
*.log
```

---

## 12. Code Review

Requirements before any code is merged.

- Every pull request must be **reviewed by at least 1 team member**.
- The PR must **build without errors** and **pass linting** and **tests**.
- No secrets or debugging artifacts (`console.log` left behind) should be in the PR.
- Keep PRs **small and focused** on a single concern.
- Reviewer should check: correctness, naming, error handling, security, and adherence to these standards.

---

## Summary of Tooling

The following config files should be added to the repo to enforce these standards automatically:

```text
.eslintrc        — linting rules
.prettierrc      — formatting rules
.editorconfig    — editor consistency (spaces, line endings)
.gitignore       — prevent committing secrets/build artifacts
```

---

*Document prepared by Shafqat Ullah — Pending review by Qazi Farhan Ahmad (Team Lead)*
