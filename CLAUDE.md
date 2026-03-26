# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm install                # Install dependencies
npx expo start             # Start dev server (a=Android, i=iOS, w=Web)
npx expo start --web       # Web only
npm test                   # Run all tests
npm run test:coverage      # Tests with coverage report
npx jest path/to/test      # Run a single test file
npx jest --testPathPattern="MovieCard"  # Run tests matching pattern
npm run lint               # ESLint
npm run type-check         # TypeScript strict checking
npm run format             # Prettier formatting
```

## Architecture

**Expo Router (file-based routing)** in `/app/`:

- `/app/index.tsx` — Home screen (movie grid with infinite scroll)
- `/app/details/[id].tsx` — Movie details (trailers, reviews)
- `/app/_layout.tsx` — Root layout with React Native Paper theme, ErrorBoundary, env validation, and NetInfo init
- `/app/+html.tsx` — Custom HTML wrapper for web builds

**State management**: Zustand stores in `/src/store/`:

- `movieStore.ts` — Movie data, pagination, offline mode, favorites (optimistic updates, AbortController cancellation, consolidated `syncMoviesWithAPI` with `preserveFavorites` option)
- `filterStore.ts` — Filter toggles (Popular, Top Rated, Favorites)

**API layer** in `/src/api/`:

- `tmdb.ts` — TMDb API with retry logic (3 attempts, exponential backoff) and Zod validation (parse return values used directly)
- `youtube.ts` — YouTube trailer thumbnails with Zod safeParse validation and graceful fallback
- `errors.ts` — Typed error classes (APIError, NetworkError, DatabaseError)
- `types.ts` — Raw API response interfaces for TMDb and YouTube

**Database layer** in `/src/database/`:

- Platform-aware: expo-sqlite on native, AsyncStorage on web
- `schema.ts` — Table definitions (`movie_details`, `video_details`, `review_details`), `CURRENT_DB_VERSION` (currently 2)
- `queries.ts` — Type-safe query functions with batch operations and transactions (native). Filters out empty stub rows from migration.
- `init.ts` — Database initialization, version tracking, and migration logic (preserves favorites during schema upgrades, clears orphaned video/review rows)
- `webStorage.ts` — Indexed AsyncStorage layer with `setMany` batch writes and `safeJsonParse` with warning logging

**Validation**: Zod schemas in `/src/validation/schemas.ts` validate all API responses.

**Utilities** in `/src/utils/`:

- `envValidation.ts` — Validates required environment variables at startup (exports `EnvConfig` interface)
- `errorHandler.ts` — Structured logging (`logInfo`, `logError`, `logWarn`), error formatting (exports `FormattedError` interface), Sentry-compatible tracker interface
- `retry.ts` — Exponential backoff with jitter, abort-aware sleep with proper listener cleanup
- `mappers.ts` — Data transformation between API responses and domain models, configurable concurrency for thumbnail fetching
- `seo.ts` — Dynamic meta tags and JSON-LD structured data (web only)

**Models** in `/src/models/types.ts` — Domain model interfaces (MovieDetails, VideoDetails, ReviewDetails)

**Constants** in `/src/constants/index.ts` — Centralized app constants including COLORS (single source of truth for theme)

## Key Patterns

- **Path alias**: `@/*` maps to project root (configured in tsconfig.json)
- **Platform branching**: `Platform.OS === 'web'` checks throughout database layer
- **Offline support**: `initNetworkListener()` called from `_layout.tsx` with cleanup; triggers offline mode with cached data
- **Env validation**: `validateEnvironment()` runs at module scope in `_layout.tsx`; missing TMDB key surfaces via ErrorBoundary
- **Components use React Native Paper** (Material Design 3) — wrap test renders in `<PaperProvider>`
- **expo-image** with blurhash placeholders and memory-disk caching policy
- **SEO** (web only): Dynamic meta tags, JSON-LD structured data
- **AbortController**: Used throughout for request cancellation; `handleRefresh` aborts prior in-flight request before starting new one
- **Pre-commit hooks**: husky + lint-staged runs ESLint and Prettier on staged files; commitlint enforces conventional commits

## Testing

- Jest with `jest-expo` preset, 80% coverage threshold configured (current coverage ~51%)
- Tests in `/__tests__/` mirror src structure: `api/`, `components/`, `database/`, `store/`, `integration/`, `unit/`
- `jest.setup.js` mocks expo-sqlite, NetInfo, AsyncStorage (including `setMany`/`getMany`), reanimated, expo-router
- Component tests use React Native Testing Library with PaperProvider wrapper
- Memoization tests use `$$typeof` checks against `Symbol.for('react.memo')`

## Environment

Requires `.env` (copy from `.env.example`):

```text
EXPO_PUBLIC_TMDB_API_KEY=<tmdb_api_key>          # required
EXPO_PUBLIC_YOUTUBE_API_KEY=<youtube_api_key>     # optional, falls back to default thumbnails
```

Node.js 20+ required (`engines` field in package.json). CI uses Node.js 24.

## CI

GitHub Actions (`.github/workflows/ci.yml`): lint -> type-check -> test -> codecov upload on all branches. Dependabot configured for automated dependency updates.
