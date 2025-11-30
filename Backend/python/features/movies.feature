Feature: Manage movies
  As a cinema administrator
  I want to create, update and soft delete movies
  So that I can manage the catalog for the cinema

  Background:
    Given the API is running

  Scenario: Create a valid movie
    When I send a POST request to "/movies" with JSON:
      """
      {
        "title": "Inception BDD",
        "genre": "Sci-Fi",
        "duration": 148
      }
      """
    Then the response status code should be 201
    And the JSON field "title" should have value "Inception BDD"
    And the JSON field "genre" should have value "Sci-Fi"

  Scenario: Reject movie with missing required fields
    When I send a POST request to "/movies" with JSON:
      """
      {
        "title": "Invalid Movie"
      }
      """
    Then the response status code should be 400
    And the JSON field "error" should have value "Missing required fields"

  Scenario: Update an existing movie
    Given an existing movie
    When I update the last created movie with JSON:
      """
      {
        "title": "BDD Movie Updated",
        "duration": 90
      }
      """
    Then the response status code should be 200
    And the JSON field "message" should have value "Movie updated successfully"

  Scenario: Soft delete an existing movie
    Given an existing movie
    When I delete the last created movie
    Then the response status code should be 200
    And the JSON field "message" should have value "Movie deleted (soft delete)"
