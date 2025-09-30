# Docker Setup for NCC GIS App

This project now includes Docker configuration to easily run both the frontend and backend services with a single command.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)

## Quick Start

To start both services:

```bash
docker-compose up
```

To start in detached mode (background):

```bash
docker-compose up -d
```

To stop the services:

```bash
docker-compose down
```

## Services

### Backend (Node.js/Express)
- **Port**: 3001
- **URL**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health
- **Database**: SQLite databases are persisted in the `./database` directory

### Frontend (Expo/React Native)
- **Expo Dev Server**: http://localhost:8081
- **Web Version**: http://localhost:19006
- **Hot Reloading**: Enabled for development

## Development Commands

### Build and start services
```bash
docker-compose up --build
```

### View logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend
```

### Access container shell
```bash
# Backend container
docker-compose exec backend sh

# Frontend container
docker-compose exec frontend sh
```

### Restart a specific service
```bash
docker-compose restart backend
docker-compose restart frontend
```

## Database Persistence

The SQLite databases (`user.db` and `images.db`) are mounted as volumes, so your data will persist between container restarts.

## Network

Both services communicate through a custom Docker network (`ncc-network`). The frontend can reach the backend at `http://backend:3001` from within the Docker network.

## Troubleshooting

### Port conflicts
If you get port conflicts, you can modify the ports in `docker-compose.yml`:
```yaml
ports:
  - "3002:3001"  # Change 3001 to 3002 on host
```

### Rebuild after code changes
```bash
docker-compose down
docker-compose up --build
```

### Clear all data and start fresh
```bash
docker-compose down -v
docker-compose up --build
```

## Production Considerations

This setup is optimized for development. For production:

1. Use production-ready base images
2. Set up proper environment variables
3. Configure reverse proxy (nginx)
4. Set up proper logging
5. Use external database instead of SQLite
6. Enable SSL/TLS certificates


