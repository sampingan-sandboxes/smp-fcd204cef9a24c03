// Provided acceptance suite — do not modify.
// Executes docs/features/verify-token.feature against your implementation.
import { defineFeature, loadFeature } from 'jest-cucumber';
import { jest, expect, beforeEach } from '@jest/globals';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

const feature = loadFeature('docs/features/verify-token.feature');

const mockVerify = jest.fn<(token: string) => Promise<Record<string, unknown>>>();

jest.mock('aws-jwt-verify', () => ({
  CognitoJwtVerifier: {
    create: jest.fn(() => ({ verify: mockVerify })),
  },
}));

import { verifyAuthHeader, getAuthHeader, getAuthenticatedUserId } from '../src/components/auth/verifyToken';

function parseHeaderLiteral(literal: string): string | undefined {
  if (literal === '<undefined>') return undefined;
  const match = literal.match(/^"([\s\S]*)"$/);
  return match ? match[1] : literal;
}

function tableToObject(rows: { [k: string]: string }[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const row of rows) {
    const [key, rawValue] = Object.values(row);
    let value: unknown = rawValue;
    if (rawValue === 'true') value = true;
    else if (rawValue === 'false') value = false;
    out[key] = value;
  }
  return out;
}

interface Ctx {
  result: Record<string, unknown> | null;
  userId: string | null;
  error: unknown;
  header: string | undefined;
}
const ctx: Ctx = { result: null, userId: null, error: null, header: undefined };

beforeEach(() => {
  mockVerify.mockReset();
  ctx.result = null;
  ctx.userId = null;
  ctx.error = null;
  ctx.header = undefined;
});

defineFeature(feature, (test) => {
  test('A valid bearer token is submitted for verification', ({ given, when, then }) => {
    given(/^the verifier will accept the token and return claims:$/, (table) => {
      mockVerify.mockResolvedValue(tableToObject(table));
    });
    when(/^the header "([^"]*)" is verified$/, async (header) => {
      ctx.result = (await verifyAuthHeader(header)) as unknown as Record<string, unknown>;
    });
    then(/^the verifier is called exactly once with "([^"]*)"$/, (token) => {
      expect(mockVerify).toHaveBeenCalledTimes(1);
      expect(mockVerify).toHaveBeenCalledWith(token);
    });
  });

  test('The verified claims are projected onto the user', ({ given, when, then }) => {
    given(/^the verifier will accept the token and return claims:$/, (table) => {
      mockVerify.mockResolvedValue(tableToObject(table));
    });
    when(/^the header "([^"]*)" is verified$/, async (header) => {
      ctx.result = (await verifyAuthHeader(header)) as unknown as Record<string, unknown>;
    });
    then(/^the resolved user equals:$/, (table) => {
      expect(ctx.result).toEqual(tableToObject(table));
    });
  });

  test('Optional profile fields are undefined when absent', ({ given, when, then, and }) => {
    given(/^the verifier will accept the token and return claims:$/, (table) => {
      mockVerify.mockResolvedValue(tableToObject(table));
    });
    when(/^the header "([^"]*)" is verified$/, async (header) => {
      ctx.result = (await verifyAuthHeader(header)) as unknown as Record<string, unknown>;
    });
    then(/^the resolved user has key "([^"]*)" equal to "([^"]*)"$/, (key, value) => {
      expect(ctx.result?.[key]).toBe(value);
    });
    and(/^the resolved user has no defined value for "([^"]*)"$/, (key) => {
      expect(ctx.result?.[key]).toBeUndefined();
    });
    and(/^the resolved user has no defined value for "([^"]*)"$/, (key) => {
      expect(ctx.result?.[key]).toBeUndefined();
    });
    and(/^the resolved user has no defined value for "([^"]*)"$/, (key) => {
      expect(ctx.result?.[key]).toBeUndefined();
    });
    and(/^the resolved user has no defined value for "([^"]*)"$/, (key) => {
      expect(ctx.result?.[key]).toBeUndefined();
    });
  });

  test('Unrelated JWT claims are ignored', ({ given, when, then }) => {
    given(/^the verifier will accept the token and return claims:$/, (table) => {
      mockVerify.mockResolvedValue(tableToObject(table));
    });
    when(/^the header "([^"]*)" is verified$/, async (header) => {
      ctx.result = (await verifyAuthHeader(header)) as unknown as Record<string, unknown>;
    });
    then(/^the resolved user has exactly the keys "([^"]*)"$/, (keys) => {
      expect(Object.keys(ctx.result ?? {}).sort()).toEqual(keys.split(',').sort());
    });
  });

  test('A non-string profile claim is treated as absent', ({ given, when, then }) => {
    given(/^the verifier will accept the token and return a numeric "email" claim$/, () => {
      mockVerify.mockResolvedValue({ sub: 'user-123', email: 12345 });
    });
    when(/^the header "([^"]*)" is verified$/, async (header) => {
      ctx.result = (await verifyAuthHeader(header)) as unknown as Record<string, unknown>;
    });
    then(/^the resolved user has no defined value for "([^"]*)"$/, (key) => {
      expect(ctx.result?.[key]).toBeUndefined();
    });
  });

  test('A non-boolean email_verified claim is treated as absent', ({ given, when, then }) => {
    given(/^the verifier will accept the token and return the string "true" for "email_verified"$/, () => {
      mockVerify.mockResolvedValue({ sub: 'user-123', email_verified: 'true' });
    });
    when(/^the header "([^"]*)" is verified$/, async (header) => {
      ctx.result = (await verifyAuthHeader(header)) as unknown as Record<string, unknown>;
    });
    then(/^the resolved user has no defined value for "([^"]*)"$/, (key) => {
      expect(ctx.result?.[key]).toBeUndefined();
    });
  });

  test('Malformed headers are rejected without contacting the verifier', ({ when, then, and }) => {
    when(/^the header (.+) is verified and rejects$/, async (literal) => {
      ctx.header = parseHeaderLiteral(literal);
      try {
        await verifyAuthHeader(ctx.header);
      } catch (error) {
        ctx.error = error;
      }
    });
    then(/^the call is rejected with an Error$/, () => {
      expect(ctx.error).toBeInstanceOf(Error);
    });
    and(/^the verifier is never called$/, () => {
      expect(mockVerify).not.toHaveBeenCalled();
    });
  });

  test('An empty token after a bare "Bearer " prefix still reaches the verifier', ({ given, when, then }) => {
    given(/^the verifier will accept the token and return claims:$/, (table) => {
      mockVerify.mockResolvedValue(tableToObject(table));
    });
    when(/^the header "([^"]*)" is verified$/, async (header) => {
      ctx.result = (await verifyAuthHeader(header)) as unknown as Record<string, unknown>;
    });
    then(/^the verifier is called exactly once with "([^"]*)"$/, (token) => {
      expect(mockVerify).toHaveBeenCalledTimes(1);
      expect(mockVerify).toHaveBeenCalledWith(token);
    });
  });

  test("The verifier's rejection is propagated unchanged", ({ given, when, then }) => {
    const sentinel = new Error('Token expired');
    given(/^the verifier will reject with "([^"]*)"$/, () => {
      mockVerify.mockRejectedValue(sentinel);
    });
    when(/^the header "([^"]*)" is verified and rejects$/, async (header) => {
      try {
        await verifyAuthHeader(header);
      } catch (error) {
        ctx.error = error;
      }
    });
    then(/^the rejection is the exact error the verifier produced$/, () => {
      expect(ctx.error).toBe(sentinel);
    });
  });

  test('The verifier is constructed once for Cognito id tokens', ({ then }) => {
    then(
      /^the verifier was created exactly once with pool "([^"]*)" and client "([^"]*)" for token use "([^"]*)"$/,
      (pool, client, tokenUse) => {
        expect(CognitoJwtVerifier.create).toHaveBeenCalledTimes(1);
        expect(CognitoJwtVerifier.create).toHaveBeenCalledWith({
          userPoolId: pool,
          tokenUse,
          clientId: client,
        });
      },
    );
  });

  test('getAuthHeader prefers the lowercase header', ({ then }) => {
    then(
      /^getAuthHeader returns "([^"]*)" for headers authorization="([^"]*)" and Authorization="([^"]*)"$/,
      (expected, lower, upper) => {
        expect(getAuthHeader({ headers: { authorization: lower, Authorization: upper } })).toBe(expected);
      },
    );
  });

  test('getAuthHeader falls back to the capitalized header', ({ then }) => {
    then(/^getAuthHeader returns "([^"]*)" for headers Authorization="([^"]*)"$/, (expected, upper) => {
      expect(getAuthHeader({ headers: { Authorization: upper } })).toBe(expected);
    });
  });

  test('getAuthHeader returns undefined when neither header is present', ({ then }) => {
    then(/^getAuthHeader returns undefined for empty headers$/, () => {
      expect(getAuthHeader({ headers: {} })).toBeUndefined();
    });
  });

  test('getAuthenticatedUserId resolves the subject on success', ({ given, when, then }) => {
    given(/^the verifier will accept the token and return claims:$/, (table) => {
      mockVerify.mockResolvedValue(tableToObject(table));
    });
    when(/^the user id is requested for header "([^"]*)"$/, async (header) => {
      ctx.userId = await getAuthenticatedUserId({ headers: { authorization: header } });
    });
    then(/^the resolved user id is "([^"]*)"$/, (id) => {
      expect(ctx.userId).toBe(id);
    });
  });

  test('getAuthenticatedUserId returns null when verification fails', ({ given, when, then }) => {
    given(/^the verifier will reject with "([^"]*)"$/, (message) => {
      mockVerify.mockRejectedValue(new Error(message));
    });
    when(/^the user id is requested for header "([^"]*)"$/, async (header) => {
      ctx.userId = await getAuthenticatedUserId({ headers: { authorization: header } });
    });
    then(/^the resolved user id is null$/, () => {
      expect(ctx.userId).toBeNull();
    });
  });

  test('getAuthenticatedUserId returns null with no header and never calls the verifier', ({ when, then, and }) => {
    when(/^the user id is requested with no authorization header$/, async () => {
      ctx.userId = await getAuthenticatedUserId({ headers: {} });
    });
    then(/^the resolved user id is null$/, () => {
      expect(ctx.userId).toBeNull();
    });
    and(/^the verifier is never called$/, () => {
      expect(mockVerify).not.toHaveBeenCalled();
    });
  });
});
