import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { jsonResponse } from '../../../base/http';
import { getAuthHeader, verifyAuthHeader } from '../verifyToken';

/**
 * YOUR TASK — implement this handler.
 *
 * `GET /me` returns the authenticated caller's profile.
 *
 * - On success, respond `200` with body `{ user }`, where `user` is the resolved
 *   `AuthenticatedUser`.
 * - On ANY authentication failure — missing header, malformed header, invalid/expired
 *   token, or any unexpected throw — respond `401` with body `{ message: 'Unauthorized' }`
 *   and NEVER leak the underlying failure reason into the response.
 *
 * Use `getAuthHeader` + `verifyAuthHeader` from `../verifyToken` and `jsonResponse` from
 * `../../../base/http` (both provided).
 */
export const handler: APIGatewayProxyHandlerV2 = async (_event) => {
  // Note: `getAuthHeader` and `verifyAuthHeader` are imported for you — wire them up.
  void getAuthHeader;
  void verifyAuthHeader;
  void jsonResponse;
  throw new Error('NotImplemented');
};
