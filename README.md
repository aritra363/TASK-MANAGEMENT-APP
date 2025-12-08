# Task Management System

A full-stack task management application with role-based access control (Admin, Manager, Employee).

## Project Structure

```
taskmgt/
├─ backend/          - Node.js/Express backend with TypeScript
├─ frontend/         - React frontend with Vite
└─ README.md
```

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env`:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/taskmgt
   NODE_ENV=development
   PORT=5000
   ```

4. Run migrations:
   ```bash
   npm run prisma migrate dev
   ```

5. Seed the database (optional):
   ```bash
   npm run seed
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

## Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env`:
   ```
   VITE_API_URL=http://localhost:5000/api
   VITE_WS_URL=http://localhost:5000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## Features

- **Admin Dashboard**: Manage company settings, users, and permissions
- **Manager Dashboard**: Create and manage tasks, assign to teams
- **Employee Dashboard**: View assigned tasks, update status, collaborate
- **Real-time Updates**: Socket.io for live task updates
- **Web Push Notifications**: Stay notified of task changes
- **File Uploads**: Upload company logo, carousel images, and profiles

## Tech Stack

### Backend
- Node.js with Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Socket.io
- Web Push

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Socket.io Client

## License

ISC
