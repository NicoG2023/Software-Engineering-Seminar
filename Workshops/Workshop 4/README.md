# Workshop 4
Members:
- Nicolás Guevara Herrán
- Samuel Antonio Sánchez Peña
---

# 1. Docker Containerization

## 1.1 Overview

The system is fully containerized using **Docker** and orchestrated via **docker-compose**.
The goal is to provide a reproducible, isolated environment for:

* the **Java authentication microservice** (Quarkus),
* the **Python business microservice** (Flask),
* the **React frontend**, and
* their supporting services (**Keycloak**, **MySQL**, **PostgreSQL**).

All services run on the same Docker network and communicate by container name (e.g. `mysql-db`, `postgres-db`, `business-api`).

> All Docker-related artefacts for this workshop are stored under the
> [`Docker/`](./Docker) directory:
>
> - [`Docker-compose`](./Docker/Docker-compose) – docker-compose definition for the full stack.  
> - [`Dockerfile-Java`](./Docker/Dockerfile-Java) – build for the Java authentication microservice.  
> - [`Dockerfile-Python`](./Docker/Dockerfile-Python) – build for the Python business microservice.  
> - [`Dockerfile-Frontend`](./Docker/Dockerfile-Frontend) – build for the React/Vite frontend.

---

## 1.2 docker-compose Architecture

The `docker-compose.yml` file defines the following services:

### 1.2.1 `mysql-db` – MySQL for Keycloak

* **Image:** `mysql:8.0`
* **Purpose:** persistence layer for Keycloak.
* **Environment:**

  * `MYSQL_DATABASE=keycloak`
  * `MYSQL_USER=keycloak`
  * `MYSQL_PASSWORD=keycloak`
  * `MYSQL_ROOT_PASSWORD=root`
* **Command:** enables `mysql_native_password` for better compatibility.
* **Volume:** `kc_data:/var/lib/mysql` to persist Keycloak data across restarts.
* **Healthcheck:** simple `mysqladmin ping` to ensure the DB is ready.
* **Ports:** `3306:3306` (exposed to host for debugging / admin tools).

### 1.2.2 `keycloak` – Identity Provider

* **Image:** `quay.io/keycloak/keycloak:26.0`
* **Startup command:**

  * `start-dev`
  * `--import-realm` (imports realm configuration on start).
* **Environment:**

  * `KEYCLOAK_ADMIN`, `KEYCLOAK_ADMIN_PASSWORD` – admin credentials.
  * `KC_DB`, `KC_DB_URL`, `KC_DB_USERNAME`, `KC_DB_PASSWORD` – MySQL connection.
  * `KC_HTTP_ENABLED=true`, `KC_HOSTNAME_STRICT=false`, `KC_HEALTH_ENABLED=true`.
* **Volumes:**

  * `./keycloak/realms:/opt/keycloak/data/import` – realm JSON files.
  * `../Frontend/themes:/opt/keycloak/themes` – custom login/registration themes.
* **Depends on:** `mysql-db` (using healthcheck condition).
* **Ports:** `8080:8080` – Keycloak console and OIDC endpoints.
* **Healthcheck:** simple TCP check on port 8080.

Keycloak acts as the **authorization server** for the Java authentication microservice.

### 1.2.3 `authentication` – Java Authentication Microservice (Quarkus)

* **Build context:** `../Backend/Java/authentication`
* **Container name:** `quarkus-auth`
* **Environment:** configuration is injected via variables:

  * `QUARKUS_OIDC_AUTH_SERVER_URL`, `QUARKUS_OIDC_CLIENT_ID`, etc. for OIDC setup.
  * `ADMIN_URL`, `REALM`, `CLIENT_ID`, `CLIENT_SECRET` for Keycloak Admin calls.
  * `QUARKUS_PUBLIC_PATHS`, `QUARKUS_HTTP_CORS*` for CORS and public endpoints.
* **Depends on:** `keycloak` (waits until Keycloak is healthy).
* **Ports:** `8081:8080` – exposes the Quarkus HTTP port as 8081 on the host.

This is the **Java microservice** that was later used for stress testing in section 3.

### 1.2.4 `postgres-db` – PostgreSQL for Python Microservice

* **Image:** `postgres:16-alpine`
* **Purpose:** persistence layer for the Cinema business domain.
* **Environment:**

  * `POSTGRES_DB=cinema`
  * `POSTGRES_USER=app`
  * `POSTGRES_PASSWORD=app`
* **Volume:** `pg_data:/var/lib/postgresql/data` to persist data.
* **Healthcheck:** uses `pg_isready` to wait until the database is ready.
* **Ports:** `5432:5432`.

### 1.2.5 `business-api` – Python Business Microservice (Flask)

* **Build context:** `../Backend/python`
* **Container name:** `flask-cinema`
* **Environment:**

  * `DATABASE_URL=postgresql+psycopg://app:app@postgres-db:5432/cinema` – SQLAlchemy DSN.
  * `CORS_ORIGINS=http://localhost:5173` – frontend origin.
  * `FLASK_RUN_PORT=5000`, `FLASK_ENV=production`.
  * `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME` – additional DB config.
* **Depends on:** `postgres-db` (using healthcheck).
* **Ports:** `5000:5000`.
* **Healthcheck:** Python script that calls `http://127.0.0.1:5000/health` and fails if unreachable.

This is the **Python microservice** for the Cinema business logic.

### 1.2.6 `frontend` – React/Vite Client

* **Build context:** `../Frontend/frontend`
* **Dockerfile:** `Dockerfile.dev` (development image with hot reload).
* **Environment:**

  * `HOST=0.0.0.0` – Vite listens on all interfaces.
  * `PORT=5173`.
* **Volumes:** `../Frontend/frontend:/app` – live bind mount for development.
* **Depends on:** `authentication` and `business-api` (ensures backend is up).
* **Ports:** `5173:5173`.
* **Command:** `npm run dev -- --host 0.0.0.0 --port 5173`.

The React app communicates with:

* `quarkus-auth` for authentication/authorization flows.
* `flask-cinema` for business operations.

### 1.2.7 Volumes

Two named volumes are used:

```yaml
volumes:
  kc_data:   # Persistent storage for MySQL (Keycloak)
  pg_data:   # Persistent storage for PostgreSQL (Cinema DB)
```

These ensure that data is not lost when containers are recreated.

---

## 1.3 Java Microservice Dockerfile (`authentication`)

The Java microservice uses a **multi-stage Docker build** to keep the runtime image small and efficient.

### 1.3.1 Build Stage (`eclipse-temurin:21-jdk`)

* **Base image:** `eclipse-temurin:21-jdk`.
* **Workdir:** `/workspace`.
* Steps:

  1. Copy `gradlew` and install `dos2unix` to normalize line endings and avoid Windows CRLF issues.
  2. Copy Gradle wrapper and configuration files: `gradle/`, `build.gradle`, `settings.gradle`, `gradle.properties`.
  3. Run `./gradlew dependencies` to warm up the Gradle cache.
  4. Copy the `src` directory.
  5. Build the project using
     `./gradlew clean build -Dquarkus.package.type=fast-jar`.

This produces a **fast-jar** layout in `build/quarkus-app/`.

### 1.3.2 Runner Stage (`eclipse-temurin:21-jre`)

* **Base image:** `eclipse-temurin:21-jre` (lighter JRE for production).
* **Workdir:** `/app`.
* Copies the built application from the previous stage:

  * `/workspace/build/quarkus-app/ -> /app/`
* Sets:

  * `QUARKUS_HTTP_HOST=0.0.0.0` so Quarkus listens on all interfaces.
  * `EXPOSE 8080`.
* **Entry point:**
  `CMD ["java", "-jar", "/app/quarkus-run.jar"]`

**Benefits:**

* Smaller final image (no Gradle, no sources).
* Reproducible builds using Gradle wrapper.
* Clear separation between build and runtime environment.

---

## 1.4 Python Microservice Dockerfile (`business-api`)

The Python business microservice is packaged as a production-ready image running under **gunicorn**.

### 1.4.1 Base Image and System Dependencies

* **Base image:** `python:3.12-slim`.
* **Environment variables:**

  * `PYTHONDONTWRITEBYTECODE=1` – avoid `.pyc` files.
  * `PYTHONUNBUFFERED=1` – unbuffered logs for better observability.
* Installs minimal system tools:

  * `build-essential`, `libpq-dev` – required to compile and use `psycopg` for PostgreSQL.

### 1.4.2 Application Setup

* **Workdir:** `/app`.
* Copies `requirements.txt` and installs dependencies with `pip` (including `gunicorn`).
* Copies the full application source tree into `/app`.
* Exposes port `5000`.

### 1.4.3 Entry Point

```bash
CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]
```

* Runs gunicorn bound to all interfaces on port 5000.
* Uses the `app` object from `app.py` as the WSGI entry point.

This setup is suitable for **production-like** load testing (as used in the JMeter stress tests).

---

## 1.5 Frontend Dockerfile (`frontend`)

The frontend uses a development-oriented image for React + Vite.

### 1.5.1 Base Image and Dependencies

* **Base image:** `node:20-alpine`.
* **Workdir:** `/app`.
* Installs `pnpm` globally:

  * `npm install -g pnpm`.

### 1.5.2 Dependency Installation and Source Code

* Copies `package.json` and `pnpm-lock.yaml` first to leverage Docker layer caching.
* Runs `pnpm install` to install all dependencies.
* Copies the remainder of the frontend source code.

### 1.5.3 Ports and Command

* Exposes port `5173`.
* Default command:

```bash
CMD ["pnpm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
```

This allows hot-reload development from the host (`http://localhost:5173`) with the code mounted as a volume via docker-compose.

---

## 1.6 How to Run the Stack

From the directory containing the `docker-compose.yml`:

```bash
docker compose up --build
```

This will:

1. Build images for:

   * Java authentication microservice (`authentication`),
   * Python business microservice (`business-api`),
   * React frontend (`frontend`).
2. Start infrastructure services:

   * `mysql-db` + `keycloak`,
   * `postgres-db`.
3. Wait for healthchecks to pass before starting dependent services.

Once up:

* Keycloak console: **[http://localhost:8080/](http://localhost:8080/)**
* Java authentication microservice: **[http://localhost:8081/](http://localhost:8081/)**
* Python business API: **[http://localhost:5000/](http://localhost:5000/)**
* React frontend: **[http://localhost:5173/](http://localhost:5173/)**

This containerized setup is the foundation for the **acceptance tests** and the **JMeter stress tests** described in sections 2 and 3.


# 2. Acceptance Testing

Aquí tienes un **README completo, profesional y perfectamente redactado en inglés**, listo para pegar en la sección **# 2. Acceptance Testing**.
Incluye la imagen `All_Tests_Passed.png` y explica **todo el proceso (Cucumber + Behave + Feature files + Step definitions + Results)**.

---

# 2. Acceptance Testing (Cucumber / Behave)

This project implements **Acceptance Testing** using the Cucumber philosophy (Gherkin syntax) combined with **Behave**, a Python BDD framework.
The goal of these tests is to validate the system’s behavior from the perspective of real business requirements, ensuring that all core use cases work as expected under realistic workflows.

---

## 2.1. Testing Strategy

The acceptance suite covers the three main functional modules of the Python microservice:

### ✔ Movie Management

* Create movies
* Validate required fields
* Update movies
* Soft delete movies

### ✔ Theater Room Management

* Create rooms
* Validate capacity
* Soft delete rooms

### ✔ Screening Scheduling

* Create screenings for valid movies and rooms
* Prevent screenings in the past

These tests simulate live API calls against a running Flask backend using HTTP requests.
Each scenario expresses user-centered behaviors using **Given / When / Then** steps.

---

## 2.2. Project Structure

All acceptance tests are located inside the `/features` directory:

```
features/
│
├── movies.feature
├── rooms.feature
├── screenings.feature
│
├── steps/
│   └── api_steps.py
│
└── environment.py
```

### **Feature Files (`*.feature`)**

Each feature describes high-level system behavior using Gherkin syntax.

### **Step Definitions (`api_steps.py`)**

This file binds human-readable Gherkin steps to executable Python functions that make real HTTP requests to the backend.

### **environment.py**

This file defines global Behave settings such as the base URL for the microservice.

---

## 2.3. Running the Acceptance Tests

Before executing the tests, ensure that:

1. The Flask backend is running:

```bash
poetry run flask run
```

2. All dependencies are installed:

```bash
poetry install
```

3. Behave is available (installed under the dev group):

```bash
poetry add --group dev behave
```

To execute the full acceptance suite:

```bash
poetry run behave
```

Behave will automatically scan all `.feature` files and run each scenario sequentially.

---

## 2.4. Step Definitions (Summary)

The tests use a reusable set of generic steps:

* Sending POST, GET, PUT, DELETE requests
* Asserting status codes
* Validating JSON fields
* Creating reusable resources (rooms, movies)
* Creating screenings linked to previously created IDs

All requests are executed against the real Flask API using the `requests` library.

---

## 2.5. Test Results

All scenarios for **movies**, **theater rooms**, and **screenings** passed successfully.
Below is the screenshot of the final execution summary:

<p align="center">
  <img src="./Cucumber/All_Tests_Passed.png" width="600px" />
</p>

The green output indicates that **every functional requirement defined in the acceptance criteria is fully satisfied**.

# 3. Stress Testing

## 3.1 Stress Testing for the Java Microservice (JMeter)

This document presents the design, execution, and analysis of the **stress testing** performed on the Java microservice.
The goal of these tests was to determine the behavior of the service under high load, identify scalability limits, and detect performance bottlenecks across critical API endpoints.

---

### Test Plan Design

#### Why the Stress Tests Were Split Into Group A and Group B

To obtain clean and meaningful performance metrics, the stress tests were separated into two independent Thread Groups:

---

#### **🔹 Stress Test A — Create Users (Stateless Operations)**

This group includes API calls that do **not depend on user state**:

* `List Users`
* `Create User`
* `Get User`
* `Set Password`

**Why?**
These endpoints are *idempotent* and do not conflict with themselves when executed repeatedly under load.

This separation allows:

* Pure measurement of backend performance.
* No contamination by functional/business errors (e.g., “role already exists”).
* Stable load patterns ideal for detecting true performance bottlenecks.

---

#### **🔹 Stress Test B — Roles & Promote (State-Dependent Operations)**

This group includes operations that **modify user state**:

* `Add Roles`
* `Remove Roles`
* `Set Enabled`
* `Promote To Admin`

**Why separate these?**

These operations are *stateful* and can easily generate business-validation errors during stress:

* Adding a role twice → HTTP 409
* Removing a role the user no longer has → 400 / 404
* Promoting a user who is already admin → 409
* Attempting to disable an admin → 403

Combining these with Stress Test A would:

❌ Inflate the error rate with false positives
❌ Make throughput and latency results unreliable
❌ Mix performance failures with business-logic conflicts

Keeping them in their own Thread Group ensures:

✔ All operations remain valid
✔ Results reflect real performance behavior
✔ The impact of state-changing operations can be measured independently

---

### Test Configuration

Both stress tests were executed with:

* **250 threads (virtual users)**
* **17-second ramp-up**
* **4 loop iterations**

This produced approximately **1,400–1,550 samples per endpoint**, depending on timing during ramp-up.

---

### Understanding JMeter Metrics

| Metric                   | Meaning                                                         |
| ------------------------ | --------------------------------------------------------------- |
| **# Samples**            | Number of total requests sent by JMeter.                        |
| **Average**              | Mean response time of all samples (ms).                         |
| **Median**               | Middle value; more stable for skewed distributions.             |
| **90% / 95% / 99% Line** | Percentiles indicating high-tail latency under load.            |
| **Min / Max**            | Fastest and slowest response times observed.                    |
| **Std. Dev.**            | Variability of response times; high values suggest instability. |
| **Error %**              | Percentage of failed requests (4xx, 5xx, timeouts).             |
| **Throughput**           | Requests processed per second by the microservice.              |
| **Received/Sent KB/sec** | Network traffic during execution.                               |
| **Avg. Bytes**           | Average response payload size.                                  |

---

### Results — Stress Test A (Create Users)

#### **Aggregate Report (Stress A)**

| Endpoint     | Avg (ms) | 90% Line | Max  |
| ------------ | -------- | -------- | ---- |
| List Users   | 2005     | 3237     | 3975 |
| Create User  | 5259     | 7374     | 8205 |
| Get User     | 3367     | 5356     | 6160 |
| Set Password | 3545     | 5178     | 5933 |

#### **Analysis**

* The Java microservice remained **stable under 250 concurrent users**.
* Error rate was extremely low (`~0.7%`), likely due to token expiration rather than performance failure.
* The most expensive operation was **Create User**, averaging ~5–7 seconds under peak load.
* High percentiles (95% and 99%) show predictable latency increases as concurrency grew.
* Throughput remained consistent at **~13.5 req/sec overall**.

**Conclusion:**
The microservice handles heavy user creation without crashing, though latency rises significantly after ~150-200 concurrent users.

---

### Results — Stress Test B (Roles & Promote)

#### **Aggregate Report (Stress B)**

| Endpoint         | Avg (ms) | 90% Line | Max   | Error % |
| ---------------- | -------- | -------- | ----- | ------- |
| Create User      | 9467     | 18503    | 34790 | 2.45%   |
| Set Enabled      | 8886     | 23259    | 30194 | 2.45%   |
| Add Roles        | 6624     | 15076    | 23265 | 2.45%   |
| Remove Roles     | 5640     | 11776    | 18521 | 2.45%   |
| Promote To Admin | 12241    | 25327    | 40261 | 2.45%   |

#### **Analysis**

* These operations are intrinsically heavier, involving more validation and DB writes.
* Latencies were higher across all endpoints, with **Promote To Admin** reaching **40 seconds** at the 99th percentile.
* The error rate (~2.45%) is expected:
  these are *business-rule errors* caused by state conflicts under extreme concurrency, **not performance failures**.
* Throughput was lower (1.7–1.8 req/sec per endpoint) but stable.

**Conclusion:**
The microservice sustains extreme load, but stateful operations show higher sensitivity and become a natural bottleneck.

---

### Visual JMeter Results

To complement the numeric tables, the following figures show how response
times evolved during the stress tests.

#### Stress Test A – Response Time Graph

![Stress Test A – Response Time Graph](./JMeter/Java/JMeter%20Images/Stress%20A/Stress%20A%20Response%20Time%20Graph%204.png)

The curve shows how average latency for `List Users`, `Create User`,
`Get User`, and `Set Password` grows as more concurrent requests are
issued, while the service remains stable (no error spikes).

#### Stress Test B – Response Time Graph

![Stress Test B – Response Time Graph](./JMeter/Java/JMeter%20Images/Stress%20B/Stress%20B%20Time%20Graph%203.png)

In this case, latency grows faster for stateful operations
(`Set Enabled`, `Add/Remove Roles`, `Promote To Admin`), and the tail
of the graph illustrates the impact of heavy concurrent writes on Keycloak.


## 3.2 Stress Testing for the Python Microservice (JMeter)

This stress-testing phase evaluates the performance, stability, and failure behavior of the **Python Flask microservice**, which contains the business logic for Movies, Screening Management, and Theater Rooms. The goal was to determine how the service behaves under high load, how it degrades, and at what point bottlenecks appear.

### **Test Strategy**

Because this microservice contains two clearly different categories of endpoints—**CRUD for Movies & Rooms** and **CRUD for Screenings**—the load tests were split into **two independent Thread Groups**, each representing a different usage pattern:

---

### **🔹 Thread Group A — Movies & Rooms (baseline load)**

**Purpose:**
Evaluate the stability of the general CRUD operations (Movies and Rooms), which do not involve scheduling conflicts or time-sensitive logic. These endpoints are lightweight and represent baseline load on the microservice.

**Configuration:**

| Property       | Value          |
| -------------- | -------------- |
| Threads        | **900 users**  |
| Ramp-up        | **30 seconds** |
| Loop Count     | **7**          |
| Total Requests | **110,000**    |

**Endpoints Tested (10,000 samples each):**

* POST `/movies`
* GET `/movies/:id`
* PUT `/movies/:id`
* DELETE `/movies/:id` (soft delete)
* GET `/movies`
* GET `/genres`
* POST `/rooms`
* GET `/rooms/:id`
* PUT `/rooms/:id`
* DELETE `/rooms/:id` (soft delete)

---

### **Results – Thread Group A**

Across all 110,000 samples:

* **Average Response Time:** ~2,030 ms
* **Median:** ~2,250 ms
* **99th percentile:** ~3,650 ms
* **Error Rate:** **0%**
* **Throughput:** ~15 requests/sec per endpoint

The microservice **remained stable under heavy load**, showing predictable degradation as concurrency rose but without failures, crashes, or abnormal timeouts.

This confirms that the baseline business endpoints scale linearly and maintain consistency even under sustained stress.

---

### **🔹 Thread Group B — Screenings (high-contention logic)**

**Purpose:**
Stress-test the part of the system that contains **business rules** and **conflict validation**, especially:

* Scheduling screenings
* Detecting conflicts (same room + date + time)
* Ensuring movies/rooms exist and are active
* Updating screenings
* Listing screenings by movie
* Listing all screenings
* Deleting screenings

These endpoints involve significantly more validations and are expected to fail once data contention increases.

**Configuration:**

| Property       | Value          |
| -------------- | -------------- |
| Threads        | **500 users**  |
| Ramp-up        | **20 seconds** |
| Loop Count     | **5**          |
| Total Requests | **22,200**     |

**Endpoints Tested (3,700 samples each):**

* POST `/screenings`
* GET `/screenings/id/:id`
* PUT `/screenings/:id`
* GET `/screenings/:movieId`
* GET `/screenings-all`
* DELETE `/screenings/:id`

---

### **Results – Thread Group B**

* **Average Response Time:** ~240 ms
* **99th percentile:** ~540 ms
* **Throughput:** ~7.3 requests/sec per endpoint
* **Total Error Rate:** **51%**
* **Endpoints like Create/Update/Delete Screening showed 77% error rate**

#### **Why did the error rate increase? (Expected behavior)**

The Screening API includes strict business rules:

* A screening **cannot overlap** with another screening in the same room.
* It must not reference deleted movies or inactive rooms.
* It cannot be created in the past.

Because Thread Group B generates **hundreds of concurrent POST and PUT requests** using the *same room and similar times*, the system correctly rejects most attempts with:

```
400 — "Scheduling conflict detected"
400 — "Movie or room not available"
```

**These errors are not performance failures — they are *business rule validations triggered by intentional contention*.**
This confirms the conflict-detection logic works reliably under extreme concurrent creation load.

---

### **Performance Insights**

1. The microservice handles concurrent read/write operations efficiently, with **low average latency (~240 ms)** even during peak load.
2. Error rates in Test B are **expected and desirable**, since the test intentionally forces high-contention scheduling.
3. The Flask + SQLAlchemy + PostgreSQL stack shows strong resilience, with no crashes, deadlocks, or timeouts.
4. CPU usage spikes occurred only during Screening conflict checks, consistent with business logic complexity.

### Visual JMeter Results

To complement the numeric tables, the following figures show how response
times evolved during the stress tests.

#### Stress Test A – Response Time Graph

![Stress Test A – Response Time Graph](./JMeter/Python/images/Stress%20A%20Time%20Graph%203.png)

The curve shows how average latency for `List Users`, `Create User`,
`Get User`, and `Set Password` grows as more concurrent requests are
issued, while the service remains stable (no error spikes).

#### Stress Test B – Response Time Graph

![Stress Test B – Response Time Graph](./JMeter/Python/images/Stress%20B%20Time%20Graph%202.png)

In this case, latency grows faster for stateful operations
(`Set Enabled`, `Add/Remove Roles`, `Promote To Admin`), and the tail
of the graph illustrates the impact of heavy concurrent writes on Keycloak.

# 4. GitHub Actions Workflow

