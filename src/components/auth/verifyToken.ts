import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import type { AuthenticatedUser } from '../../interfaces/auth';

/**
 * YOUR TASK — implement this module.
 *
 * This is the authentication layer every protected handler in the service relies on. It
 * verifies Cognito **ID tokens** (not OAuth access tokens) and projects their claims onto
 * the `AuthenticatedUser` shape (see src/interfaces/auth.ts).
 *
 * Use the `aws-jwt-verify` package's `CognitoJwtVerifier`. Construct the verifier ONCE at
 * module load (not per request) from:
 *   - userPoolId: process.env.COGNITO_USER_POOL_ID
 *   - tokenUse:   'id'
 *   - clientId:   process.env.COGNITO_APP_CLIENT_ID
 *
 * Required behavior — see docs/requirements.md and docs/specifications.md for the full
 * contract and docs/features/*.feature for the acceptance scenarios.
 */

/**
 * Verifies a raw `Authorization` header value and resolves the authenticated user.
 *
 * - Rejects (throws) WITHOUT contacting the verifier when the header is missing or does
 *   not begin with the exact prefix `"Bearer "`.
 * - Otherwise strips the `"Bearer "` prefix and passes the remaining token to the
 *   verifier; the verifier's rejection must propagate unchanged.
 * - On success, returns an `AuthenticatedUser` containing exactly `sub`, `email`,
 *   `emailVerified`, `name`, `picture`. `sub` comes from the verified `sub` claim.
 *   Each optional profile field is included only when its claim is present AND of the
 *   right primitive type (`email`/`name`/`picture` must be strings, `email_verified`
 *   must be a boolean); otherwise that field is `undefined`. No other JWT claims leak
 *   into the result.
 */
export async function verifyAuthHeader(_authHeader: string | undefined): Promise<AuthenticatedUser> {
  throw new Error('NotImplemented');
}

/**
 * Reads the Authorization header from an API Gateway HTTP API v2 event, tolerating both
 * the lowercased `authorization` (what API Gateway sends) and capitalized `Authorization`
 * (some local/offline paths). Prefers the lowercase form when both are present. Returns
 * `undefined` when neither is present.
 */
export function getAuthHeader(_event: Pick<APIGatewayProxyEventV2, 'headers'>): string | undefined {
  throw new Error('NotImplemented');
}

/**
 * Convenience wrapper for handlers that only need the caller's id: resolves the verified
 * user's `sub`, or `null` (never throws) when the header is missing/invalid or the token
 * fails verification.
 */
export async function getAuthenticatedUserId(
  _event: Pick<APIGatewayProxyEventV2, 'headers'>,
): Promise<string | null> {
  throw new Error('NotImplemented');
}
