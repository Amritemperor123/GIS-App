# Access Control System

This app implements a comprehensive access control system with two user types: Normal Users and Service Providers.

## User Types

### Normal Users
- **Access**: Can view the map and upload images
- **Functionality**: 
  - View interactive map with sector polygons
  - Upload images with location data
  - Automatic notification to relevant service providers based on location

### Service Providers
- **Access**: Can view the map and access a dedicated dashboard
- **Functionality**:
  - View interactive map with sector polygons
  - Access dashboard to view notifications
  - Receive notifications when users upload images in their assigned sector

## Authentication

### Demo Credentials

**Normal Users:**
- Email: Any email address
- Password: Any password

**Service Providers:**
- Email: `jeet@example.com` (First Sector Provider)
- Email: `aman@example.com` (Second Sector Provider)
- Password: Any password

## How It Works

### Location-Based Notifications

1. **Normal User Uploads Image:**
   - User selects image from gallery
   - App gets current location
   - System checks which sector polygon contains the location
   - Notification is sent to the service provider for that sector

2. **Service Provider Receives Notification:**
   - Notification appears in their dashboard
   - Shows image, location, uploader name, and timestamp
   - Can mark notifications as read

### Sector Assignment

The system uses the `data.geojson` file to define sectors:
- **First Sector**: Provider "Jeet"
- **Second Sector**: Provider "Aman"

Each polygon in the GeoJSON file represents a service area, and the system automatically determines which service provider should receive notifications based on the user's location.

## File Structure

```
frontend/
├── contexts/
│   ├── AuthContext.tsx          # Authentication state management
│   └── NotificationContext.tsx  # Notification state management
├── utils/
│   └── locationUtils.ts         # Location-based sector detection
├── components/
│   └── ProtectedRoute.tsx       # Route protection wrapper
├── app/
│   ├── login.tsx               # Login screen
│   ├── dashboard.tsx           # Service provider dashboard
│   └── index.tsx               # Main app screen
└── assets/layers/
    └── data.geojson            # Sector polygon definitions
```

## Key Features

- **Automatic Authentication**: Users are automatically redirected to login if not authenticated
- **Role-Based Access**: Different interfaces for normal users vs service providers
- **Location-Based Routing**: Notifications are sent based on geographic location
- **Persistent Storage**: User sessions and notifications are stored locally
- **Real-time Updates**: Notifications appear immediately in service provider dashboard

## Usage Instructions

1. **For Normal Users:**
   - Login with any email/password
   - View the map to see sector boundaries
   - Tap "Upload Image" to select and upload an image
   - System will notify the appropriate service provider

2. **For Service Providers:**
   - Login with `jeet@example.com` or `aman@example.com`
   - View the map to see your assigned sector
   - Tap "View Dashboard" to see notifications
   - Tap on notifications to view details and mark as read

## Technical Implementation

- **Authentication**: Context-based state management with AsyncStorage persistence
- **Location Detection**: Point-in-polygon algorithm for sector determination
- **Image Upload**: Expo ImagePicker with location capture
- **Notifications**: Local storage with real-time updates
- **Protected Routes**: Automatic redirection for unauthenticated users
