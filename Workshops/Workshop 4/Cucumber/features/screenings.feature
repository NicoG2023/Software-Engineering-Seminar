Feature: Manage screenings
  As a cinema administrator
  I want to schedule screenings for movies
  So that customers can attend movie sessions in valid rooms

  Background:
    Given the API is running
    And an existing theater room
    And an existing movie

  Scenario: Create a valid screening in the future
    When I create a screening on date "2030-01-01" at time "19:30" with price 25000
    Then the response status code should be 201
    And the JSON field "message" should have value "Screening created successfully"

  Scenario: Reject a screening in the past
    When I send a POST request to "/screenings" with JSON:
      """
      {
        "movie_id": 1,
        "room_id": 1,
        "date": "2020-01-01",
        "time": "19:30",
        "price": 25000
      }
      """
    Then the response status code should be 400
    And the JSON field "error" should have value "Cannot schedule screenings in the past"
