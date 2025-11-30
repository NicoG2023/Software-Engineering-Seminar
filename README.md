# Software Engineering Seminar – Final Project

## About
This repository contains the course project for the **Software Engineering Seminar (Semester 2025-III)** at *Universidad Distrital Francisco José de Caldas*.  
The project involves designing, implementing, testing, and documenting a complete web application that integrates the concepts and practices learned throughout the course applied to a Cinema scenario.

👉 [View Scrum Planning](https://cinema-management.atlassian.net/jira/software/projects/SCRUM/boards/1/backlog?assignee=unassigned%2C712020%3Ab31674b5-9843-46c3-a9dd-d40b9d94dc7e&atlOrigin=eyJpIjoiZTczOTkwMzQ1MDAwNGVmMzg0NDk2YTU0YjQ3YWU1MzgiLCJwIjoiaiJ9)

## Contents
- 📄 Documentation (PDF)
- 🌐 Application Code (Java auth, Python business API, React frontend)
- ⚙️ Setup Instructions

---

## Run with Docker

All components are containerized with Docker Compose.

### Prerequisites
- Docker and Docker Compose installed

### Start the stack
```
cd Infrastructure
docker-compose up -d
```
Services:
- Frontend: `http://localhost:5173`
- Business API (Flask): `http://localhost:5000`
- Auth (Quarkus): `http://localhost:8081`
- Keycloak: `http://localhost:8080`

### Stop the stack
```
docker-compose down
```

### Seed monthly movies (admin only)
We provide two ingestion modes from `Backend/python/data/monthly_movies.json`:

1) Simple (no external enrichment):
```
curl -X POST http://localhost:5000/api/movies/seed-monthly-simple
```

2) OMDB-enriched (fetches real metadata and persists it):
```
curl -X POST http://localhost:5000/api/movies/seed-monthly
```

To enable OMDB enrichment set the environment variable `OMDB_API_KEY` (free key from omdbapi.com). When running with Docker Compose, add `OMDB_API_KEY` to `Infrastructure/.env` and re-run:
```
docker-compose down
docker-compose up -d
```
After logging in as an admin, the frontend shows a “Seed Monthly” button on the calendar header.

---

## CI (GitHub Actions)

A basic CI pipeline validates Python formatting with Black and runs ESLint on the frontend:
- Workflow file: `.github/workflows/ci.yml`
- Jobs:
  - `python-black`: installs Black and runs `black --check Backend/python`
  - `frontend-lint`: installs Node dependencies and runs `npm run lint` in `frontend/frontend`

### Local CI runs (commands and results)

Black check:
```
python -m pip install --upgrade pip
python -m pip install black
python -m black --check Backend/python

Oh no! 💥 💔 💥
17 files would be reformatted, 2 files would be left unchanged.
```

ESLint:
```
cd Frontend/frontend
npm install
npm run lint

✖ 12 problems (10 errors, 2 warnings)
- Most errors: Unexpected any in api/* (authApi.ts, userApi.ts)
- One warning: react-hooks/exhaustive-deps in CatalogPage (addressed in code)
```

Notes:
- Black reports formatting differences; the CI job will fail until code is formatted (run `black Backend/python`).
- ESLint errors originate from `any` typing in `api/*`; convert to proper TypeScript types or add safe generics. The CI job will fail until fixed (`npm run lint`).

---

## Notes
- Frontend calendar allows registering screenings with default preselected values (movie, room, current date, and a time slot).
- For authentication, use the Keycloak instance included in the Docker stack.

---

## Movie Data Source and Ingestion

- Source: The list of movies comes from a monthly company report (`Backend/python/data/monthly_movies.json`).
- Enrichment: The Business API integrates with OMDB to fetch real movie metadata (title, year, director, plot, poster, rating) when preloading via the OMDB-based endpoints.
- Persistence: Fetched movie data is saved in the database so the UI can offer fixed lists (movies and rooms).
- User Flow: Users only select from fixed lists of movies and rooms; the only variable input is the screening time (date is preselected as today and can be changed, time is chosen from predefined slots).

---

## Docker Status (Images and Services)

Below are the latest status captures to verify the stack quickly.

### Services
```
NAME                        IMAGE                            STATUS                    PORTS
flask-cinema                infrastructure-business-api      Up (healthy)              0.0.0.0:5000->5000/tcp
infrastructure-keycloak-1   quay.io/keycloak/keycloak:26.0   Up (healthy)              0.0.0.0:8080->8080/tcp
mysql-java                  mysql:8.0                        Up (healthy)              0.0.0.0:3306->3306/tcp
postgres-python             postgres:16-alpine               Up (healthy)              0.0.0.0:5432->5432/tcp
quarkus-auth                infrastructure-authentication    Up                         0.0.0.0:8081->8080/tcp
react-frontend              infrastructure-frontend          Up                         0.0.0.0:5173->5173/tcp
```

### Images
```
REPOSITORY                      TAG         IMAGE ID       SIZE
infrastructure-business-api     latest      ab7dd4d226c9   694MB
infrastructure-authentication   latest      2cac04d5293a   447MB
infrastructure-frontend         latest      ec90711a9252   565MB
postgres                        16-alpine   79c06d285ed9   394MB
mysql                           8.0         f37951fc3753   1.07GB
quay.io/keycloak/keycloak       26.0        09a381c715ab   691MB
```

Reproduce locally:
- `docker-compose ps`
- `docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"`
- `docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.Size}}"`


