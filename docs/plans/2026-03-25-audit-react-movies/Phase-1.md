# Phase 1: [HYGIENIST] Dead Code and Dependency Cleanup

## Phase Goal

Remove all dead scaffold code, unused dependencies, and unused exports identified by knip and the health audit. This is purely subtractive work that reduces confusion, shrinks bundle size, and cleans up lint/type-check output for subsequent phases.

**Success criteria:**
- All dead Expo template files deleted
- Unused dependencies removed from package.json
- Unused exports removed or unexported from source files
- `npm run lint`, `npm run type-check`, and `npm test` all pass
- No regressions in existing test suite

**Estimated tokens:** ~20k

## Prerequisites

- `npm ci` completed successfully
- Familiarity with Phase 0 conventions

## Tasks

### Task 1: Delete dead Expo template scaffold files

**Goal:** Remove the 12+ dead scaffold files that ship with the Expo template. These files have broken imports (12 unresolved imports confirmed by knip) and create confusion about the app's routing structure. This is CRITICAL finding #1 from the health audit.

**Files to Delete:**
- `app/(tabs)/_layout.tsx`
- `app/(tabs)/index.tsx`
- `app/(tabs)/two.tsx`
- `app/modal.tsx`
- `app/+not-found.tsx`
- `components/EditScreenInfo.tsx`
- `components/Themed.tsx`
- `components/ExternalLink.tsx`
- `components/StyledText.tsx`
- `components/useClientOnlyValue.ts`
- `components/useClientOnlyValue.web.ts`
- `components/useColorScheme.ts`
- `components/useColorScheme.web.ts`
- `components/__tests__/StyledText-test.js`
- `components/__tests__/__snapshots__/` (directory)
- `constants/Colors.ts`

**Files to Modify:**
- `app/_layout.tsx` - Remove any route registrations for `(tabs)` or `modal` if present

**Prerequisites:** None

**Implementation Steps:**
1. Read `app/_layout.tsx` to check if it references `(tabs)` or `modal` routes. If it does, remove those references.
2. Delete all files listed above. Delete the now-empty `app/(tabs)/` directory, `components/` directory, and `constants/` directory.
3. Run `npm run type-check` to verify no remaining imports reference deleted files.
4. Run `npm test` to verify no tests depend on deleted files.

**Verification Checklist:**
- [x] `app/(tabs)/` directory no longer exists
- [x] `components/` directory (root-level) no longer exists
- [x] `constants/` directory (root-level) no longer exists
- [x] `app/modal.tsx` no longer exists
- [x] `app/+not-found.tsx` no longer exists
- [x] `app/_layout.tsx` does not reference deleted routes
- [x] `npm run type-check` passes
- [x] `npm test` passes

**Commit Message Template:**
```
chore(scaffold): remove dead Expo template files

Delete 16 unused scaffold files: app/(tabs)/, app/modal.tsx,
app/+not-found.tsx, components/ (including __tests__/),
constants/Colors.ts. All had broken imports and were not part
of the active app.
```

---

### Task 2: Remove unused dependencies

**Goal:** Remove 9 unused production dependencies and unused dev dependencies identified by knip. This reduces bundle size and attack surface.

**Files to Modify:**
- `package.json` - Remove unused dependencies

**Prerequisites:** Task 1 (some deps may only be referenced by deleted scaffold files)

**Implementation Steps:**
1. Read current `package.json` dependencies.
2. For each dependency flagged as unused by knip, verify it is genuinely unused by searching the codebase (excluding deleted files and node_modules):
   - `@react-navigation/native` - Check if any file imports from this package
   - `expo-constants` - Check imports
   - `expo-linking` - Check imports
   - `expo-web-browser` - Check imports
   - `react-dom` - This IS needed for web platform. Keep it. Verify by checking if the project targets web (it does via `expo start --web`).
   - `react-native-safe-area-context` - May be a transitive peer dep required by expo-router or react-native-paper. Check peer deps before removing.
   - `react-native-screens` - Same as above, likely a peer dep of expo-router.
   - `react-native-web` - Needed for web platform. Keep it.
   - `react-native-worklets` - Check if react-native-reanimated requires this as a peer dep.
3. For dev dependencies, check each one similarly. Be cautious: `react-test-renderer` may be needed by jest-expo even if not directly imported.
4. Only remove dependencies you have confirmed are truly unused AND not required as peer dependencies.
5. Run `npm install` after editing package.json to regenerate the lockfile.
6. Run all verification commands.

**Important:** Be conservative. If a dependency might be a peer dep of expo-router, react-native-paper, or react-native-reanimated, keep it. Check by running `npm ls <package-name>` to see what depends on it.

**Verification Checklist:**
- [x] Each removed dependency verified as genuinely unused (not a peer dep)
- [x] `npm install` succeeds without peer dep warnings for removed packages
- [x] `npm run lint` passes
- [x] `npm run type-check` passes
- [x] `npm test` passes
- [ ] `npx expo start --web` does not crash on startup (if you can test this)

**Commit Message Template:**
```
chore(deps): remove unused dependencies

Remove N unused production dependencies and M unused dev
dependencies identified by knip scan.
```

---

### Task 3: Remove unused exports from validation/schemas.ts

**Goal:** Remove or unexport the 14 validation utility functions in `src/validation/schemas.ts` that are never imported anywhere. These were part of an incomplete migration where validation was centralized but never wired up. The TMDb service calls `schema.parse()` directly.

**Files to Modify:**
- `src/validation/schemas.ts` - Remove unused exported functions (lines 220-314)

**Prerequisites:** Task 1

**Implementation Steps:**
1. Read `src/validation/schemas.ts` fully.
2. For each exported function starting at line 220, search the entire codebase (excluding `__tests__/` and `node_modules/`) for any imports of that function name.
3. Functions confirmed unused by knip: `validateSafe`, `validate`, `validateWithFallback`, `validateArray`, `validateTMDbDiscoverResponse`, `validateTMDbVideosResponse`, `validateTMDbReviewsResponse`, `validateMovieDetails`, `validateMovieDetailsArray`, `validateVideoDetailsArray`, `validateReviewDetailsArray`.
4. Also check the `ValidationResult` type export, and the `Validated*` type aliases (e.g., `ValidatedTMDbDiscoverResponse`) - if they are only used by the deleted functions, remove them too.
5. Delete the unused functions and types. Keep any that ARE imported somewhere.
6. If any tests import these functions, update those tests.

**Verification Checklist:**
- [x] All unused validation functions removed
- [x] No remaining imports reference deleted functions
- [x] `npm run type-check` passes
- [x] `npm test` passes

**Commit Message Template:**
```
chore(validation): remove 14 unused validation utility functions

These were part of an incomplete centralization effort.
The TMDb service calls schema.parse() directly.
```

---

### Task 4: Audit and remove remaining unused exports

**Goal:** Address the broader knip finding of 44 unused exported functions/values and 22 unused exported types. After Tasks 1-3 handle the biggest clusters, sweep remaining files.

**Files to Modify:**
- Various source files (determined by search)

**Prerequisites:** Tasks 1-3

**Implementation Steps:**
1. Run knip to get the current list of unused exports (after previous deletions): `npx knip --include exports,types`
2. For each unused export, decide:
   - If the function/type is clearly dead code with no future use, delete it.
   - If the function/type is part of a public API surface that could be used later (e.g., `createRetryable`, `getRetryAfterDelay` in retry.ts), just remove the `export` keyword to make it private, or leave it if it is genuinely part of the module's intended API.
   - If the export is in a file that also has used exports, just remove the `export` keyword from the unused ones.
3. Pay special attention to:
   - `src/utils/retry.ts` - `isRateLimitError` and `getRetryAfterDelay` are exported but may be unused. Check if `isRateLimitError` is duplicated in `errorHandler.ts` (health audit LOW #5).
   - `src/utils/errorHandler.ts` - Check for duplicate `isRateLimitError` and `isNetworkError`.
   - `src/components/ErrorBoundary.tsx` - knip flagged this as an unused file. It exists but is not wired into `_layout.tsx`. Do NOT delete it; it will be wired in during Phase 3.
4. For the duplicated `isRateLimitError`/`isNetworkError` between `retry.ts` and `errorHandler.ts`: keep the version in `errorHandler.ts` (which is the canonical error handling module) and remove the duplicate from `retry.ts`. Update any imports if needed.

**Verification Checklist:**
- [x] knip unused exports count significantly reduced
- [x] No functional code removed (only truly dead exports)
- [x] Duplicate `isRateLimitError`/`isNetworkError` consolidated
- [x] `npm run type-check` passes
- [x] `npm test` passes

**Commit Message Template:**
```
chore: remove unused exports and consolidate duplicates

Reduce unused export count from knip scan. Consolidate
duplicate isRateLimitError/isNetworkError into errorHandler.ts.
```

---

### Task 5: Rename package and fix app.json placeholders

**Goal:** Fix the generic package name and stale config values. Quick wins from the health audit.

**Files to Modify:**
- `package.json` - Change `"name": "expo-project"` to `"name": "react-movies"`
- `app.json` - Change `"owner": "your-expo-username"` to a real value or remove the field. Change `"githubUrl"` from `android-movies` to `react-movies`.

**Prerequisites:** None

**Implementation Steps:**
1. In `package.json`, change the `"name"` field on line 2 from `"expo-project"` to `"react-movies"`.
2. In `app.json`:
   - Remove the `"owner": "your-expo-username"` line (it is a placeholder that was never filled in; removing is better than guessing).
   - Change `"githubUrl"` from `"https://github.com/HatmanStack/android-movies"` to `"https://github.com/HatmanStack/react-movies"`.
3. Run verification commands.

**Verification Checklist:**
- [x] `package.json` name is `"react-movies"`
- [x] `app.json` has no placeholder owner
- [x] `app.json` githubUrl points to correct repo
- [x] `npm run lint` passes
- [x] `npm test` passes

**Commit Message Template:**
```
chore: fix package name and app.json placeholders

Rename from expo-project to react-movies. Remove placeholder
owner field. Fix githubUrl to point to correct repository.
```

## Phase Verification

After all tasks in this phase:

1. Run the full verification suite:
   ```bash
   npm run lint && npm run type-check && npm test
   ```
2. Verify deleted directories no longer exist:
   ```bash
   ls app/(tabs)/ 2>&1     # Should error: No such file or directory
   ls components/ 2>&1      # Should error: No such file or directory
   ls constants/ 2>&1       # Should error: No such file or directory
   ```
3. Verify package.json has fewer dependencies than before.
4. Optionally run `npx knip` to confirm reduced dead code count.
