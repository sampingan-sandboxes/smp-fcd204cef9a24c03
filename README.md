# Project Brief — Cognito Authentication Module

This project is a self-contained slice of a production serverless backend. The goal of
this engagement is to build its authentication layer.

## Scope of work

Implement these skeleton files (currently throwing `NotImplemented`):

- `src/components/auth/verifyToken.ts` — verifier + header helpers
- `src/components/auth/handlers/me.ts` — the `GET /me` handler

The full contract is documented in:

- [docs/requirements.md](docs/requirements.md) — context and functional requirements
- [docs/specifications.md](docs/specifications.md) — exact API + behavior table
- [docs/flow-diagram.md](docs/flow-diagram.md) — use-case / sequence / decision diagrams
- [docs/features/](docs/features/) — the executable acceptance scenarios (Gherkin)

## Getting started

```bash
npm install
npm test               # runs the acceptance suites (they fail until you implement)
```

| Command | Purpose |
|---------|---------|
| `npm run dev` | Boots the service locally with serverless-offline (`GET /health`, `GET /me`) |
| `npm test` | Runs all tests, including the jest-cucumber acceptance suites |
| `npm run test:coverage` | Runs tests with coverage |
| `npm run lint` / `npm run typecheck` | Should both pass cleanly |

`.env.test` already contains safe test values for the two Cognito variables. Real values
are only needed if you exercise `npm run dev` against a live pool.

## Definition of done

1. **All acceptance scenarios pass.** The suites under
   `tests/` execute the Gherkin features in `docs/features/`
   against your code. Please leave the feature files and the step definitions alone.
2. **Ship the module with its own tests.** Add unit tests (`*.test.ts`, anywhere under
   `src/`) that you would ship with this module, and aim for solid coverage of the code
   you write — `npm run test:coverage` reports where you stand.
3. **Keep the public surface and file paths exactly as given,** so the module plugs
   straight into the wider codebase — renamed files, moved exports, or changed signatures
   won't fit.
4. **Please don't modify provided files** — configs, docs, acceptance suites, `src/base/**`,
   `src/interfaces/**`, and anything marked "Provided … — do not modify". Everything else
   under `src/components/auth/` is yours.
5. **No new runtime dependencies** unless there's a clear reason (note it in your handover).
   Dev-dependencies for testing are fine.
6. `npm run lint` and `npm run typecheck` should pass with zero errors.

## Delivery

Push the sandbox to a repository and share access, or send it as a zip (without
`node_modules/`), including a short note on any decisions or trade-offs you made.
