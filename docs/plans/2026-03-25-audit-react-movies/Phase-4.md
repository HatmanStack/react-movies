# Phase 4: [FORTIFIER] Guardrails (Hooks, Env Validation, CI)

## Phase Goal

Add preventive guardrails: pre-commit hooks for lint/format/type-check, startup environment validation, and conventional commit enforcement. These prevent the same categories of issues from recurring.

**Success criteria:**

- Pre-commit hooks run lint-staged on staged files
- Commit messages validated against conventional commits format
- API keys validated at startup with clear error messages
- `engines` field in package.json specifies Node.js version
- All existing tests pass

**Estimated tokens:** ~15k

## Prerequisites

- Phases 1-3 complete
- Familiarity with Phase 0 conventions

## Tasks

### Task 1: Add pre-commit hooks with husky and lint-staged

**Goal:** Prevent broken code from being committed. Run ESLint and Prettier on staged files before every commit.

**Files to Modify/Create:**

- `package.json` - Add `husky`, `lint-staged` dev dependencies; add `prepare` script
- `.husky/pre-commit` - Pre-commit hook file (created by husky init)
- `.lintstagedrc.json` or `package.json` lint-staged config

**Prerequisites:** None

**Implementation Steps:**

1. Install dev dependencies: `npm install --save-dev husky lint-staged`
2. Initialize husky: `npx husky init`
3. This creates a `.husky/pre-commit` file. Set its content to:
   ```bash
   npx lint-staged
   ```
4. Add lint-staged configuration to `package.json`:
   ```json
   "lint-staged": {
     "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
     "*.{json,md,yml,yaml}": ["prettier --write"]
   }
   ```
5. Verify the `prepare` script was added to `package.json` scripts:
   ```json
   "prepare": "husky"
   ```
6. Test the hook by staging a file and committing.

**Verification Checklist:**

- [x] `husky` and `lint-staged` in devDependencies
- [x] `.husky/pre-commit` exists and runs `lint-staged`
- [x] `prepare` script in package.json
- [x] lint-staged config targets `.ts`, `.tsx`, `.json`, `.md` files
- [x] `npm run lint` passes
- [x] `npm test` passes

**Commit Message Template:**

```text
ci(hooks): add pre-commit hooks with husky and lint-staged

Run ESLint and Prettier on staged files before every commit
to catch issues early.
```

---

### Task 2: Add conventional commits enforcement

**Goal:** Enforce conventional commit message format to improve git hygiene (currently scored 4/10).

**Files to Modify/Create:**

- `package.json` - Add `@commitlint/cli`, `@commitlint/config-conventional` dev dependencies
- `.commitlintrc.json` - Commitlint configuration
- `.husky/commit-msg` - Commit message hook

**Prerequisites:** Task 1 (husky installed)

**Implementation Steps:**

1. Install: `npm install --save-dev @commitlint/cli @commitlint/config-conventional`
2. Create `.commitlintrc.json`:
   ```json
   {
     "extends": ["@commitlint/config-conventional"]
   }
   ```
3. Create the commit-msg hook: `echo 'npx --no -- commitlint --edit "$1"' > .husky/commit-msg`
4. Test by attempting a commit with a non-conventional message (should fail) and a conventional one (should pass).

**Verification Checklist:**

- [x] `@commitlint/cli` and `@commitlint/config-conventional` in devDependencies
- [x] `.commitlintrc.json` exists with conventional config
- [x] `.husky/commit-msg` hook exists and calls commitlint
- [x] Non-conventional commit messages are rejected
- [x] `npm test` passes

**Commit Message Template:**

```text
ci(hooks): enforce conventional commits with commitlint

Validate commit messages against conventional commits format
to maintain consistent git history going forward.
```

---

### Task 3: Add startup environment validation

**Goal:** API keys are read from `process.env` at module scope with no startup validation. The app loads fine but fails on first API call. This is MEDIUM finding #7. Add explicit validation at startup.

**Files to Modify:**

- `src/utils/envValidation.ts` (new file) - Environment validation function
- `app/_layout.tsx` - Call validation on app startup

**Prerequisites:** None

**Implementation Steps:**

1. Create `src/utils/envValidation.ts`:

   ```typescript
   import { logError, logWarn } from "./errorHandler";

   interface EnvConfig {
     TMDB_API_KEY: string;
     YOUTUBE_API_KEY?: string;
   }

   export function validateEnvironment(): EnvConfig {
     const tmdbKey = process.env.EXPO_PUBLIC_TMDB_API_KEY;
     const youtubeKey = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY;

     if (!tmdbKey) {
       const msg = "EXPO_PUBLIC_TMDB_API_KEY is not set. API calls will fail.";
       logError(new Error(msg), "EnvValidation");
       throw new Error(msg);
     }

     if (!youtubeKey) {
       logWarn(
         "EXPO_PUBLIC_YOUTUBE_API_KEY is not set. Trailer thumbnails will use defaults.",
         "EnvValidation",
       );
     }

     return {
       TMDB_API_KEY: tmdbKey,
       YOUTUBE_API_KEY: youtubeKey,
     };
   }
   ```

2. In `app/_layout.tsx`, call `validateEnvironment()` early in the component or at module scope. Since this is an Expo app (not serverless), calling it in a `useEffect` on mount is fine. A module-scope call would fail fast on import, which may be preferable.
3. Consider: the TMDb service already checks for the key at request time (line 52). The startup validation adds fail-fast behavior so the error appears immediately, not on first user interaction.
4. If using module-scope validation, wrap in try-catch so the app can still show a useful error screen instead of crashing.

**Verification Checklist:**

- [x] `envValidation.ts` created with validation logic
- [x] Missing TMDB key causes an immediate, clear error
- [x] Missing YouTube key logs a warning but does not throw
- [x] `npm run type-check` passes
- [x] `npm test` passes (tests mock env vars in jest.setup.js)

**Commit Message Template:**

```text
fix(env): add startup environment variable validation

Fail fast with clear error message when TMDB API key is
missing instead of silently failing on first API call.
```

---

### Task 4: Add Node.js engines field to package.json

**Goal:** CI uses Node.js 24 but package.json has no `engines` field. README says Node 18+. Set the authoritative minimum. This is config drift from the doc audit.

**Files to Modify:**

- `package.json` - Add `engines` field

**Prerequisites:** None

**Implementation Steps:**

1. Add to `package.json`:
   ```json
   "engines": {
     "node": ">=20"
   }
   ```
2. Use `>=20` as the minimum (LTS baseline). The CI runs 24, but 20 is a reasonable minimum for the dependencies used.
3. This will be referenced when fixing the README in Phase 5.

**Verification Checklist:**

- [x] `engines.node` field present in package.json
- [x] Value is reasonable for the dependency set
- [x] `npm test` passes

**Commit Message Template:**

```text
chore(config): add engines field to package.json

Specify Node.js >=20 as minimum version to align
documentation and CI configuration.
```

## Phase Verification

After all tasks in this phase:

1. Run the full verification suite:
   ```bash
   npm run lint && npm run type-check && npm test
   ```
2. Test pre-commit hook:
   ```bash
   echo "test" > /tmp/test-hook.txt
   git add /tmp/test-hook.txt  # This won't work, but staging a real file and committing will
   ```
3. Verify commitlint rejects bad messages:
   ```bash
   echo "bad message" | npx commitlint
   echo "fix: good message" | npx commitlint
   ```
4. Verify `.husky/` directory contains `pre-commit` and `commit-msg` hooks.
