# Module Specification — auth

## Files & public API

### `src/components/auth/verifyToken.ts`
```ts
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import type { AuthenticatedUser } from '../../interfaces/auth';

export async function verifyAuthHeader(authHeader: string | undefined): Promise<AuthenticatedUser>;
export function getAuthHeader(event: Pick<APIGatewayProxyEventV2, 'headers'>): string | undefined;
export async function getAuthenticatedUserId(event: Pick<APIGatewayProxyEventV2, 'headers'>): Promise<string | null>;
```

### `src/components/auth/handlers/me.ts`
```ts
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
export const handler: APIGatewayProxyHandlerV2;
```

## Provided (do not modify)

| File | What it gives you |
|------|-------------------|
| `src/interfaces/auth.ts` | `AuthenticatedUser { sub; email?; emailVerified?; name?; picture? }` |
| `src/base/http.ts` | `jsonResponse(statusCode, body)` → `{ statusCode, headers, body: JSON.stringify(body) }` |
| `src/base/handlers/health.ts` | Unrelated `GET /health` handler (kept so `npm run dev` boots) |

## Environment

| Variable | Used for |
|----------|----------|
| `COGNITO_USER_POOL_ID` | `CognitoJwtVerifier.create({ userPoolId })` |
| `COGNITO_APP_CLIENT_ID` | `CognitoJwtVerifier.create({ clientId })` |

`.env.test` supplies test values (`ap-southeast-1_testPool123`, `test-app-client-id`).

## Behavioral contract

| # | Rule |
|---|------|
| A-1 | Verifier created once, `{ userPoolId, tokenUse: 'id', clientId }`, reused across calls |
| A-2 | Missing/empty/non-`"Bearer "` header → throws `Error`, verifier NOT called |
| A-3 | `"Bearer "` prefix stripped; exact remaining string passed to `verify()` |
| A-4 | `"Bearer "` + empty token still calls `verify('')` |
| A-5 | Verifier rejection propagates unchanged (same error identity) |
| A-6 | Result has exactly keys `sub, email, emailVerified, name, picture` |
| A-7 | `email`/`name`/`picture` present only if the claim is a string, else `undefined` |
| A-8 | `emailVerified` present only if `email_verified` is a boolean, else `undefined` |
| A-9 | `getAuthHeader` prefers `authorization`, falls back to `Authorization`, else `undefined` |
| A-10 | `getAuthenticatedUserId` returns `sub` on success, `null` on any failure, never throws |
| A-11 | `getAuthenticatedUserId` with no header returns `null` without calling the verifier |
| A-12 | `GET /me` → `200 { user }` on success |
| A-13 | `GET /me` → `401 { message: 'Unauthorized' }` on any failure; body never leaks the reason |

## Acceptance

Scenarios in [features/verify-token.feature](features/verify-token.feature) and
[features/me-endpoint.feature](features/me-endpoint.feature) run via the jest-cucumber
suites under `tests/`. They mock `aws-jwt-verify`, so no real
Cognito pool is required.
