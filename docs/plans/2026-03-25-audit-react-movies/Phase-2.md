# Phase 2: [IMPLEMENTER] Core Code Fixes (API, Store, Database, Retry)

## Phase Goal

Fix the highest-impact code issues: the Zod validate-then-cast anti-pattern (HIGH), the retry sleep event listener leak (CRITICAL), store method duplication (HIGH), database schema bug (MEDIUM), web storage performance (HIGH), and centralized logging gaps (MEDIUM).

**Success criteria:**

- Zod parse return values used directly in all TMDb service methods
- YouTube API response validated with Zod
- Sleep function properly cleans up abort listeners
- `syncMoviesWithAPI` and `refreshMovies` consolidated into one method
- `vote_average` column type fixed to REAL with DB version bump
- Web storage uses `multiSet` for batch operations
- Raw console.log replaced with centralized logging in database init
- All existing tests pass; new tests added where behavior changes

**Estimated tokens:** ~35k

## Prerequisites

- Phase 1 complete (dead code removed, cleaner codebase)
- Familiarity with Phase 0 conventions

## Tasks

### Task 1: Fix Zod validate-then-cast anti-pattern in TMDb service

**Goal:** Use the Zod `.parse()` return value directly instead of discarding it and casting the original data. This is HIGH finding #1 from the health audit and affects 4 methods in `src/api/tmdb.ts`.

**Files to Modify:**

- `src/api/tmdb.ts` - Fix 4 methods: `getPopularMovies`, `getTopRatedTV`, `getMovieVideos`, `getMovieReviews`

**Prerequisites:** None

**Implementation Steps:**

1. Read `src/api/tmdb.ts` fully.
2. In each of the 4 public methods, the current pattern is:
   ```typescript
   const data = await this.get<unknown>("/endpoint", params, signal);
   SomeSchema.parse(data); // return value discarded
   return data as SomeResponseType; // original data cast
   ```
3. Change to:
   ```typescript
   const data = await this.get<unknown>("/endpoint", params, signal);
   return SomeSchema.parse(data); // validated AND typed in one step
   ```
4. The `get<T>` method's generic parameter becomes irrelevant for these calls since we fetch as `unknown`. This is fine.
5. Check that the Zod schema's inferred output type is compatible with the declared return type of each method (e.g., `TMDbDiscoverResponse`). If there is a mismatch, you may need to adjust the return type to use `z.infer<typeof SomeSchema>` or verify the types align.
6. Run the existing TMDb API tests to verify: `npx jest __tests__/api/tmdb.test.ts`

**Verification Checklist:**

- [ ] All 4 methods return `Schema.parse(data)` directly
- [ ] No `as TMDb*Response` casts remain in the 4 methods
- [ ] `npm run type-check` passes
- [ ] `npx jest __tests__/api/tmdb.test.ts` passes

**Commit Message Template:**

```text
fix(api): use Zod parse return values in TMDb service

Return schema.parse(data) directly instead of discarding the
validated result and casting the original data.
```

---

### Task 2: Add Zod validation to YouTube API response

**Goal:** The YouTube API response is cast with `as YouTubeVideoResponse` without validation, despite `YouTubeVideoResponseSchema` existing in the validation module. This is HIGH finding #2.

**Files to Modify:**

- `src/api/youtube.ts` - Add Zod validation at the response parse point

**Prerequisites:** Task 1 (establishes the pattern)

**Implementation Steps:**

1. Read `src/api/youtube.ts` fully.
2. Find where `response.json()` is cast as `YouTubeVideoResponse` (around line 63).
3. Import `YouTubeVideoResponseSchema` from `../validation/schemas`.
4. Replace the cast with Zod validation:
   ```typescript
   const rawData = await response.json();
   const data = YouTubeVideoResponseSchema.parse(rawData);
   ```
5. Wrap the parse in a try-catch if the function already has error handling. The YouTube service is designed for graceful degradation, so a Zod validation failure should fall through to the existing fallback behavior (return default thumbnail) rather than throwing.
6. Consider using `safeParse` instead of `parse` to match the graceful degradation pattern:
   ```typescript
   const rawData = await response.json();
   const result = YouTubeVideoResponseSchema.safeParse(rawData);
   if (!result.success) {
     // Log and fall through to default thumbnail
   }
   const data = result.data;
   ```
7. Run YouTube tests: `npx jest __tests__/api/youtube.test.ts`

**Verification Checklist:**

- [ ] YouTube API response is validated with Zod before use
- [ ] Validation failure falls through to default thumbnail (graceful degradation preserved)
- [ ] No `as YouTubeVideoResponse` casts remain
- [ ] `npx jest __tests__/api/youtube.test.ts` passes

**Commit Message Template:**

```text
fix(api): add Zod validation to YouTube API response

Validate response with YouTubeVideoResponseSchema instead of
raw cast. Use safeParse to preserve graceful degradation.
```

---

### Task 3: Fix event listener leak in retry sleep function

**Goal:** The `sleep` function in `src/utils/retry.ts` adds an `abort` event listener that is never removed when the timeout resolves normally. This is CRITICAL finding #2.

**Files to Modify:**

- `src/utils/retry.ts` - Fix the `sleep` function (lines 85-99)

**Prerequisites:** None

**Implementation Steps:**

1. Read `src/utils/retry.ts`, focusing on the `sleep` function at lines 85-99.
2. The current implementation:
   ```typescript
   async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
     return new Promise((resolve, reject) => {
       if (signal?.aborted) {
         reject(new DOMException("Aborted", "AbortError"));
         return;
       }
       const timeoutId = setTimeout(resolve, ms);
       signal?.addEventListener("abort", () => {
         clearTimeout(timeoutId);
         reject(new DOMException("Aborted", "AbortError"));
       });
     });
   }
   ```
3. Fix by: (a) extracting the abort handler to a named function, and (b) removing the listener when the timeout resolves:

   ```typescript
   async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
     return new Promise((resolve, reject) => {
       if (signal?.aborted) {
         reject(new DOMException("Aborted", "AbortError"));
         return;
       }

       const onAbort = () => {
         clearTimeout(timeoutId);
         reject(new DOMException("Aborted", "AbortError"));
       };

       const timeoutId = setTimeout(() => {
         signal?.removeEventListener("abort", onAbort);
         resolve();
       }, ms);

       signal?.addEventListener("abort", onAbort, { once: true });
     });
   }
   ```

4. Note the `{ once: true }` option as a belt-and-suspenders measure alongside the explicit `removeEventListener`.
5. Verify existing retry tests pass. If there are no tests specifically for the sleep function's cleanup behavior, this is acceptable; the fix is straightforward.

**Verification Checklist:**

- [ ] Abort listener is removed when timeout resolves normally
- [ ] `{ once: true }` option used on addEventListener
- [ ] Abort still cancels the sleep correctly
- [ ] Pre-aborted signal still rejects immediately
- [ ] `npm test` passes

**Commit Message Template:**

```text
fix(retry): clean up abort listener in sleep function

Remove the abort event listener when the timeout resolves
normally to prevent listener accumulation on long-lived
AbortControllers.
```

---

### Task 4: Consolidate duplicate store sync methods

**Goal:** `syncMoviesWithAPI` (lines 317-391) and `refreshMovies` (lines 397-480) are near-identical. Consolidate into a single parameterized method. This is HIGH finding #4.

**Files to Modify:**

- `src/store/movieStore.ts` - Merge the two methods
- `app/index.tsx` - Update call sites if method signature changes

**Prerequisites:** None

**Implementation Steps:**

1. Read `src/store/movieStore.ts` fully (it is ~496 lines, the largest non-test source file).
2. Compare `syncMoviesWithAPI` and `refreshMovies` side by side. Identify the differences:
   - `refreshMovies` preserves favorites while `syncMoviesWithAPI` may not
   - There may be minor differences in loading state management
3. Create a single method, e.g., `syncMoviesWithAPI(signal?: AbortSignal, options?: { preserveFavorites?: boolean })`, that accepts an options parameter controlling the behavior difference.
4. The default for `preserveFavorites` should match what `syncMoviesWithAPI` does (likely `false`), and the refresh use case passes `{ preserveFavorites: true }`.
5. Update the store interface to remove `refreshMovies` and update `syncMoviesWithAPI`'s signature.
6. Search all files for references to `refreshMovies` and update them to use `syncMoviesWithAPI(signal, { preserveFavorites: true })`.
7. Run store tests: `npx jest __tests__/store/movieStore.test.ts`
8. If tests reference `refreshMovies`, update them.

**Verification Checklist:**

- [ ] Only one sync method exists in the store
- [ ] Favorites preservation behavior is configurable via options
- [ ] All call sites updated
- [ ] `npm run type-check` passes
- [ ] `npx jest __tests__/store/movieStore.test.ts` passes
- [ ] `npm test` passes (full suite)

**Commit Message Template:**

```text
refactor(store): consolidate syncMoviesWithAPI and refreshMovies

Merge near-identical methods into one with a preserveFavorites
option. Reduces duplication and ensures bug fixes apply once.
```

---

### Task 5: Fix vote_average column type in database schema

**Goal:** The `vote_average` column is declared as `INTEGER` but stores floating-point values (e.g., 7.8). SQLite truncates decimals on insert. This is MEDIUM finding #5.

**Files to Modify:**

- `src/database/schema.ts` - Change `vote_average INTEGER` to `vote_average REAL`, bump `CURRENT_DB_VERSION`
- `src/database/init.ts` - Add migration logic for version 1 to version 2

**Prerequisites:** None

**Implementation Steps:**

1. Read `src/database/schema.ts`. On line 23, change `vote_average INTEGER` to `vote_average REAL`.
2. Change `CURRENT_DB_VERSION` from `1` to `2` on line 120.
3. Read `src/database/init.ts` to understand the current initialization flow.
4. Add migration logic: when the stored database version is 1 and the target is 2, execute:
   ```sql
   ALTER TABLE movie_details RENAME COLUMN vote_average TO vote_average_old;
   ALTER TABLE movie_details ADD COLUMN vote_average REAL;
   UPDATE movie_details SET vote_average = CAST(vote_average_old AS REAL);
   -- SQLite doesn't support DROP COLUMN in older versions, but newer SQLite does
   ```
   Actually, SQLite's `ALTER TABLE` is limited. The implemented approach preserves favorites:
   ```sql
   -- Read favorite IDs before dropping
   SELECT id FROM movie_details WHERE favorite = 1;
   DROP TABLE IF EXISTS review_details;
   DROP TABLE IF EXISTS video_details;
   DROP TABLE IF EXISTS movie_details;
   -- Recreate all tables with new schema, then re-insert favorite stubs
   INSERT OR IGNORE INTO movie_details (id, ..., favorite) VALUES (?, ..., 1);
   ```
   This drops all cache tables (clearing orphaned video/review rows), then restores favorite flags as stub rows. The full movie data is re-fetched from the API on next sync.
5. Related cache tables (video_details, review_details) are also dropped to prevent orphaned rows.
6. Update `jest.setup.js` if the in-memory mock database schema includes `vote_average INTEGER`.
7. Run database tests: `npx jest __tests__/database/queries.test.ts`

**Verification Checklist:**

- [ ] `vote_average` declared as `REAL` in schema
- [ ] `CURRENT_DB_VERSION` incremented to 2
- [ ] Migration logic handles version 1 -> 2
- [ ] `jest.setup.js` mock schema updated if needed
- [ ] `npx jest __tests__/database/queries.test.ts` passes
- [ ] `npm test` passes

**Commit Message Template:**

```text
fix(database): change vote_average column from INTEGER to REAL

Floating-point ratings were being truncated on insert.
Bump DB version to 2 with migration that recreates the
movie_details cache table.
```

---

### Task 6: Replace individual AsyncStorage writes with multiSet in web storage

**Goal:** The `webInsertMovies` batch function fires N individual `setItem` calls in parallel instead of using `AsyncStorage.multiSet`. This is HIGH finding #5.

**Files to Modify:**

- `src/database/webStorage.ts` - Refactor batch write operations to use `multiSet`

**Prerequisites:** None

**Implementation Steps:**

1. Read `src/database/webStorage.ts` fully.
2. Find `webInsertMovies` (around lines 118-157). The current pattern fires individual `setItem` calls via `Promise.all`.
3. Refactor to collect all key-value pairs into an array and use `AsyncStorage.multiSet`:
   ```typescript
   const pairs: [string, string][] = [];
   // Collect movie entries
   for (const movie of movies) {
     pairs.push([`movie:${movie.id}`, JSON.stringify(movie)]);
   }
   // Collect index updates
   // ... build index arrays, then add index pairs
   await AsyncStorage.multiSet(pairs);
   ```
4. Apply the same pattern to any other batch write functions (check for similar patterns in video and review batch inserts).
5. Also fix the single `webInsertMovie` function (lines 64-113) which triggers 10 AsyncStorage operations. Collect all writes and use `multiSet`.
6. Add logging to `safeJsonParse` (around line 36) where the catch block currently swallows errors silently. Import `logWarn` from `../utils/errorHandler` and log a warning with the key that failed to parse.

**Verification Checklist:**

- [x] `webInsertMovies` uses `setMany` instead of individual `setItem` calls
- [x] `webInsertMovie` uses `setMany` for its writes
- [x] Similar batch functions for videos/reviews also updated
- [x] `safeJsonParse` logs a warning on parse failure
- [x] `npm run type-check` passes
- [x] `npm test` passes

**Commit Message Template:**

```text
fix(database): use AsyncStorage.multiSet for batch writes

Replace N individual setItem calls with single multiSet call
in web storage layer. Add warning logging to safeJsonParse.
```

---

### Task 7: Replace raw console calls with centralized logging in database init

**Goal:** `src/database/init.ts` uses 6 raw `console.log`/`console.error` calls instead of the centralized `logInfo`/`logError` from `errorHandler.ts`. This is MEDIUM finding #6.

**Files to Modify:**

- `src/database/init.ts` - Replace console calls with centralized logging

**Prerequisites:** None

**Implementation Steps:**

1. Read `src/database/init.ts` fully.
2. Import `logInfo`, `logError`, and `logWarn` from `../utils/errorHandler`.
3. Replace each `console.log(...)` with `logInfo(message, 'DatabaseInit')`.
4. Replace each `console.error(...)` with `logError(error, 'DatabaseInit')`.
5. Verify the logging functions accept the same argument patterns (string message, context string, optional metadata object).

**Verification Checklist:**

- [x] No raw `console.log` or `console.error` calls remain in `init.ts`
- [x] All logging goes through `logInfo`/`logError` from errorHandler
- [x] `npm run type-check` passes
- [x] `npm test` passes

**Commit Message Template:**

```text
fix(database): replace raw console calls with centralized logging

Use logInfo/logError from errorHandler.ts instead of console.log/error
in database initialization for consistent structured logging.
```

---

### Task 8: Unify theme colors

**Goal:** Theme colors are hardcoded in `app/_layout.tsx` while `src/constants/index.ts` defines a `COLORS` constant with overlapping but different values. This is MEDIUM finding #4.

**Files to Modify:**

- `app/_layout.tsx` - Import colors from constants instead of hardcoding

**Prerequisites:** None

**Implementation Steps:**

1. Read `app/_layout.tsx` and find the hardcoded theme colors (around lines 23-27).
2. Read `src/constants/index.ts` and find the `COLORS` constant (around lines 134-143).
3. Update the theme definition in `_layout.tsx` to import and use values from the `COLORS` constant.
4. If the color values differ between the two sources, use the `COLORS` constant values as the single source of truth (since the rest of the app uses `COLORS`). Adjust the theme to use `COLORS.PRIMARY`, `COLORS.SECONDARY`, etc.
5. Verify the app still renders correctly (visual check not strictly required, but type-check and tests should pass).

**Verification Checklist:**

- [x] No hardcoded hex color values in `_layout.tsx` theme definition
- [x] Theme uses `COLORS` from `src/constants/index.ts`
- [x] `npm run type-check` passes
- [x] `npm test` passes

**Commit Message Template:**

```text
fix(layout): use COLORS constant for theme instead of hardcoded values

Single source of truth for the color palette prevents
visual inconsistencies between theme and custom components.
```

## Phase Verification

After all tasks in this phase:

1. Run the full verification suite:
   ```bash
   npm run lint && npm run type-check && npm test
   ```
2. Verify key behavioral changes:
   - TMDb service methods return Zod-validated data (check return types)
   - YouTube service validates responses with Zod
   - Store has one sync method instead of two
   - Database schema declares `vote_average REAL`
3. Run coverage to ensure no regression: `npm run test:coverage`
