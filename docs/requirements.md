# Requirements — Cognito Authentication Module

## Context

This is the authentication layer of a serverless (AWS Lambda) backend fronted by an AWS
API Gateway **HTTP API v2**. Users sign in through Amazon Cognito (Google federated
identity) on the frontend and call the backend with the Cognito-issued **ID token** in
the `Authorization: Bearer <token>` header.

Every protected Lambda handler authenticates the caller through this module. You will
implement:

- `src/components/auth/verifyToken.ts` — the verifier + header helpers
- `src/components/auth/handlers/me.ts` — the `GET /me` handler that returns the caller

Token verification uses the [`aws-jwt-verify`](https://github.com/awslabs/aws-jwt-verify)
library's `CognitoJwtVerifier`, which validates the JWT signature against the pool's JWKS,
checks expiry, and confirms `token_use` and `client_id`.

## Functional requirements

### FR-1 — Verifier construction
- Create the `CognitoJwtVerifier` **once** at module load, configured with
  `userPoolId = COGNITO_USER_POOL_ID`, `tokenUse = 'id'`, `clientId = COGNITO_APP_CLIENT_ID`.
- Reuse it across every request — never reconstruct per call. It must not be constructed
  more than once even across many `verifyAuthHeader` calls, and constructing it must not
  depend on a request arriving.

### FR-2 — `verifyAuthHeader(authHeader)`
- If `authHeader` is `undefined`, empty, or does not start with the exact prefix
  `"Bearer "` (case-sensitive, with the trailing space), reject with an `Error` **without
  calling the verifier**.
  - Note: `"Bearer "` with an empty token after it is still forwarded to the verifier
    (the verifier decides). Only the prefix gates the call.
- Otherwise, strip `"Bearer "` and pass the rest to `verifier.verify(token)`.
- If the verifier rejects, propagate its rejection **unchanged** (same error object).
- On success, return an `AuthenticatedUser`:
  - `sub`: the verified `sub` claim (always present).
  - `email`, `name`, `picture`: included only when the claim is a **string**; otherwise
    `undefined`.
  - `emailVerified`: from the `email_verified` claim, included only when it is a
    **boolean**; otherwise `undefined`.
  - No other JWT claims (`iss`, `aud`, `exp`, `token_use`, …) may appear on the result.

### FR-3 — `getAuthHeader(event)`
- Return `event.headers.authorization` when present, else `event.headers.Authorization`,
  else `undefined`. Prefer the lowercase key when both are set.

### FR-4 — `getAuthenticatedUserId(event)`
- Resolve the verified user's `sub`, or `null` when authentication fails for any reason.
  Must never throw. When the header is absent it must resolve `null` **without** calling
  the verifier.

### FR-5 — `GET /me` handler
- `200` with `{ user }` on success.
- `401` with `{ message: 'Unauthorized' }` on any failure. The response body is identical
  regardless of the underlying cause and never contains the failure reason.

## Non-functional requirements

- TypeScript strict mode; `npm run typecheck` and `npm run lint` must pass.
- Public surface is exactly the four exports above (`verifyAuthHeader`, `getAuthHeader`,
  `getAuthenticatedUserId`, and the `me` `handler`). Keep file paths and signatures.

## Out of scope

- Issuing/refreshing tokens (that is the frontend's job), JWKS caching tuning, and any
  authorization/role logic beyond identity.
