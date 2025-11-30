import json
import requests
from behave import given, when, then


# ========== HELPERS GENERALES ==========

@given("the API is running")
def step_api_running(context):
    # Asumimos que el servidor Flask ya está levantado.
    pass


@when('I send a POST request to "{path}" with JSON:')
def step_send_post_with_json(context, path):
    payload = json.loads(context.text)
    url = context.base_url + path
    response = requests.post(url, json=payload)
    context.response = response


@when('I send a GET request to "{path}"')
def step_send_get(context, path):
    url = context.base_url + path
    response = requests.get(url)
    context.response = response


@when('I send a PUT request to "{path}" with JSON:')
def step_send_put_with_json(context, path):
    payload = json.loads(context.text)
    url = context.base_url + path
    response = requests.put(url, json=payload)
    context.response = response


@when('I send a DELETE request to "{path}"')
def step_send_delete(context, path):
    url = context.base_url + path
    response = requests.delete(url)
    context.response = response


@then('the response status code should be {status:d}')
def step_check_status_code(context, status):
    resp = context.response
    assert resp.status_code == status, \
        f"Expected {status}, got {resp.status_code}, body={resp.text}"


# ========== COMPROBACIONES DE JSON (sin solapamientos) ==========

@then('the JSON response should have field "{field}"')
def step_json_has_field(context, field):
    """Verifica que exista la clave."""
    data = context.response.json()
    assert field in data, f"Field '{field}' not in response JSON: {data}"


@then('the JSON field "{field}" should have value "{value}"')
def step_json_field_value(context, field, value):
    """Verifica que el valor (como string) coincida."""
    data = context.response.json()
    assert field in data, f"Field '{field}' not in response JSON: {data}"
    assert str(data[field]) == value, \
        f"Expected {field}={value}, got {data[field]}"


@then('the JSON field "{field}" should be integer {value:d}')
def step_json_field_int_value(context, field, value):
    """Verifica que el valor entero coincida."""
    data = context.response.json()
    assert field in data, f"Field '{field}' not in response JSON: {data}"
    assert int(data[field]) == value, \
        f"Expected {field}={value}, got {data[field]}"


# ========== PASOS ESPECÍFICOS PARA REUTILIZAR IDs ==========

@given("an existing theater room")
def step_existing_room(context):
    """
    Crea una sala válida y guarda su id en context.room_id
    """
    url = context.base_url + "/rooms"
    payload = {
        "name": "Room BDD",
        "capacity": 80,
        "location": "Second floor, BDD tests",
    }
    resp = requests.post(url, json=payload)
    assert resp.status_code == 201, f"Cannot create room, got {resp.status_code} ({resp.text})"
    data = resp.json()
    context.room_id = data["id"]


@given("an existing movie")
def step_existing_movie(context):
    """
    Crea una película válida (no preloaded) y guarda su id en context.movie_id
    """
    url = context.base_url + "/movies"
    payload = {
        "title": "BDD Movie",
        "genre": "Sci-Fi",
        "duration": 120
    }
    resp = requests.post(url, json=payload)
    assert resp.status_code == 201, f"Cannot create movie, got {resp.status_code} ({resp.text})"
    data = resp.json()
    context.movie_id = data["id"]


@when('I create a screening on date "{date}" at time "{time}" with price {price}')
def step_create_screening_with_existing_movie_and_room(context, date, time, price):
    """
    Usa context.movie_id y context.room_id para crear una función
    """
    url = context.base_url + "/screenings"
    payload = {
        "movie_id": context.movie_id,
        "room_id": context.room_id,
        "date": date,
        "time": time,
        "price": float(price),
    }
    resp = requests.post(url, json=payload)
    context.response = resp


@when('I soft delete the last created room')
def step_delete_last_room(context):
    url = context.base_url + f"/rooms/{context.room_id}"
    resp = requests.delete(url)
    context.response = resp


@when('I update the last created movie with JSON:')
def step_update_last_movie(context):
    payload = json.loads(context.text)
    url = context.base_url + f"/movies/{context.movie_id}"
    resp = requests.put(url, json=payload)
    context.response = resp


@when('I delete the last created movie')
def step_delete_last_movie(context):
    url = context.base_url + f"/movies/{context.movie_id}"
    resp = requests.delete(url)
    context.response = resp
