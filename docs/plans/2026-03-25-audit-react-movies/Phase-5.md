# Phase 5: [DOC-ENGINEER] Documentation Fixes

## Phase Goal

Fix all documentation drift, gaps, and stale references found in the doc audit. Add `.env.example` for reproducibility. Update CLAUDE.md to reflect codebase changes from Phases 1-4.

**Success criteria:**

- README has correct clone URL, path, prerequisites, and build instructions
- `.env.example` exists with placeholder values
- CLAUDE.md reflects the actual file structure (no references to deleted scaffold)
- app.json has correct githubUrl and no placeholder owner
- No broken or misleading references in any documentation

**Estimated tokens:** ~10k

## Prerequisites

- Phases 1-4 complete (code changes that affect documentation)
- Familiarity with Phase 0 conventions

## Tasks

### Task 1: Fix README.md

**Goal:** The README has 5 issues from the doc audit: wrong clone URL, wrong path, deprecated expo-cli reference, misleading feature description, and wrong .env location.

**Files to Modify:**

- `README.md` - Rewrite the Building section and fix feature description

**Prerequisites:** Phase 4 Task 4 (engines field, for correct Node version reference)

**Implementation Steps:**

1. Read the current `README.md`.
2. Fix the following:

   **Line 21 - Feature description:**
   - Change "Browse popular movies and top-rated TV shows" to something accurate. The app fetches popular movies via `/discover/movie` and top-rated content via `/discover/tv`. A clear description: "Browse popular movies and top-rated TV shows" is actually close enough, but clarify if needed based on filter store behavior.

   **Lines 42-46 - Building section:**
   - Change prerequisites from "Node.js (18+)" to "Node.js (20+)" to match the `engines` field added in Phase 4.
   - Remove the `npm install -g expo-cli` instruction. Modern Expo uses `npx expo` (no global install needed).
   - Change clone URL from `https://github.com/HatmanStack/android-movies.git` to `https://github.com/HatmanStack/react-movies.git`.
   - Change navigate step from `cd android-movies/Migration/expo-project` to `cd react-movies`.
   - Change `.env` location from "in the `expo-project` root directory" to "in the project root directory".

3. The rewritten Building section should look like:

   ````markdown
   ## Building

   1.  **Prerequisites:** Node.js (20+) and npm.
   2.  **Clone:** `git clone https://github.com/HatmanStack/react-movies.git`
   3.  **Navigate:** `cd react-movies`
   4.  **Install:** `npm install`
   5.  **API Keys:** Copy `.env.example` to `.env` and fill in your API keys:
       ```env
       EXPO_PUBLIC_TMDB_API_KEY=your_tmdb_api_key_here
       EXPO_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key_here
       ```
   6.  **Run:** `npx expo start` and scan the QR code with the Expo Go app, or press `w` for web.
   ````

**Verification Checklist:**

- [ ] Clone URL is `react-movies.git`
- [ ] Navigate step is `cd react-movies`
- [ ] No reference to `expo-cli` global install
- [ ] Node.js version matches `engines` field in package.json
- [ ] .env location says "project root" not "expo-project root"
- [ ] Building instructions reference `.env.example`

**Commit Message Template:**

```text
docs(readme): fix clone URL, prerequisites, and build instructions

Correct repository URL, remove deprecated expo-cli reference,
fix directory paths, and update Node.js version requirement.
```

---

### Task 2: Create .env.example

**Goal:** No `.env.example` exists, making it hard for new contributors to know which environment variables are needed. This was flagged in both the eval (Reproducibility) and doc audit.

**Files to Create:**

- `.env.example` - Template with placeholder values

**Prerequisites:** None

**Implementation Steps:**

1. Create `.env.example` with:

   ```env
   # Required: TMDb API key (get one at https://www.themoviedb.org/settings/api)
   EXPO_PUBLIC_TMDB_API_KEY=your_tmdb_api_key_here

   # Optional: YouTube API key for trailer thumbnails
   # Falls back to default thumbnails if not set
   EXPO_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key_here
   ```

2. Verify `.env.example` is NOT in `.gitignore` (it should be committed, unlike `.env`).

**Verification Checklist:**

- [ ] `.env.example` exists at project root
- [ ] Contains both API key placeholders with comments
- [ ] Is NOT listed in `.gitignore`
- [ ] README references it in the Building section

**Commit Message Template:**

```text
docs: add .env.example with API key placeholders

Provide a template so new contributors know which
environment variables to configure.
```

---

### Task 3: Update CLAUDE.md to reflect codebase changes

**Goal:** CLAUDE.md references the scaffold code that was deleted in Phase 1 (via the route listing) and is missing information about supporting files. Update it to reflect the current state.

**Files to Modify:**

- `CLAUDE.md` (project root) - Update Architecture section

**Prerequisites:** Phases 1-4 complete

**Implementation Steps:**

1. Read the current `CLAUDE.md`.
2. Update the Architecture section:
   - The route listing should only show the active routes: `app/index.tsx`, `app/details/[id].tsx`, `app/_layout.tsx`, `app/+html.tsx`.
   - Remove any mention of `(tabs)` routes if present.
   - Add a note about `src/utils/envValidation.ts` (added in Phase 4).
   - Mention that the ErrorBoundary is wired into `_layout.tsx`.
3. Update Key Patterns if any patterns changed (e.g., consolidated store method).
4. Update Build & Development Commands if any changed.
5. Do NOT add exhaustive file-by-file documentation. CLAUDE.md is a quick reference, not a full API doc.

**Verification Checklist:**

- [ ] No references to deleted scaffold files
- [ ] Route listing matches actual app routes
- [ ] Architecture section reflects Phase 1-4 changes
- [ ] File is concise and accurate

**Commit Message Template:**

```text
docs(claude): update CLAUDE.md to reflect audit remediation

Remove references to deleted scaffold code. Update
architecture section for consolidated store and new
env validation.
```

---

### Task 4: Fix app.json stale references

**Goal:** `app.json` has a placeholder owner and wrong githubUrl. The owner placeholder was noted as stale in the doc audit. The githubUrl was fixed conceptually in Phase 1 Task 5 but verify it here.

**Files to Modify:**

- `app.json` - Verify/fix remaining issues

**Prerequisites:** Phase 1 Task 5 (may have already fixed githubUrl)

**Implementation Steps:**

1. Read `app.json`.
2. Verify `"githubUrl"` is `"https://github.com/HatmanStack/react-movies"`. If Phase 1 already fixed this, no change needed.
3. Verify `"owner"` field: if it still says `"your-expo-username"`, remove the field entirely. The owner field is only needed for Expo Application Services (EAS) and a placeholder value is worse than no value.
4. If both are already correct from Phase 1, skip this task.

**Verification Checklist:**

- [ ] No placeholder values in app.json
- [ ] githubUrl points to correct repository
- [ ] `npm run lint` passes

**Commit Message Template:**

```text
docs(config): verify app.json references are correct

Ensure githubUrl and owner field are accurate after
Phase 1 cleanup.
```

## Phase Verification

After all tasks in this phase:

1. Run the full verification suite:
   ```bash
   npm run lint && npm run type-check && npm test
   ```
2. Verify documentation accuracy:
   - README clone URL matches actual repo
   - `.env.example` exists and has correct variable names
   - CLAUDE.md route listing matches `ls app/*.tsx app/**/*.tsx`
   - app.json has no placeholder values
3. Read through README start-to-finish as a new contributor would. The instructions should work without any undocumented steps.
