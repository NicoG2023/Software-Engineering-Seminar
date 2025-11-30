Feature: Manage theater rooms
  As a cinema administrator
  I want to create and manage theater rooms
  So that I can schedule movie screenings in valid rooms

  Background:
    Given the API is running

  Scenario: Create a valid theater room
    When I send a POST request to "/rooms" with JSON:
      """
      {
        "name": "Room 1",
        "capacity": 80,
        "location": "Main building, 2nd floor"
      }
      """
    Then the response status code should be 201
    And the JSON field "name" should have value "Room 1"
    And the JSON field "capacity" should be integer 80
    And the JSON response should have field "is_active"

  Scenario: Reject a room with invalid capacity
    When I send a POST request to "/rooms" with JSON:
      """
      {
        "name": "Invalid Room",
        "capacity": 0,
        "location": "Nowhere"
      }
      """
    Then the response status code should be 400
    And the JSON field "error" should have value "Capacity must be a positive integer"

  Scenario: Deactivate a theater room (soft delete)
    Given an existing theater room
    When I soft delete the last created room
    Then the response status code should be 200
    And the JSON field "message" should have value "Room deactivated (soft delete)"
