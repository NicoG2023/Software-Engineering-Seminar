# Workshop-3
---

## 1. Source Code for Backends

### 1.1 Python

### 1.2 Java

The Java backend is located in the folder [`java-backend`](./java-backend).  
It implements authentication and user administration using **Keycloak** as the identity provider.  
The backend is developed with **Quarkus (Java)** and communicates with Keycloak’s Admin REST API to manage users, roles, and groups.


## 2. Database Connection Scripts/Configuration

### 2.1 Python

### 2.2 Java

The Java backend does not connect directly to a relational database.  
Instead, it communicates with **Keycloak**, which in turn uses **MySQL** as its persistence layer.  
All authentication data (users, roles, groups, sessions) are stored in the MySQL instance managed by Keycloak.

The connection between Keycloak and MySQL is defined in the project’s `docker-compose` configuration, using two services: `mysql-db` (MySQL) and `keycloak` (Keycloak server).

#### Docker Compose configuration (MySQL + Keycloak)

```yaml
mysql-db:
  image: mysql:8.0
  container_name: mysql-java
  restart: always
  environment:
    MYSQL_DATABASE: keycloak
    MYSQL_USER: keycloak
    MYSQL_PASSWORD: keycloak
    MYSQL_ROOT_PASSWORD: root
  command: --default-authentication-plugin=mysql_native_password
  volumes:
    - kc_data:/var/lib/mysql
  healthcheck:
    test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "keycloak", "-pkeycloak"]
    interval: 10s
    timeout: 5s
    retries: 20
  ports:
    - "3306:3306"

keycloak:
  image: quay.io/keycloak/keycloak:26.0
  command:
    - start-dev
    - --import-realm
  environment:
    KEYCLOAK_ADMIN: admin
    KEYCLOAK_ADMIN_PASSWORD: admin
    KC_DB: mysql
    KC_DB_URL: jdbc:mysql://mysql-db:3306/keycloak?allowPublicKeyRetrieval=true&useSSL=false&characterEncoding=UTF-8
    KC_DB_USERNAME: keycloak
    KC_DB_PASSWORD: keycloak
    KC_HTTP_ENABLED: "true"
    KC_HOSTNAME_STRICT: "false"
    KC_HEALTH_ENABLED: "true"
  volumes:
    - ./keycloak/realms:/opt/keycloak/data/import
    - ../Frontend/themes:/opt/keycloak/themes
  depends_on:
    mysql-db:
      condition: service_healthy
  ports:
    - "8080:8080"
  healthcheck:
    test: ["CMD-SHELL", "bash -lc 'exec 3<>/dev/tcp/127.0.0.1/8080'"]
    interval: 10s
    timeout: 5s
    retries: 30
```

## 3. REST API Documentation

### 3.1 Python

### 3.2 Java

The **Java backend** provides a complete OpenAPI documentation.  
This documentation describes all REST API endpoints under `/api/auth`, including request/response examples, authentication details, and error codes.

#### 📄 Static Documentation

A static HTML version of the documentation was generated using **ReDoc** from the OpenAPI specification exposed by Quarkus at `/q/openapi`.

- **OpenAPI JSON**: [`docs/openapi-auth.json`](./docs/openapi-auth.json)  
- **Full HTML Documentation**: [`docs/auth-admin-api.html`](./docs/auth-admin-api.html)

You can open the HTML file locally in any browser to view the complete interactive documentation.

#### 🔗 Live Swagger UI

During development, the live Swagger UI can be accessed to watch the REST API documentation.  
Here you can see how it actually looks when running in the browser:

<p align="center">
  <img src="./docs/Swagger-UI-images/GeneralDocumentation.png" alt="Swagger UI General Documentation" width="60%"/><br/>
  <em>Figure 1. General view of the OpenAPI documentation.</em>
</p>

<p align="center">
  <img src="./docs/Swagger-UI-images/GeneralSchemas.png" alt="Swagger UI Schemas Section" width="60%"/><br/>
  <em>Figure 2. Schemas section showing request and response models.</em>
</p>

<p align="center">
  <img src="./docs/Swagger-UI-images/List-users-1.png" alt="Swagger UI List Users Endpoint" width="60%"/><br/>
  <em>Figure 3. Example of the <code>GET /api/auth/users</code> endpoint documentation.</em>
</p>

<p align="center">
  <img src="./docs/Swagger-UI-images/List-users-2.png" alt="Swagger UI Example Response" width="60%"/><br/>
  <em>Figure 4. Example response preview from the Swagger UI.</em>
</p>



## 4. Unit Test Results and code

### 4.1 Python

### 4.2 Java

Unit tests for the Java backend were implemented using **JUnit 5** and **Mockito**.  
These tests validate the core logic of the `AuthAdminResource` class without requiring a live Keycloak server.  
Mocked instances of `KcAdminService` and `SecurityIdentity` are used to simulate interactions and verify behavior.

#### 🧪 Test Summary

- The tests cover key operations such as:
  - Creating a new user (`createUser_ok_returns201AndId`)
  - Handling missing required fields (`createUser_missingFields_throwsBadRequest`)
- All tests executed successfully with no errors or skipped tests.
- The build result confirmed a successful execution of all tasks and assertions.

---

#### ✅ Evidence of Test Execution

<p align="center">
  <img src="./docs/test-results-images/Java-Test-results-executing.png" alt="JUnit test results executing in terminal" width="70%"/><br/>
  <em>Figure 1. All two unit tests running successfully — both passed in under 1.2 seconds.</em>
</p>

<p align="center">
  <img src="./docs/test-results-images/Java-Test-results-gradle.png" alt="Gradle test build successful" width="70%"/><br/>
  <em>Figure 2. Gradle build showing successful test execution with <code>BUILD SUCCESSFUL</code>.</em>
</p>

---

#### 🧰 Command Used

The tests can be executed directly using Gradle:

```bash
./gradlew clean test
```

## 5. Evidence of Web GUI integration
