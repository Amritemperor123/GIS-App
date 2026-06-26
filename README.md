# GIS App

## Project Overview

The GIS App is a location-based service designed to facilitate communication and task management between "normal users" and "service providers" concerning localized issues such as cleanup or incomplete work.

**Core Workflow:**
1.  **Issue Reporting:** Normal users can upload images at specific map locations to report an issue, which appears as a `red marker`.
2.  **Job Assignment:** The system identifies the relevant "sector" for the reported location and creates an "Active Job," notifying all service providers assigned to that sector. Notifications include an option to accept the job.
3.  **Job Acceptance:** Once a service provider accepts a job, other providers in the sector are notified, and the map marker changes to `orange`.
4.  **Work in Progress:** The accepted service provider travels to the location and uploads a "proof of presence" image. The marker then changes to `yellow`. (Image uploads are restricted to a 10-meter radius of the job location for service providers).
5.  **Job Completion:** After completing the work, the service provider uploads a final image, turning the marker `green`.
6.  **User Review:** The normal user who initially reported the issue receives a notification with the image thread and is prompted to review the quality of work.
7.  **Data Persistence:** After a set period, green markers are removed from the map (to keep it clean), but all job data is retained in the database.

## Technical Documentation

### Architecture

The application follows a client-server architecture, with a clear separation between the frontend mobile/web client and the backend API. Both services are designed to be containerized using Docker.

*   **Frontend (Client):** An Expo/React Native application that provides the user interface for map interaction, image uploads, notifications, and user-specific dashboards. It communicates with the backend via RESTful API calls.
*   **Backend (Server):** A Node.js/Express.js API responsible for handling all business logic, including user authentication, image storage, job creation, assignment and status updates, notification management, and database interactions.
*   **Database:** SQLite is used for local development and the Docker Compose setup to store user information (`user.db`) and image metadata (`images.db`).
*   **Architecture:** For detailed database architecture and the workflow of the entire application, refer to /diagrams.

### Key Features

*   **User Management:** Secure user authentication (login/signup) for both normal users and service providers.
*   **Geo-tagging & Image Uploads:** Normal users can upload images along with their geographical coordinates to report new issues.
*   **Dynamic Job Status Visualization:** Map markers change color in real-time to reflect the status of jobs (Red: new, Orange: accepted, Yellow: in progress, Green: completed).
*   **Sector-based Job Distribution:** Automated assignment of jobs to service providers based on predefined geographical sectors.
*   **Comprehensive Notification System:** Real-time alerts for new jobs, job acceptance, and work completion for relevant users.
*   **Service Provider Workflow:** Dedicated dashboard for service providers to accept, manage, and update the status of their assigned jobs with geo-fenced image uploads.
*   **User Feedback Loop:** Mechanism for normal users to review completed work after job finalization.

## Tech Stack

### Frontend

*   **Framework:** React Native (with Expo)
*   **Language:** TypeScript
*   **Styling:** NativeWind (utilizing Tailwind CSS principles)
*   **Map Integration:** Likely uses a mapping library compatible with React Native (e.g., `react-native-maps`).

### Backend

*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Language:** TypeScript
*   **Database:** SQLite

### Database

*   **Local/Development:** SQLite (`user.db`, `images.db`)

### Containerization

*   **Platform:** Docker
*   **Orchestration:** Docker Compose

## Build Guide

This project uses Docker Compose for an easy, unified setup of both frontend and backend services.

### Local Frontend Development

If you prefer to run the frontend locally outside of Docker (e.g., for easier debugging with Expo tools), ensure you have Node.js and npm/yarn installed.

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or yarn install
    ```

3.  **Start the Expo development server:**
    ```bash
    npx expo start
    ```
    This will open the Expo Dev Tools in your browser, where you can choose to run the app on a web browser, Android emulator, or iOS simulator.
    **Note:** When running the frontend locally, you will need to ensure the backend is accessible. If running the backend locally (not in Docker), it will typically be on `http://localhost:3001`. If the backend is running via Docker Compose, you may need to configure the API URL in your local frontend environment to point to `http://localhost:3001` (assuming port mapping is correct).

## Development Guide

### Project Structure

The project is organized into `backend` and `frontend` directories, along with other supporting files.

*   `backend/`: Contains the Node.js/Express.js API.
    *   `src/`: TypeScript source files.
        *   `index.ts`: The main entry point of the backend application.
        *   `db/database.ts`: Handles database connection and ORM logic (e.g., SQLite interactions).
        *   `routes/`: Defines the API endpoints (e.g., `auth.ts`, `images.ts`, `jobs.ts`, `notifications.ts`, `users.ts`).
        *   `types.ts`: TypeScript type definitions for the backend.
*   `frontend/`: Contains the Expo/React Native application.
    *   `app/`: Core application screens/routes (e.g., `dashboard.tsx`, `login.tsx`, `my-uploads.tsx`). This project uses file-based routing with Expo Router.
    *   `assets/`: Static assets like images (`images/`) and geographical data (`layers/data.geojson`).
    *   `components/`: Reusable UI components (e.g., `MapView.tsx`, `ProtectedRoute.tsx`).
    *   `constants/`: Application-wide constants, such as `theme.ts`.
    *   `contexts/`: React Contexts for global state management (e.g., `AuthContext.tsx`, `JobsContext.tsx`, `NotificationContext.tsx`).
    *   `hooks/`: Custom React hooks for encapsulating reusable logic.
    *   `types/`: TypeScript type definitions for the frontend.
    *   `utils/`: Utility functions (e.g., `api.ts` for API interactions, `locationUtils.ts`).
    *   `tailwind.config.js`: Configuration for NativeWind/Tailwind CSS styling.
*   `database/`: (Created by Docker volume) Persists SQLite database files for the backend.
*   `diagrams/`: Contains project diagrams (e.g., `GIS Planning.pdf`, `GIS Schema.pdf`).
*   `docker-compose.yaml`: Defines and orchestrates the Docker containers for the backend and frontend.
*   `DOCKER_SETUP.md`: Detailed guide for Docker setup and common commands.

### Environment Variables

*   **Frontend (Docker Build Arg):** `VITE_API_URL` is passed as a build argument to the frontend Dockerfile to configure the backend API endpoint. When running with `docker-compose up`, this is automatically set to `http://backend:3001`.

### Database Persistence

When using Docker Compose, the SQLite database files (`user.db` and `images.db`) are stored in the `./database` directory on your host machine. This ensures that your data persists even if the Docker containers are removed or recreated.
