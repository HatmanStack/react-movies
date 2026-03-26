# Phase 0: Foundation

This phase defines architecture decisions, conventions, and strategies that apply across all implementation phases.

## Architecture Decisions

### ADR-1: Delete dead code before fixing live code

Removing the Expo template scaffold (12+ files) first prevents wasted effort fixing lint/type issues in files that will be deleted. It also makes knip and TypeScript output cleaner for subsequent phases.

### ADR-2: Use Zod parse return values directly

The current pattern fetches as `unknown`, calls `schema.parse(data)` for validation, discards the return value, and casts the original `data`. The fix is to return the Zod parse result directly. This gives us validated AND typed data in one step.

### ADR-3: Keep platform branching in queries.ts (do not split into .web.ts/.native.ts)

The eval suggested Metro platform extensions. However, the branching is limited to a few functions and the current pattern is well-established. Splitting would increase file count and complexity for marginal benefit. YAGNI.

### ADR-4: Consolidate store methods, do not extract to service layer

The `syncMoviesWithAPI` and `refreshMovies` duplication should be consolidated into a single parameterized method within the store. Extracting `loadMovieDetails` from the details screen into the store is a separate concern.

### ADR-5: No new dependencies

All fixes use existing libraries. No new npm packages should be added except for Phase 4 guardrails (husky, lint-staged, commitlint), which are dev dependencies.

## Shared Conventions

### File organization

- Source code: `src/` with subdirectories `api/`, `components/`, `constants/`, `database/`, `models/`, `store/`, `utils/`, `validation/`
- App routes: `app/` (Expo Router file-based routing)
- Tests: `__tests__/` mirroring `src/` structure
- Path alias: `@/*` maps to project root

### Import style

- Use `@/` alias for cross-directory imports
- Relative imports within the same directory
- Group: external deps, then `@/` imports, then relative imports

### Error handling

- Use `logInfo`/`logError`/`logWarn` from `src/utils/errorHandler.ts` instead of raw `console.log`/`console.error`
- Use custom error classes (`APIError`, `NetworkError`) from `src/api/errors.ts`
- Wrap API responses with Zod validation; use the parse return value

## Testing Strategy

### Framework

- Jest with `jest-expo` preset
- React Native Testing Library for component tests
- Tests in `__tests__/` directory, mirroring source structure

### Mocking

- `jest.setup.js` provides mocks for expo-sqlite (in-memory), NetInfo, AsyncStorage, Reanimated, expo-router
- Component tests must wrap renders in `<PaperProvider>` from react-native-paper
- API tests mock `global.fetch`

### Running tests

```bash
npm test                    # All tests
npx jest path/to/test       # Single file
npm run test:coverage       # With coverage report
```

### Coverage

- 80% threshold enforced in jest.config.js
- When modifying existing code, ensure tests still pass
- When fixing placeholder tests (e.g., `expect(true).toBe(true)`), write real assertions

## Commit Message Format

Use conventional commits:

```text
type(scope): description
```

Types: `fix`, `refactor`, `chore`, `test`, `docs`, `ci`

Scopes: `scaffold`, `api`, `store`, `database`, `retry`, `components`, `tests`, `ci`, `docs`

Examples:

- `chore(scaffold): remove dead Expo template files`
- `fix(api): use Zod parse return values in TMDb service`
- `refactor(store): consolidate syncMoviesWithAPI and refreshMovies`
- `test(components): replace placeholder assertions in MovieCard tests`

## Verification Commands

After each task, run:

```bash
npm run lint          # ESLint passes
npm run type-check    # TypeScript passes
npm test              # All tests pass
```
