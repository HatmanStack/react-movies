# Audit Remediation Plan: react-movies

## Overview

This plan remediates findings from three audits conducted on 2026-03-25: a codebase health audit (22 findings across 4 severity levels), a 12-pillar evaluation (all 12 pillars below target score of 9), and a documentation drift audit (5 drift items, 3 gaps, 2 stale references, 1 config drift).

The codebase is an Expo Router app (React Native + web) that browses movies via the TMDb API, with SQLite/AsyncStorage persistence and Zustand state management. It is functional but carries significant dead scaffold code from the Expo template, several validate-then-discard anti-patterns, duplicated store logic, resource leaks, and outdated documentation.

Phases are sequenced: cleanup first (remove dead code and unused deps), then structural/code fixes, then guardrails (lint rules, hooks, CI), then documentation. Each phase is tagged with the implementer role that handles it.

## Prerequisites

- Node.js 24 (via nvm)
- `npm ci` to install dependencies
- A `.env` file with `EXPO_PUBLIC_TMDB_API_KEY` set (for running the app; tests mock this)
- Familiarity with: Expo Router, Zustand, Zod, expo-sqlite, AsyncStorage, Jest

## Phase Summary

| Phase | Tag | Goal | Token Estimate |
|-------|-----|------|----------------|
| 0 | -- | Foundation: architecture decisions, conventions, testing strategy | ~5k |
| 1 | [HYGIENIST] | Remove dead scaffold code, unused deps, unused exports | ~20k |
| 2 | [IMPLEMENTER] | Fix API validation, retry leak, store duplication, DB schema, performance | ~35k |
| 3 | [IMPLEMENTER] | Fix component/screen issues, improve tests | ~25k |
| 4 | [FORTIFIER] | Add pre-commit hooks, env validation, conventional commits enforcement | ~15k |
| 5 | [DOC-ENGINEER] | Fix README, CLAUDE.md, app.json; add .env.example | ~10k |

## Navigation

- [Phase-0.md](./Phase-0.md) - Foundation (applies to all phases)
- [Phase-1.md](./Phase-1.md) - [HYGIENIST] Dead code and dependency cleanup
- [Phase-2.md](./Phase-2.md) - [IMPLEMENTER] Core code fixes (API, store, database, retry)
- [Phase-3.md](./Phase-3.md) - [IMPLEMENTER] Component/screen fixes and test improvements
- [Phase-4.md](./Phase-4.md) - [FORTIFIER] Guardrails (hooks, env validation, CI)
- [Phase-5.md](./Phase-5.md) - [DOC-ENGINEER] Documentation fixes
- [feedback.md](./feedback.md) - Review feedback tracking
