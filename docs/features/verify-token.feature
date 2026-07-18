Feature: Verify authorization header
  verifyAuthHeader turns a raw Authorization header into an AuthenticatedUser,
  gating on the "Bearer " prefix and projecting only the expected claims.

  Scenario: A valid bearer token is submitted for verification
    Given the verifier will accept the token and return claims:
      | claim | value    |
      | sub   | user-123 |
    When the header "Bearer my-jwt-token" is verified
    Then the verifier is called exactly once with "my-jwt-token"

  Scenario: The verified claims are projected onto the user
    Given the verifier will accept the token and return claims:
      | claim          | value                          |
      | sub            | user-123                       |
      | email          | jane@example.com               |
      | email_verified | true                           |
      | name           | Jane Doe                       |
      | picture        | https://example.com/avatar.png |
    When the header "Bearer token" is verified
    Then the resolved user equals:
      | field         | value                          |
      | sub           | user-123                       |
      | email         | jane@example.com               |
      | emailVerified | true                           |
      | name          | Jane Doe                       |
      | picture       | https://example.com/avatar.png |

  Scenario: Optional profile fields are undefined when absent
    Given the verifier will accept the token and return claims:
      | claim | value    |
      | sub   | user-123 |
    When the header "Bearer token" is verified
    Then the resolved user has key "sub" equal to "user-123"
    And the resolved user has no defined value for "email"
    And the resolved user has no defined value for "emailVerified"
    And the resolved user has no defined value for "name"
    And the resolved user has no defined value for "picture"

  Scenario: Unrelated JWT claims are ignored
    Given the verifier will accept the token and return claims:
      | claim     | value                           |
      | sub       | user-123                        |
      | email     | jane@example.com                |
      | token_use | id                              |
      | iss       | https://cognito-idp.example.com |
    When the header "Bearer token" is verified
    Then the resolved user has exactly the keys "email,emailVerified,name,picture,sub"

  Scenario: A non-string profile claim is treated as absent
    Given the verifier will accept the token and return a numeric "email" claim
    When the header "Bearer token" is verified
    Then the resolved user has no defined value for "email"

  Scenario: A non-boolean email_verified claim is treated as absent
    Given the verifier will accept the token and return the string "true" for "email_verified"
    When the header "Bearer token" is verified
    Then the resolved user has no defined value for "emailVerified"

  Scenario Outline: Malformed headers are rejected without contacting the verifier
    When the header <header> is verified and rejects
    Then the call is rejected with an Error
    And the verifier is never called

    Examples:
      | header                  |
      | <undefined>             |
      | ""                      |
      | "Basic dXNlcjpwYXNz"    |
      | "bearer some-token"     |
      | "Bearer"                |
      | "XBearer some-token"    |

  Scenario: An empty token after a bare "Bearer " prefix still reaches the verifier
    Given the verifier will accept the token and return claims:
      | claim | value    |
      | sub   | user-123 |
    When the header "Bearer " is verified
    Then the verifier is called exactly once with ""

  Scenario: The verifier's rejection is propagated unchanged
    Given the verifier will reject with "Token expired"
    When the header "Bearer expired-token" is verified and rejects
    Then the rejection is the exact error the verifier produced

  Scenario: The verifier is constructed once for Cognito id tokens
    Then the verifier was created exactly once with pool "ap-southeast-1_testPool123" and client "test-app-client-id" for token use "id"

  Scenario: getAuthHeader prefers the lowercase header
    Then getAuthHeader returns "Bearer lower" for headers authorization="Bearer lower" and Authorization="Bearer upper"

  Scenario: getAuthHeader falls back to the capitalized header
    Then getAuthHeader returns "Bearer abc" for headers Authorization="Bearer abc"

  Scenario: getAuthHeader returns undefined when neither header is present
    Then getAuthHeader returns undefined for empty headers

  Scenario: getAuthenticatedUserId resolves the subject on success
    Given the verifier will accept the token and return claims:
      | claim | value    |
      | sub   | user-123 |
    When the user id is requested for header "Bearer good-token"
    Then the resolved user id is "user-123"

  Scenario: getAuthenticatedUserId returns null when verification fails
    Given the verifier will reject with "Token expired"
    When the user id is requested for header "Bearer expired"
    Then the resolved user id is null

  Scenario: getAuthenticatedUserId returns null with no header and never calls the verifier
    When the user id is requested with no authorization header
    Then the resolved user id is null
    And the verifier is never called
