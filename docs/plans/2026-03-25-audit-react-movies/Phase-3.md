# Phase 3: [IMPLEMENTER] Component/Screen Fixes and Test Improvements

## Phase Goal

Fix component-level issues (hardcoded URLs, triple useEffect firing, NetInfo global subscription), wire the ErrorBoundary into the app, add concurrency limits, and replace placeholder tests with real assertions.

**Success criteria:**

- MovieCard uses `TMDbService.getPosterUrl()` instead of hardcoded URL
- Home screen does not fire 3-4 concurrent database reads on mount
- NetInfo subscription is managed within the store (not at module scope)
- ErrorBoundary wired into `_layout.tsx`
- Thumbnail fetching has a concurrency limiter
- All `expect(true).toBe(true)` placeholder tests replaced with real assertions
- Integration tests that never render components are rewritten or recategorized
- All tests pass

**Estimated tokens:** ~25k

## Prerequisites

- Phase 2 complete (store consolidation, API fixes done)
- Familiarity with Phase 0 conventions

## Tasks

### Task 1: Replace hardcoded poster URL in MovieCard

**Goal:** `MovieCard.tsx` line 42 hardcodes `https://image.tmdb.org/t/p/w342${poster_path}` instead of using `TMDbService.getPosterUrl()`. This is MEDIUM finding #3 and a quick win.

**Files to Modify:**

- `src/components/MovieCard.tsx` - Replace hardcoded URL with `TMDbService.getPosterUrl()`

**Prerequisites:** None

**Implementation Steps:**

1. Read `src/components/MovieCard.tsx`.
2. Find the hardcoded poster URL construction (around line 42).
3. Import `TMDbService` from `../api/tmdb`.
4. Replace the hardcoded string template with `TMDbService.getPosterUrl(poster_path)`.
5. Note: `getPosterUrl` defaults to 'MEDIUM' size. Check `IMAGE_SIZES.POSTER.MEDIUM` in `src/constants/index.ts` to confirm the size matches `w342`. If it does not match exactly, pass the appropriate size parameter.
6. Run MovieCard tests: `npx jest __tests__/components/MovieCard.test.tsx`

**Verification Checklist:**

- [x] No hardcoded `image.tmdb.org` URL in MovieCard
- [x] Uses `TMDbService.getPosterUrl()` for poster URL construction
- [x] `npm run type-check` passes
- [x] `npx jest __tests__/components/MovieCard.test.tsx` passes

**Commit Message Template:**

```text
fix(components): use TMDbService.getPosterUrl in MovieCard

Replace hardcoded TMDb image URL with the centralized
poster URL method for consistency with details screen.
```

---

### Task 2: Fix triple useEffect firing on home screen mount

**Goal:** Three separate effects in `app/index.tsx` all call `loadMoviesFromFilters` on initial render, causing 3-4 concurrent database reads. This is HIGH finding #6.

**Files to Modify:**

- `app/index.tsx` - Consolidate the mount/filter/focus effects

**Prerequisites:** Phase 2 Task 4 (store consolidation, since `syncMoviesWithAPI` signature may have changed)

**Implementation Steps:**

1. Read `app/index.tsx` fully.
2. The three effects are:
   - **Mount effect** (line 56): calls `loadMoviesFromFilters`, then conditionally `syncMoviesWithAPI`
   - **Filter change effect** (line 81): calls `loadMoviesFromFilters` when filter toggles change
   - **Focus effect** (line 91): calls `loadMoviesFromFilters` when screen gains focus
3. The problem: on initial render, all three fire simultaneously.
4. Solution approach:
   - The mount effect should handle initial data load and API sync. Keep this.
   - The filter change effect should skip the initial render (use a ref to track if it is the first render). On subsequent filter changes, reload.
   - The focus effect should skip if the screen is already in focus from mount. Use a ref to track whether this is the initial focus event.
5. Implementation pattern for skipping initial render:

   ```typescript
   const isInitialMount = useRef(true);

   // Filter change effect - skip initial render
   useEffect(() => {
     if (isInitialMount.current) {
       isInitialMount.current = false;
       return;
     }
     const controller = new AbortController();
     const activeFilters = getActiveFilters();
     loadMoviesFromFilters(activeFilters, controller.signal);
     return () => controller.abort();
   }, [
     showPopular,
     showTopRated,
     showFavorites,
     getActiveFilters,
     loadMoviesFromFilters,
   ]);
   ```

6. For the focus effect, consider whether it is truly needed. If the mount effect and filter effect already cover the use cases, the focus effect may be redundant. If it IS needed (e.g., returning from details screen after toggling a favorite), keep it but skip it during the initial mount.
7. Run tests to verify no regressions.

**Verification Checklist:**

- [x] Only one database read happens on initial mount
- [x] Filter changes still trigger a reload
- [x] Screen focus still triggers a reload (if kept)
- [x] Initial render does not fire redundant loads
- [x] `npm run type-check` passes
- [x] `npm test` passes

**Commit Message Template:**

```text
fix(home): prevent triple database read on initial mount

Skip initial render in filter-change and focus effects.
Only the mount effect handles first load.
```

---

### Task 3: Move NetInfo subscription into store initialization

**Goal:** `NetInfo.addEventListener` is called at module scope in `movieStore.ts`, creating a global subscription with no unsubscribe mechanism. This causes side effects on import in test/SSR environments. This is MEDIUM finding #2.

**Files to Modify:**

- `src/store/movieStore.ts` - Move NetInfo subscription into an initialization function

**Prerequisites:** Phase 2 Task 4 (store changes)

**Implementation Steps:**

1. Read the end of `src/store/movieStore.ts` (around lines 492-496) where `NetInfo.addEventListener` is called at module scope.
2. Move the subscription into a function, e.g., `initNetworkListener()`, that returns an unsubscribe function.
3. Export this function so it can be called from the app's entry point.
4. In `app/_layout.tsx`, call `initNetworkListener()` in a `useEffect` with cleanup:
   ```typescript
   useEffect(() => {
     const unsubscribe = initNetworkListener();
     return unsubscribe;
   }, []);
   ```
5. This prevents the subscription from running on import (which happens in tests and SSR).
6. Check `jest.setup.js` for any NetInfo mock setup that may need adjustment.

**Verification Checklist:**

- [x] No `NetInfo.addEventListener` call at module scope
- [x] Network listener initialized from `_layout.tsx` with cleanup
- [x] Tests do not trigger NetInfo subscription on import
- [x] `npm run type-check` passes
- [x] `npm test` passes

**Commit Message Template:**

```text
fix(store): move NetInfo subscription into explicit init function

Prevents side effects on module import. Subscription is now
initialized from _layout.tsx with proper cleanup.
```

---

### Task 4: Wire ErrorBoundary into app layout

**Goal:** `src/components/ErrorBoundary.tsx` exists but is not used. Wire it into the root layout to catch rendering errors. This was flagged in the eval's Creativity remediation.

**Files to Modify:**

- `app/_layout.tsx` - Wrap the app's content in ErrorBoundary

**Prerequisites:** Task 3 (since we are modifying `_layout.tsx`)

**Implementation Steps:**

1. Read `src/components/ErrorBoundary.tsx` to understand its props and behavior.
2. Read `app/_layout.tsx` to find where to insert the ErrorBoundary.
3. Import `ErrorBoundary` from `@/src/components/ErrorBoundary`.
4. Wrap the main content (the `<Slot />` or `<Stack />` component) with `<ErrorBoundary>`.
5. If ErrorBoundary accepts a fallback prop, provide a reasonable fallback UI.

**Verification Checklist:**

- [x] ErrorBoundary wraps the root app content in `_layout.tsx`
- [x] `npm run type-check` passes
- [x] `npm test` passes

**Commit Message Template:**

```text
fix(layout): wire ErrorBoundary into root layout

Catch unhandled rendering errors at the app level instead
of showing a white screen.
```

---

### Task 5: Add concurrency limiter to thumbnail fetching

**Goal:** `Promise.all(thumbnailPromises)` in `src/utils/mappers.ts` fires unbounded parallel YouTube API requests. This is a critical failure point from the stress evaluation.

**Files to Modify:**

- `src/utils/mappers.ts` - Add concurrency limiting to thumbnail fetches

**Prerequisites:** None

**Implementation Steps:**

1. Read `src/utils/mappers.ts`, focusing on the thumbnail fetching section (around lines 114-118).
2. Implement a simple concurrency limiter without adding a dependency. A basic pattern:
   ```typescript
   async function mapWithConcurrency<T, R>(
     items: T[],
     fn: (item: T) => Promise<R>,
     concurrency: number,
   ): Promise<R[]> {
     const results: R[] = [];
     let index = 0;
     const workers = Array.from(
       { length: Math.min(concurrency, items.length) },
       async () => {
         while (index < items.length) {
           const i = index++;
           results[i] = await fn(items[i]);
         }
       },
     );
     await Promise.all(workers);
     return results;
   }
   ```
3. Replace the `Promise.all(thumbnailPromises)` call with the concurrency-limited version, using a limit of 3-5 concurrent requests.
4. Place the concurrency helper in the same file (private function) or in `src/utils/` if it could be reused.

**Verification Checklist:**

- [x] Thumbnail fetches are limited to a fixed concurrency (e.g., 5)
- [x] Results are still in the correct order
- [x] `npm run type-check` passes
- [x] `npm test` passes

**Commit Message Template:**

```text
fix(mappers): limit concurrent thumbnail fetches

Cap parallel YouTube API requests at 5 to prevent
overwhelming the API under high video counts.
```

---

### Task 6: Replace placeholder tests with real assertions

**Goal:** Two test files contain `expect(true).toBe(true)` placeholder assertions. Replace them with meaningful tests. This is a red flag from the Day 2 evaluation.

**Files to Modify:**

- `__tests__/components/MovieCard.test.tsx` - Replace placeholder at line ~139
- `__tests__/components/VideoCard.test.tsx` - Replace placeholder at line ~113

**Prerequisites:** Task 1 (MovieCard changes)

**Implementation Steps:**

1. Read `__tests__/components/MovieCard.test.tsx` fully.
2. Find the test around line 127-141 labeled "memoization prevents unnecessary re-renders" (or similar). It currently asserts `expect(true).toBe(true)`.
3. Replace with a real memoization test:
   - Render the component with a set of props
   - Re-render with the same props
   - Assert that the component did not re-render (use `React.memo`'s behavior). One approach: mock a child component or use `jest.fn()` as a render callback, then verify call count.
   - If memoization testing is impractical with the current component structure, replace with a different meaningful assertion (e.g., test that the component renders the correct poster URL, test interaction behavior).
4. Read `__tests__/components/VideoCard.test.tsx` fully.
5. Find the placeholder test around line 113 and replace similarly.
6. Run both test files.

**Verification Checklist:**

- [x] No `expect(true).toBe(true)` anywhere in the test suite
- [x] Replacement tests assert real component behavior
- [x] `npx jest __tests__/components/MovieCard.test.tsx` passes
- [x] `npx jest __tests__/components/VideoCard.test.tsx` passes

**Commit Message Template:**

```text
test(components): replace placeholder assertions with real tests

Remove expect(true).toBe(true) from MovieCard and VideoCard
tests. Add meaningful assertions for component behavior.
```

---

### Task 7: Fix integration tests that never render components

**Goal:** `__tests__/integration/movieFlow.test.tsx` has tests that call `useMovieStore.setState()` and read state back without ever rendering a component. These should be recategorized or rewritten.

**Files to Modify:**

- `__tests__/integration/movieFlow.test.tsx` - Either add rendering or move to unit tests

**Prerequisites:** Phase 2 Task 4 (store consolidation may affect these tests)

**Implementation Steps:**

1. Read `__tests__/integration/movieFlow.test.tsx` fully.
2. Identify which tests never render a component (the Day 2 eval says lines 126-144 have two such tests).
3. Option A (preferred): Rewrite these as actual integration tests that render a screen component, trigger user interactions, and verify the result. Use `<PaperProvider>` wrapper.
4. Option B: If the tests are genuinely testing store behavior in isolation, move them to `__tests__/store/` or `__tests__/unit/` and rename appropriately. Integration tests should involve multiple layers (component + store + mock API).
5. If rewriting as integration tests is too complex for this phase, go with Option B and add a comment noting that real screen-level integration tests are a future improvement.

**Verification Checklist:**

- [x] Tests in `movieFlow.test.tsx` either render components or are moved to unit tests
- [x] Test descriptions accurately describe what is being tested
- [x] `npm test` passes

**Commit Message Template:**

```text
test(integration): recategorize store-only tests from movieFlow

Move state-manipulation-only tests to unit test directory.
Integration tests should involve component rendering.
```

## Phase Verification

After all tasks in this phase:

1. Run the full verification suite:
   ```bash
   npm run lint && npm run type-check && npm test
   ```
2. Run coverage report: `npm run test:coverage`
3. Verify no `expect(true).toBe(true)` remains:
   ```bash
   grep -r "expect(true).toBe(true)" __tests__/
   ```
4. Verify no hardcoded TMDb image URLs in components:
   ```bash
   grep -r "image.tmdb.org" src/components/
   ```
