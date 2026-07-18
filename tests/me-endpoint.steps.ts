// Provided acceptance suite — do not modify.
// Executes docs/features/me-endpoint.feature against your implementation.
import { defineFeature, loadFeature } from 'jest-cucumber';
import { jest, expect, beforeEach } from '@jest/globals';
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import type { AuthenticatedUser } from '../src/interfaces/auth';

const feature = loadFeature('docs/features/me-endpoint.feature');

const mockVerifyAuthHeader = jest.fn<(authHeader: string | undefined) => Promise<AuthenticatedUser>>();

jest.mock('../src/components/auth/verifyToken', () => ({
  ...(jest.requireActual('../src/components/auth/verifyToken') as object),
  verifyAuthHeader: mockVerifyAuthHeader,
}));

import { handler } from '../src/components/auth/handlers/me';

function tableToUser(rows: { [k: string]: string }[]): AuthenticatedUser {
  const out: Record<string, unknown> = {};
  for (const row of rows) {
    const [key, value] = Object.values(row);
    out[key] = value === 'true' ? true : value === 'false' ? false : value;
  }
  return out as unknown as AuthenticatedUser;
}

function buildEvent(headers: Record<string, string | undefined>): APIGatewayProxyEventV2 {
  return { headers } as unknown as APIGatewayProxyEventV2;
}

async function invoke(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  return (handler as unknown as (e: APIGatewayProxyEventV2) => Promise<APIGatewayProxyStructuredResultV2>)(event);
}

interface Ctx {
  response: APIGatewayProxyStructuredResultV2 | null;
}
const ctx: Ctx = { response: null };

beforeEach(() => {
  mockVerifyAuthHeader.mockReset();
  ctx.response = null;
});

defineFeature(feature, (test) => {
  test('Authenticates using the located header', ({ given, when, then }) => {
    given(/^verifyAuthHeader will resolve the user:$/, (table) => {
      mockVerifyAuthHeader.mockResolvedValue(tableToUser(table));
    });
    when(/^GET \/me is invoked with authorization header "([^"]*)"$/, async (header) => {
      ctx.response = await invoke(buildEvent({ authorization: header }));
    });
    then(/^verifyAuthHeader is called once with "([^"]*)"$/, (header) => {
      expect(mockVerifyAuthHeader).toHaveBeenCalledTimes(1);
      expect(mockVerifyAuthHeader).toHaveBeenCalledWith(header);
    });
  });

  test('Uses the capitalized Authorization header when present', ({ given, when, then }) => {
    given(/^verifyAuthHeader will resolve the user:$/, (table) => {
      mockVerifyAuthHeader.mockResolvedValue(tableToUser(table));
    });
    when(/^GET \/me is invoked with capitalized Authorization header "([^"]*)"$/, async (header) => {
      ctx.response = await invoke(buildEvent({ Authorization: header }));
    });
    then(/^verifyAuthHeader is called once with "([^"]*)"$/, (header) => {
      expect(mockVerifyAuthHeader).toHaveBeenCalledTimes(1);
      expect(mockVerifyAuthHeader).toHaveBeenCalledWith(header);
    });
  });

  test('Returns 200 with the user on success', ({ given, when, then, and }) => {
    given(/^verifyAuthHeader will resolve the user:$/, (table) => {
      mockVerifyAuthHeader.mockResolvedValue(tableToUser(table));
    });
    when(/^GET \/me is invoked with authorization header "([^"]*)"$/, async (header) => {
      ctx.response = await invoke(buildEvent({ authorization: header }));
    });
    then(/^the response status is (\d+)$/, (status) => {
      expect(ctx.response?.statusCode).toBe(Number(status));
    });
    and(/^the response body is the JSON user wrapper for:$/, (table) => {
      expect(JSON.parse(ctx.response?.body as string)).toEqual({ user: tableToUser(table) });
    });
  });

  test('Returns 401 when credentials are missing', ({ given, when, then, and }) => {
    given(/^verifyAuthHeader will reject with "([^"]*)"$/, (message) => {
      mockVerifyAuthHeader.mockRejectedValue(new Error(message));
    });
    when(/^GET \/me is invoked with no authorization header$/, async () => {
      ctx.response = await invoke(buildEvent({}));
    });
    then(/^the response status is (\d+)$/, (status) => {
      expect(ctx.response?.statusCode).toBe(Number(status));
    });
    and(/^the response body is exactly (.+)$/, (body) => {
      expect(ctx.response?.body).toBe(body);
    });
  });

  test('Never leaks the failure reason into the body', ({ given, when, then, and }) => {
    given(/^verifyAuthHeader will reject with (.+)$/, (rejection) => {
      if (rejection.startsWith('an Error')) {
        const message = rejection.match(/"([^"]*)"/)?.[1] ?? 'error';
        mockVerifyAuthHeader.mockRejectedValue(new Error(message));
      } else if (rejection.startsWith('the string')) {
        const value = rejection.match(/"([^"]*)"/)?.[1] ?? 'boom';
        mockVerifyAuthHeader.mockRejectedValue(value);
      } else if (rejection.startsWith('a plain object')) {
        mockVerifyAuthHeader.mockRejectedValue({ code: 'BOOM' });
      } else {
        mockVerifyAuthHeader.mockRejectedValue(undefined);
      }
    });
    when(/^GET \/me is invoked with authorization header "([^"]*)"$/, async (header) => {
      ctx.response = await invoke(buildEvent({ authorization: header }));
    });
    then(/^the response status is (\d+)$/, (status) => {
      expect(ctx.response?.statusCode).toBe(Number(status));
    });
    and(/^the response body is exactly (.+)$/, (body) => {
      expect(ctx.response?.body).toBe(body);
    });
  });

  test('Returns 401 even when verification throws synchronously', ({ given, when, then, and }) => {
    given(/^verifyAuthHeader will throw synchronously$/, () => {
      mockVerifyAuthHeader.mockImplementation(() => {
        throw new Error('unexpected failure');
      });
    });
    when(/^GET \/me is invoked with authorization header "([^"]*)"$/, async (header) => {
      ctx.response = await invoke(buildEvent({ authorization: header }));
    });
    then(/^the response status is (\d+)$/, (status) => {
      expect(ctx.response?.statusCode).toBe(Number(status));
    });
    and(/^the response body is exactly (.+)$/, (body) => {
      expect(ctx.response?.body).toBe(body);
    });
  });
});
