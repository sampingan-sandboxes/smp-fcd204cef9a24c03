Feature: GET /me endpoint
  The /me handler returns the authenticated caller, or a generic 401 that never
  leaks why authentication failed.

  Scenario: Authenticates using the located header
    Given verifyAuthHeader will resolve the user:
      | field | value    |
      | sub   | user-123 |
    When GET /me is invoked with authorization header "Bearer good-token"
    Then verifyAuthHeader is called once with "Bearer good-token"

  Scenario: Uses the capitalized Authorization header when present
    Given verifyAuthHeader will resolve the user:
      | field | value    |
      | sub   | user-456 |
    When GET /me is invoked with capitalized Authorization header "Bearer good-token"
    Then verifyAuthHeader is called once with "Bearer good-token"

  Scenario: Returns 200 with the user on success
    Given verifyAuthHeader will resolve the user:
      | field | value            |
      | sub   | user-123         |
      | email | jane@example.com |
    When GET /me is invoked with authorization header "Bearer good-token"
    Then the response status is 200
    And the response body is the JSON user wrapper for:
      | field | value            |
      | sub   | user-123         |
      | email | jane@example.com |

  Scenario: Returns 401 when credentials are missing
    Given verifyAuthHeader will reject with "Missing bearer token"
    When GET /me is invoked with no authorization header
    Then the response status is 401
    And the response body is exactly {"message":"Unauthorized"}

  Scenario Outline: Never leaks the failure reason into the body
    Given verifyAuthHeader will reject with <rejection>
    When GET /me is invoked with authorization header "Bearer token"
    Then the response status is 401
    And the response body is exactly {"message":"Unauthorized"}

    Examples:
      | rejection                |
      | an Error "Token expired" |
      | the string "boom"        |
      | a plain object           |
      | undefined                |

  Scenario: Returns 401 even when verification throws synchronously
    Given verifyAuthHeader will throw synchronously
    When GET /me is invoked with authorization header "Bearer token"
    Then the response status is 401
    And the response body is exactly {"message":"Unauthorized"}
