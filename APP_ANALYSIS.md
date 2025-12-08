# Task Management System - Comprehensive Analysis

**Analysis Date:** December 6, 2025  
**Stack:** Node.js/Express/TypeScript + React/Vite/TypeScript  
**Database:** SQLite with Prisma ORM

---

## 📋 Executive Summary

A full-stack **role-based task management system** with real-time collaboration features. The app enables Admins to manage users, Managers to create and assign tasks, and Employees to track and update task status with Web Push notifications and Socket.io real-time updates.

---

## 🏗️ Architecture Overview

```
taskmgt/
├── backend/                 # Node.js/Express server (port 4000)
│   ├── src/
│   │   ├── app.ts          # Express app setup with routes & middleware
│   │   ├── server.ts       # HTTP server + Socket.io initialization
│   │   ├── controllers/    # Business logic (Auth, Admin, Manager, Task, Employee)
│   │   ├── routes/         # API endpoints (auth, admin, tasks, manager, employee, push)
│   │   ├── middleware/     # JWT auth, role-based access, file uploads
│   │   ├── sockets/        # Real-time notifications (Socket.io, Web Push)
│   │   ├── utils/          # Password hashing, Web Push utilities
│   │   └── db/             # Prisma client instance
│   ├── prisma/
│   │   ├── schema.prisma   # Data models (User, Company, Task, etc.)
│   │   └── migrations/     # DB schema change history
│   ├── scripts/            # Seed data, utilities
│   └── uploads/            # Company logos, carousel images, user profiles
│
├── frontend/               # React/Vite app (port 5173)
│   ├── src/
│   │   ├── main.tsx        # Route setup (React Router)
│   │   ├── api/
│   │   │   └── api.ts      # Axios client with credentials
│   │   ├── components/     # Reusable UI (Header, TaskCard, Loader, Toast)
│   │   ├── hooks/          # useToast custom hook
│   │   ├── pages/          # Role-based pages
│   │   │   ├── Login.tsx
│   │   │   ├── Profile.tsx
│   │   │   ├── Admin/      # AdminHome, CompanyEdit, People, AssignTeam
│   │   │   ├── Manager/    # ManagerHome, TaskBoard, AddTask, CompletedTasks
│   │   │   └── Employee/   # EmployeeHome, MyBoard, ColleagueBoard
│   │   ├── socket/         # Socket.io client
│   │   ├── utils/          # Web Push registration & handling
│   │   └── index.css       # Tailwind CSS
│   ├── public/             # Service worker (sw.js)
│   └── vite.config.ts      # Vite build config
│
└── README.md               # Setup instructions
```

---

## 🗄️ Database Schema (Prisma Models)

### **User Model**
- **Fields:**
  - `id` (Primary Key)
  - `role` (ADMIN | MANAGER | EMPLOYEE)
  - `name`, `username` (unique), `hashedPassword`
  - `address`, `dob`, `profileImage`
  - `managerId` (nullable FK) → manager relation with **SetNull on delete**
  - `createdAt`, `updatedAt`

- **Relations:**
  - `manager` ← Many-to-One (soft delete via SetNull)
  - `employees` ← One-to-Many (reverse of manager)
  - `subscriptions` ← One-to-Many (Web Push subscriptions)
  - `createdTasks` ← One-to-Many (Tasks created by this user)
  - `taskAssignments` ← One-to-Many (Task assignments to this user)
  - `statusHistories` ← One-to-Many (Task status changes by this user)

### **Company Model**
- `id`, `name`, `logo`, `carouselImages` (JSON string), `createdAt`, `updatedAt`

### **Task Model**
- `id`, `title`, `description`, `priority`, `status` (TODO, IN_PROGRESS, DONE)
- `createdById` (FK → User) with **Cascade on delete**
- `completedAt` (nullable)
- Relations: `assignments`, `histories` (both with Cascade)

### **TaskAssignment Model**
- `id`, `taskId` (FK → Task), `employeeId` (FK → User)
- `assignedAt`, `unassignedAt` (nullable)
- Relations: both FKs have **Cascade on delete**

### **TaskStatusHistory Model**
- Audit trail: `taskId`, `userId`, `fromState`, `toState`, `timestamp`
- Relations: both FKs have **Cascade on delete**

### **PushSubscription Model**
- `id`, `userId` (FK → User), `endpoint`, `keys` (JSON string)
- FK has **Cascade on delete**

**Key Change (Dec 5, 2025):**
- Manager → Employee relation changed from `Cascade` to `SetNull`
- When a manager is deleted, employees lose their manager assignment but remain in the system

---

## 🔐 Authentication & Authorization

### **Login Flow**
1. User submits `username` + `password` to `POST /auth/login`
2. Backend validates credentials via bcrypt
3. JWT token created: `{ id, role }`
4. Token stored in HTTP-only cookie (`httpOnly: true`, `sameSite: lax`)
5. Admin: session cookie only (cleared on browser close)
6. Manager/Employee: optional 30-day persistence with `remember` flag

### **Middleware**
- `authMiddleware`: Verifies JWT token in cookie, loads full user object
- `requireRole(roles)`: Role-based access control (ADMIN, MANAGER, EMPLOYEE)

### **Token Payload**
```javascript
{ id: <user_id>, role: "ADMIN" | "MANAGER" | "EMPLOYEE" }
```

---

## 📡 API Endpoints

### **Auth Routes**
| Method | Endpoint | Auth | Role | Function |
|--------|----------|------|------|----------|
| POST | `/auth/login` | ❌ | — | Login, set token cookie |
| POST | `/auth/logout` | ✅ | — | Clear token cookie |
| GET | `/auth/me` | ✅ | — | Get current user details |

### **Admin Routes**
| Method | Endpoint | Auth | Role | Function |
|--------|----------|------|------|----------|
| GET | `/admin/company` | ✅ | — | Get company info |
| PUT | `/admin/company` | ✅ | ADMIN | Update company (logo, carousel) |
| GET | `/admin/managers` | ❌ | — | List all managers |
| POST | `/admin/managers` | — | — | Create manager (no auth?) |
| PUT | `/admin/managers/:id` | ✅ | — | Update manager |
| DELETE | `/admin/users/:id` | ✅ | — | Delete user (manager or employee) |
| GET | `/admin/employees` | ✅ | — | List all employees |
| POST | `/admin/employees` | — | — | Create employee (no auth?) |
| GET | `/admin/managers/:id` | ✅ | — | Get manager + employees |
| PUT | `/admin/users/:id` | ✅ | — | Update user |
| POST | `/admin/upload/logo` | ✅ | ADMIN | Upload company logo |
| POST | `/admin/upload/carousel` | ✅ | ADMIN | Upload carousel images (max 6) |
| POST | `/admin/upload/profile/:userId` | ✅ | — | Upload user profile picture |

### **Task Routes**
| Method | Endpoint | Auth | Role | Function |
|--------|----------|------|------|----------|
| GET | `/tasks/list` | ✅ | MANAGER | List manager's tasks |
| POST | `/tasks/create` | ✅ | MANAGER | Create task + assign employees |
| PUT | `/tasks/:id` | ✅ | MANAGER | Update task (status, title, etc.) |
| DELETE | `/tasks/:id` | ✅ | MANAGER | Delete task (push notification to assignees) |
| POST | `/tasks/:id/assign` | ✅ | MANAGER | Assign employee to task |
| POST | `/tasks/:id/unassign` | ✅ | MANAGER | Remove employee from task |
| POST | `/tasks/:id/move` | ✅ | MANAGER | Move task to different status |

### **Manager Routes**
| Method | Endpoint | Auth | Role | Function |
|--------|----------|------|------|----------|
| GET | `/manager/:managerId/boards` | ✅ | — | Get task board (Kanban layout) |
| GET | `/manager/:managerId/tasks` | ✅ | — | Get manager's tasks (list view) |
| GET | `/manager/:managerId/completed` | ✅ | — | Get completed tasks |
| GET | `/manager/:managerId/employees` | ✅ | — | Get manager's employees |

### **Employee Routes**
| Method | Endpoint | Auth | Role | Function |
|--------|----------|------|------|----------|
| GET | `/employee/:employeeId/board` | ✅ | — | Employee's task board (assigned tasks) |
| GET | `/employee/:employeeId/colleagues` | ✅ | — | Colleagues (other employees under same manager) |

### **Push Routes**
| Method | Endpoint | Auth | Role | Function |
|--------|----------|------|------|----------|
| POST | `/push/subscribe` | ✅ | — | Register Web Push subscription |
| POST | `/push/unsubscribe` | ✅ | — | Remove Web Push subscription |

### **⚠️ Security Concerns Found**
1. **No auth on create manager/employee** (`POST /admin/managers`, `POST /admin/employees`) — anyone can create users
2. **No role check on DELETE /admin/users/:id** — non-admins can delete users
3. **No rate limiting** on auth endpoints (brute-force risk)
4. **No input validation** on many endpoints (e.g., missing dob parsing in updateUser)

---

## 🔄 Real-Time Features

### **Socket.io (Live Updates)**
- **Connection:** User joins socket room `user_${userId}` on login
- **Events:**
  - `task_created` → broadcast to all connected clients
  - `task_updated` → broadcast task changes
  - `task_deleted` → broadcast task removal
  - `notification_push` → send to specific user's room

### **Web Push Notifications**
- **Trigger Events:**
  - Task assigned: "New task assigned: {title}"
  - Task deleted: "Task deleted"
  - Task moved/updated: Custom notifications
- **Storage:** `PushSubscription` model stores endpoint + encryption keys
- **Implementation:** `web-push` package (VAPID keys required in `.env`)

### **Frontend Integration**
- Service Worker (`public/sw.js`) handles push events
- Socket.io client connects on load & joins user room
- Toast notifications for UI feedback

---

## 🎨 Frontend Pages & Components

### **Public Pages**
- **Login.tsx** → Email/password form, remember option

### **Admin Pages**
- **AdminHome.tsx** → Dashboard, user management shortcuts
- **CompanyEdit.tsx** → Update company name, logo, carousel images
- **People.tsx** → List all users, create/edit/delete managers & employees
- **AssignTeam.tsx** → Assign employees to managers

### **Manager Pages**
- **ManagerHome.tsx** → Dashboard, quick stats
- **TaskBoard.tsx** → Kanban board (TODO, IN_PROGRESS, DONE columns)
- **AddTask.tsx** → Create task, assign employees
- **CompletedTasks.tsx** → View completed/archived tasks

### **Employee Pages**
- **EmployeeHome.tsx** → Dashboard, assigned tasks summary
- **MyBoard.tsx** → Personal task board (assigned tasks only)
- **ColleagueBoard.tsx** → View colleagues' public tasks

### **Shared Components**
- **Header.tsx** → Navigation, user menu, logout
- **AppHeader.tsx** → Logo, company info
- **TaskCard.tsx** → Single task display with status, priority, assignee
- **GlassCard.tsx** → Glassmorphism card (UI kit)
- **NotificationStack.tsx** → Toast/notification display
- **LoaderOverlay.tsx** → Full-screen loading spinner
- **ToastProvider.tsx** → Toast context/hooks

### **UI Libraries**
- **Tailwind CSS** → Utility-first styling
- **React Router v6** → Client-side routing
- **react-hot-toast** → Toast notifications
- **Socket.io Client** → Real-time updates
- **@hello-pangea/dnd** → Drag-and-drop for Kanban board

---

## 📦 Dependencies

### **Backend**
| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.18.2 | HTTP server framework |
| @prisma/client | ^5.10.0 | ORM for database |
| prisma | ^5.10.0 | CLI for migrations |
| jsonwebtoken | ^9.0.0 | JWT token signing/verification |
| bcrypt | ^5.1.0 | Password hashing |
| socket.io | ^4.8.0 | Real-time communication |
| web-push | ^3.5.0 | Web Push notifications |
| multer | ^1.4.5-lts.2 | File upload handling |
| node-cron | ^3.0.2 | Scheduled tasks (unused?) |
| cors | ^2.8.5 | Cross-origin requests |
| cookie-parser | ^1.4.6 | Cookie parsing |
| dotenv | ^17.2.3 | Environment variables |

### **Frontend**
| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18.2.0 | UI library |
| react-dom | ^18.2.0 | DOM rendering |
| react-router-dom | ^6.17.0 | Client routing |
| socket.io-client | ^4.8.0 | Real-time client |
| axios | ^1.6.0 | HTTP client |
| react-hot-toast | ^2.4.1 | Toast notifications |
| @hello-pangea/dnd | 18.0.1 | Drag & drop (Kanban) |
| tailwindcss | ^3.4.4 | CSS framework |
| vite | ^5.2.0 | Build tool |

---

## ⚙️ Configuration Files

### **Backend**
- `.env` (SQLite file path, JWT secret, VAPID keys, ports)
- `tsconfig.json` (TypeScript compilation)
- `package.json` (scripts: dev, build, start, prisma commands)

### **Frontend**
- `.env` (VITE_API_URL, VITE_WS_URL)
- `vite.config.ts` (React plugin, alias if any)
- `tailwind.config.cjs` (Tailwind customization)
- `postcss.config.cjs` (PostCSS + Tailwind)
- `tsconfig.json` (TypeScript + React JSX)

### **Database**
- `prisma/schema.prisma` (7 models, SQLite)
- `prisma/migrations/` (version history, includes Dec 5 manager-setnull change)

---

## 📊 Database Relationships Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         User                                │
├─────────────────────────────────────────────────────────────┤
│ PK: id                                                      │
│ role: ADMIN | MANAGER | EMPLOYEE                           │
│ managerId (FK) → User[id] [SetNull on delete]              │
│                                                             │
│ ← employees: User[] (reverse of managerId)                 │
│ ← createdTasks: Task[]                                     │
│ ← taskAssignments: TaskAssignment[]                        │
│ ← statusHistories: TaskStatusHistory[]                     │
│ ← subscriptions: PushSubscription[]                        │
└─────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   Company        │ │     Task         │ │ PushSubscription │
├──────────────────┤ ├──────────────────┤ ├──────────────────┤
│ id               │ │ id               │ │ id               │
│ name             │ │ title            │ │ userId (FK)      │
│ logo             │ │ priority         │ │ endpoint (unique)│
│ carouselImages   │ │ status           │ │ keys             │
│                  │ │ createdById(FK) →│ │ createdAt        │
│                  │ │   ╔═══════╗      │ │                  │
│                  │ │ ╔→║ User.id║      │ │                  │
│                  │ │ ║ ╚═══════╝      │ │                  │
│                  │ │ ║                │ │                  │
│                  │ │ ║ assignments:  │ │                  │
│                  │ │ ║   TaskAssign[]│ │                  │
│                  │ │ ║ histories:    │ │                  │
│                  │ │ ║   TaskStatus[]│ │                  │
└──────────────────┘ └──────────────────┘ └──────────────────┘
                           │
                           ├─────────────────┐
                           ▼                 ▼
                    ┌──────────────────┐ ┌──────────────────┐
                    │ TaskAssignment   │ │TaskStatusHistory │
                    ├──────────────────┤ ├──────────────────┤
                    │ id               │ │ id               │
                    │ taskId (FK)→Task │ │ taskId (FK)→Task │
                    │ employeeId(FK)→U │ │ userId (FK)→User │
                    │ assignedAt       │ │ fromState        │
                    │ unassignedAt     │ │ toState          │
                    │                  │ │ timestamp        │
                    └──────────────────┘ └──────────────────┘
```

---

## 🚀 Development Workflow

### **Starting the Backend**
```bash
cd backend
npm install
npm run prisma:migrate    # Run pending migrations
npm run prisma:studio    # Open Prisma Studio at localhost:5555
npm run dev              # Start dev server (ts-node-dev)
```

### **Starting the Frontend**
```bash
cd frontend
npm install
npm run dev              # Vite dev server at http://localhost:5173
```

### **Building for Production**
```bash
# Backend
cd backend
npm run build            # Compile TypeScript to build/
npm start                # Run compiled JS

# Frontend
cd frontend
npm run build            # Build to dist/
npm run preview          # Preview production build locally
```

### **Database Management**
```bash
npm run prisma:migrate   # Create & run migrations
npm run prisma:studio    # Visual DB editor
npm run prisma:generate  # Regenerate Prisma client
npm run seed             # Seed sample data (if seed.ts exists)
```

---

## 🐛 Known Issues & Improvements

### **Security Issues** ⚠️
1. **Unauthenticated user creation** — Create manager/employee endpoints lack auth
2. **Missing role validation on delete** — Should only allow ADMINs to delete users
3. **No input validation** — Email format, strong passwords, XSS prevention
4. **No rate limiting** — Brute force attacks on login possible
5. **JWT expiration** — Tokens don't expire; should have refresh token mechanism
6. **CORS overly permissive** — Consider restricting to exact frontend domain

### **Functional Improvements**
1. **Task filtering/search** — No way to filter by title, assignee, status
2. **Pagination** — Large task lists not paginated
3. **Bulk operations** — No bulk assign/delete tasks
4. **Audit trail** — TaskStatusHistory exists but may not log all changes
5. **Soft delete** — Users deleted permanently; consider archiving instead
6. **Manager hierarchy** — Only single level (Manager ← Employees); no nested teams
7. **Notifications history** — No way to view past notifications

### **Code Quality**
1. **Error handling** — Generic error messages; should return specific codes
2. **Type safety** — Some `any` types in middleware (`req: any`)
3. **Unused dependencies** — `node-cron` imported but not used?
4. **No tests** — No Jest/Vitest test suites found
5. **Logging** — Console.log used; should use structured logging (Winston, Pino)

### **Performance**
1. **N+1 queries** — Some endpoints may query without select/include optimization
2. **Caching** — No Redis/cache layer for company data, user lists
3. **File storage** — Uploads stored locally; no CDN/cloud storage
4. **Database indexing** — Missing indexes on `username`, `createdById`, `taskId`

---

## 📝 Environment Variables Required

### **Backend (.env)**
```env
DATABASE_URL=file:./dev.db              # SQLite path
JWT_SECRET=<your-secret-key>            # JWT signing key
PORT=4000                               # Server port
FRONTEND_URL=http://localhost:5173      # CORS origin

# Web Push (VAPID keys from web-push)
VAPID_PUBLIC_KEY=<your-public-key>
VAPID_PRIVATE_KEY=<your-private-key>
VAPID_CONTACT=mailto:admin@example.com
```

### **Frontend (.env)**
```env
VITE_API_URL=http://localhost:4000      # Backend API base
VITE_WS_URL=http://localhost:4000       # WebSocket URL (same as API)
```

---

## 🎯 Feature Summary by Role

### **Admin**
✅ Create/edit managers & employees  
✅ Delete users (unassigns employees if manager deleted)  
✅ Manage company info (logo, carousel)  
✅ View all users & assignments  

### **Manager**
✅ Create tasks  
✅ Assign/unassign tasks to employees  
✅ Update task status (move between columns)  
✅ View own tasks & completed tasks  
✅ View assigned employees  
✅ Receive notifications on task updates  

### **Employee**
✅ View assigned tasks  
✅ Update task status  
✅ View colleagues' public tasks  
✅ View profile  
✅ Receive Web Push notifications  
✅ Real-time task updates via Socket.io  

---

## 📌 Recent Changes

**Date:** December 5, 2025  
**Change:** Manager → Employee relation updated from `onDelete: Cascade` to `onDelete: SetNull`  
**Impact:**
- Deleting a manager now unassigns employees (sets `managerId` to `null`) instead of deleting them
- **Migration:** `20251205145817_manager_setnull`
- **Test script:** `backend/scripts/testManagerDelete.ts` (verifies behavior)

---

## 🔍 Code Quality Checklist

| Item | Status | Notes |
|------|--------|-------|
| TypeScript strict mode | ❓ | Check `tsconfig.json` compilerOptions |
| Error boundary (React) | ❓ | No error boundary component found |
| Loading states | ✅ | LoaderOverlay component present |
| Form validation | ❓ | Client-side validation checks needed |
| Access control | ⚠️ | Some endpoints missing role checks |
| Database transactions | ❓ | Check Prisma transaction usage in critical ops |
| Secrets management | ✅ | Using .env for sensitive data |
| Logging | ❌ | Only console.log; no structured logging |
| API documentation | ❌ | No OpenAPI/Swagger docs found |
| Unit tests | ❌ | No test files in workspace |

---

## 💡 Recommendations (Priority Order)

### **🔴 Critical (Security)**
1. Add authentication to `POST /admin/managers` and `POST /admin/employees`
2. Add role check (`requireRole("ADMIN")`) to `DELETE /admin/users/:id`
3. Implement input validation & sanitization library (e.g., `joi`, `zod`)
4. Add JWT expiration & refresh token mechanism
5. Implement rate limiting (e.g., `express-rate-limit`)

### **🟠 High (Functionality)**
1. Add search/filter UI for tasks (by title, status, assignee)
2. Implement pagination for large lists
3. Add task status change audit logging (currently only stored in TaskStatusHistory)
4. Create automated tests (Jest + Supertest for API)
5. Set up structured logging (Winston or Pino)

### **🟡 Medium (Performance & UX)**
1. Add database indexes on `username`, `createdById`, `managerId`
2. Implement caching for company data & user lists (Redis if available)
3. Consider moving file uploads to cloud storage (AWS S3, Firebase)
4. Add error boundary component to catch React errors
5. Create `.env.example` file for setup reference

### **🟢 Low (Polish)**
1. Add API documentation (Swagger/OpenAPI)
2. Implement toast notification persistence (history view)
3. Add task templates or recurring tasks
4. Create mobile-responsive design improvements
5. Add dark mode toggle

---

## ✅ Conclusion

**Your app is a well-structured full-stack task management system** with good separation of concerns, TypeScript, modern tooling, and real-time features. The main areas for improvement are **security hardening** (auth validation, input sanitization) and **observability** (logging, testing, error handling). The recent manager-setnull change correctly addresses the employee deletion issue when a manager is removed.

