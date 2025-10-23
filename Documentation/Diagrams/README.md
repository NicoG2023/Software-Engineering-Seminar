# 🎬 Cinema Management System Diagrams
The diagrams provide a visual representation of the system’s architecture and its core functionalities, including the reference architecture and the use case diagram (more to be added in the future).  
They serve as documentation to better understand how the system is designed and how different actors interact with it.

---

## Architecture Diagram
The following diagram shows the reference architecture of the system:

![Architecture Diagram](Arquitecture%20Diagram.png)

---

## Use Case Diagram
This diagram describes the main interactions between actors and the system:

![Use Case Diagram](Use%20Case%20Diagram.png)

---

## Class Diagram for Python Backend
This diagram illustrates the structure and relationships within the Python-based microservice that handles the cinema’s business logic. It shows the main controllers (MovieController, TheaterRoomController) and their interaction with data models such as Movie, Screening, TheaterRoom, and Ticket. The relationships define how movies, showtimes, and rooms are managed within the system.

![Class Diagram](Python%20Class%20Diagram.jpeg)

---

## Class Diagram for Java Backend
This diagram represents the authentication microservice developed with Quarkus and Keycloak. It details the main classes (AuthAdminResource and KcAdminService) and their interaction with the Keycloak Admin API for managing users, roles, and authentication tasks within the system.

![Class Diagram](Java%20Class%20Diagram.jpeg)

---

## Database Diagram
This diagram represents the **relational database schema** for the Cinema Management System. It defines how data is structured and interconnected across the system’s entities. The main tables include, `MOVIE`, `THEATER_ROOM`, `SCREENING`, `TICKET`, and `GENRE`.   
- **MOVIE** and **GENRE** manage film information and classifications.  
- **THEATER_ROOM** defines the physical rooms where screenings occur.  
- **SCREENING** links movies to rooms with specific dates, times, prices, and seat availability.  
- **TICKET** records purchases, seat numbers, and ticket status for each user and screening.

![Database Diagram](Database%20Diagram.jpg)

---

## Business Model Proccess for Customer Role
This diagram outlines the business workflow from the perspective of the Customer, showing how users interact with the Cinema (Information Controller) and the Content Provider. It includes processes such as checking movie listings, requesting showtime information, booking reservations, and receiving confirmations or updates from the cinema.

![Business Model Process](BusinessModelProcessCustomer.jpeg)

---

## Deployment Diagram
This diagram describes the system’s deployment architecture using Azure Cloud. It shows how each component — frontend, API gateway, and microservices — is containerized and deployed through a CI/CD pipeline using GitHub Actions and Docker. It also depicts the interaction with Azure-managed databases for MySQL (authentication) and PostgreSQL (movie scheduling and screenings).

![Deployment Diagram](Deployment%20Diagram.jpeg)

---

## 🛠️ Technologies Used
- **Backend**:  
  - Authentication microservice with Quarkus + Keycloak  
  - Business logic microservice in Python (Flask)

- **Frontend**: React.js using Typescript

- **Others**:  
  - Docker  
  - GitHub Actions (CI/CD)  
  - PostgreSQL
  - MySQL

---

