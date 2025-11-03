# GIS App

## Project Description

This GIS project has several deliverables. The ground up service of this project is discussed below.
1. There are two main type of users, the `normal_user` and the `service_provider`. 
2. The map is divided into various small `sector`s, and each sector can have single or multiple `service_provider`s assigned to it. 
3. The `normal_user`s can upload an image anywhere in the map, implying that specific location has not recieved proper cleanup or the work is incomplete.
4. This image, uploaded by the `normal_user`, will be visible in the map with a `red marker` and will be availble for anyone to see by just clicking on the marker.
5. This application will check inside which `sector` this location falls, and send a notification to all the `service_provider`s of that `sector` notifying that there is an **Active Job**. This notiification will include an option to **Accept** the job.
6. When any `service_provider` accepts the job, the rest of the `service_provider`s of that `sector` will recieve another notification saying that **This job has been accepted by Service Provider ___.** This event will change the `red marker` on the map into a `orange marker`.
7. When the said `service_provider` reach the location to start working, he/she is required to upload another image of that site in the map as a proof of their presence. This newly uploaded image by the `service_provider` will be displayed next to the previous image uploaded by the `normal_user` under the same location marker, and this event will change the `orange marker` into a `yellow marker` on the map.
8. After the **Job** is finished from the `service_provider`'s side, they'll upload another image under the same location marker, which will show the completed work. This even will change the `yellow marker` into a `green marker`.
9. After the marker turns green, the uploader of the initial image *(being the first `normal_user` mentioned)* will recieve a notification in their application which will have the image thread uploaded on that location and the user will be asked for a **Review regarding the Quality of Work by the Service Provider.**
10. After being active for a specific amount of time, the green marker will be removed from the map, but the data will be kept in the database.  
---

## Application Features

### For Normal Users:

- **Authentication:** Login and Signup.
- **Image Upload:** Can upload images with location data.
- **My Uploads:** Can view a gallery of their own uploaded images with timestamps.
- **Job Tracking:** Can see the status of their created jobs via marker color changes on the map.
- **Notifications:** Receive a notification when a job is completed, with all associated images and a request for review.

### For Service Providers:

- **Authentication:** Login.
- **Dashboard:** A dedicated dashboard to manage jobs and notifications.
- **Job Management:**
    - Receive notifications for new jobs in their assigned sector.
    - Accept jobs.
    - View active jobs and their status (accepted, in-progress, completed).
    - Upload images to update job status (work in progress, completed).
    - The ability to upload images is restricted to a 10-meter radius of the job location.
- **Statistics:** View statistics on completed jobs, total jobs, and unread notifications.
- **Notifications:**
    - Receive notifications for new jobs.
    - Receive notifications when another service provider accepts a job in their sector.
---

## User Manual

This user manual provides a detailed guide to the features and functionality of the GIS mobile application.

### Getting Started

#### 1. Sign Up

-   **Create an Account:** New users can create an account by providing a username, contact number, and password.
-   **User Type:** You can sign up as a **Normal User** or a **Service Provider**.
    -   **Normal Users** can upload images and track the status of their jobs.
    -   **Service Providers** are assigned to specific sectors and can accept and manage jobs.
-   **Sector ID (for Service Providers):** If you sign up as a Service Provider, the app will automatically detect your sector based on your location. You can also manually select a sector from a list.

#### 2. Login

-   **Welcome Back:** Existing users can log in with their username and password.
-   **Forgot Password:** (Not Implemented)

### Main Map Screen

The main screen of the application is a map that displays job markers. The color of the markers indicates the status of the job:

-   **Red:** New job, not yet accepted.
-   **Orange:** Job accepted by a Service Provider.
-   **Yellow:** Service Provider has started working on the job.
-   **Green:** Job completed.

#### For Normal Users:

-   **Upload Image:** Tap the camera icon to upload an image of a location that needs cleaning. The app will use your current location to create a new job.
-   **Sidebar Menu:** Tap the profile icon to open the sidebar menu, where you can access:
    -   **Notifications:** View notifications related to your jobs.
    -   **My Uploads:** See a gallery of all the images you have uploaded.
    -   **Statistics:** (Not Implemented)
    -   **Logout:** Log out of the application.

#### For Service Providers:

-   **Sidebar Menu:** Tap the profile icon to open the sidebar menu, where you can access:
    -   **Dashboard:** View your dashboard with job statistics and notifications.
    -   **Notifications:** View all notifications for your sector.
    -   **Statistics:** (Not Implemented)
    -   **Logout:** Log out of the application.

### Service Provider Dashboard

This screen is exclusively for Service Providers and provides an overview of their work.

-   **Statistics:** View key statistics, including:
    -   **Completed Works:** The number of jobs you have completed.
    -   **Total Jobs:** The total number of jobs in your sector.
    -   **Unread Notices:** The number of unread notifications.
-   **Active Job:** View the details of the job you are currently working on, including its status and any uploaded images.
-   **Notifications:** See a list of all notifications for your sector. You can tap on a notification to view more details.

### My Uploads (for Normal Users)

This screen displays a gallery of all the images you have uploaded, along with the date and time of each upload.

### Notifications

This screen displays a list of all your notifications.

-   **For Normal Users:** You will receive notifications when the status of a job you created changes.
-   **For Service Providers:** You will receive notifications for new jobs in your sector and when another provider accepts a job.

### Profile

-   **Edit Profile:** You can update your username, contact number, and (for Service Providers) your sector.
-   **Logout:** Log out of the application.
-   **Delete Account:** Permanently delete your account and all associated data.

### Statistics

This screen is a placeholder and does not yet contain any information.

---

## Technical Insights

This project is a full-stack application with a React Native frontend and a Node.js backend.

### Backend

The backend is built with Node.js and Express.js, providing a RESTful API for the frontend.

- **Framework:** Express.js
- **Database:** SQLite is used for the database. The data is stored in three separate database files:
    - `user.db`: Stores user information, including usernames, contact details, passwords (note: passwords are not hashed), user types (`normal` or `service_provider`), and assigned sectors for service providers.
    - `images.db`: Stores information about uploaded images, including the user who uploaded them, the image data (as a base64 string), the location, and a timestamp.
    - `notifications.db`: Stores notifications for users.
- **API Endpoints:** The backend exposes the following API endpoints:
    - `GET /api/health`: A health check endpoint.
    - `POST /api/signup`: For user registration.
    - `POST /api/login`: For user authentication.
    - `PUT /api/users/:id`: To update user information.
    - `DELETE /api/users/:id`: To delete a user and their associated images.
    - `POST /api/images`: To upload an image.
    - `GET /api/images`: To retrieve all images.
    - `GET /api/notifications/:userId`: To get all notifications for a specific user.
    - `POST /api/notifications`: To create a new notification.
- **Middleware:**
    - `cors`: To enable Cross-Origin Resource Sharing.
    - `morgan`: For logging HTTP requests.

### Frontend

The frontend is a cross-platform mobile application built with React Native and Expo.

- **Framework:** React Native with Expo, allowing the application to run on iOS, Android, and the web from a single codebase.
- **Language:** TypeScript
- **Styling:** NativeWind is used for styling, which provides a Tailwind CSS-like experience in React Native.
- **Navigation:** Expo Router is used for file-based routing and navigation.
- **Key Libraries:**
    - **`react-native-maps`:** For displaying the map and markers.
    - **`expo-image-picker`:** For selecting images from the device's gallery or camera.
    - **`expo-location`:** For retrieving the device's GPS location.
    - **`@react-native-async-storage/async-storage`:** For persistent data storage on the device.
- **State Management:** The application uses React's Context API for managing global state, with separate contexts for:
    - `AuthContext`: To manage user authentication state.
    - `JobsContext`: To manage job-related data.
    - `NotificationContext`: To manage notifications.

### Communication

The frontend communicates with the backend via a REST API. The API endpoints are defined in the backend and are called from the frontend using `fetch` or a library like `axios`.

### Data Flow Example: Image Upload

1.  A `normal_user` selects an image to upload using `expo-image-picker`.
2.  The app gets the user's current location using `expo-location`.
3.  The image is converted to a base64 string.
4.  The frontend sends a `POST` request to the `/api/images` endpoint with the user's ID, the base64 image string, the location, and the sector.
5.  The backend receives the request and inserts a new record into the `images.db` database.
6.  The backend then queries the `user.db` database to find all `service_provider`s in that sector.
7.  For each `service_provider`, the backend inserts a new notification into the `notifications.db` database.
8.  The `service_provider`s receive a notification on their devices.

---

## Start Development

This guide will help you get the project up and running on your local machine.

### Prerequisites

Make sure you have the following software installed:

-   **Node.js and npm:** [https://nodejs.org/](https://nodejs.org/)
-   **Expo CLI:** `npm install -g expo-cli`
-   **Git:** [https://git-scm.com/](https://git-scm.com/)

### Backend Setup

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```

2.  **Navigate to the backend directory:**

    ```bash
    cd backend
    ```

3.  **Install dependencies:**

    ```bash
    npm install
    ```

4.  **Run the server:**

    ```bash
    npm start
    ```

    The backend server will start on `http://localhost:3001`.

### Frontend Setup

1.  **Navigate to the frontend directory:**

    ```bash
    cd frontend
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Run the app:**

    ```bash
    npm start
    ```

    This will start the Metro bundler. You can then run the app on an Android emulator, iOS simulator, or in your web browser.

### Database

The project uses SQLite for the database. The database files (`user.db`, `images.db`, and `notifications.db`) are automatically created in the `database` directory when the backend server is started for the first time.
