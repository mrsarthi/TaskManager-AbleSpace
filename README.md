# Collaborative Task Manager

A full-stack, production-ready Task Management application built with modern JavaScript/TypeScript technologies. This application enables teams to collaborate on tasks with real-time updates, comprehensive filtering, and a beautiful, responsive user interface.

## 🚀 Features

### Core Functionality
- **User Authentication & Authorization**: Secure registration and login with JWT tokens stored in HttpOnly cookies
- **Task Management (CRUD)**: Full create, read, update, and delete operations for tasks
- **Real-Time Collaboration**: Live updates using Socket.io when tasks are modified
- **User Dashboard**: Personal views showing assigned tasks, created tasks, and overdue items
- **Filtering & Sorting**: Filter tasks by status and priority, sort by due date
- **Notifications**: In-app notifications when tasks are assigned to you

### Technical Highlights
- **Backend Architecture**: Clean separation with Controllers, Services, and Repositories
- **DTO Validation**: All API endpoints validated using Zod schemas
- **Type Safety**: Full TypeScript implementation across frontend and backend
- **Real-Time Updates**: Socket.io integration for instant task updates
- **Optimistic UI**: Immediate feedback for better user experience
- **Audit Logging**: Track all task changes with detailed audit logs
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## 📋 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **SWR** for data fetching and caching
- **React Hook Form** with Zod validation
- **Socket.io Client** for real-time communication
- **React Router** for navigation

### Backend
- **Node.js** with **Express** and TypeScript
- **PostgreSQL** database
- **Prisma** ORM for database operations
- **Socket.io** for real-time communication
- **JWT** for authentication
- **bcrypt** for password hashing
- **Zod** for runtime validation

## 🏗️ Architecture

### Backend Structure
```
backend/
├── src/
│   ├── config/          # Database, JWT configuration
│   ├── controllers/     # HTTP request handlers
│   ├── services/        # Business logic layer
│   ├── repositories/    # Data access layer
│   ├── dto/            # Data Transfer Objects with Zod schemas
│   ├── middleware/     # Auth, error handling
│   ├── routes/         # API route definitions
│   ├── socket/         # Socket.io handlers
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions and error classes
├── prisma/
│   └── schema.prisma   # Database schema
└── package.json
```

### Frontend Structure
```
frontend/
├── src/
│   ├── components/     # Reusable React components
│   ├── contexts/       # React contexts (Auth)
│   ├── lib/           # API client, Socket client
│   ├── pages/         # Page components
│   ├── types/         # TypeScript type definitions
│   ├── App.tsx        # Main app component
│   └── main.tsx       # Entry point
└── package.json
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+ (or use Docker)
- Git

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the `backend` directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/taskmanager?schema=public"
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
   JWT_EXPIRES_IN="7d"
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL="http://localhost:5173"
   ```

4. **Set up the database**:
   ```bash
   # Generate Prisma client
   npm run prisma:generate

   # Run migrations
   npm run prisma:migrate
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

   The backend will be available at `http://localhost:3001`

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables** (optional):
   Create a `.env` file in the `frontend` directory:
   ```env
   VITE_API_URL=http://localhost:3001/api
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`

## 🐳 Docker Setup (Bonus)

To run the entire application stack with Docker:

1. **Build and start all services**:
   ```bash
   docker-compose up -d
   ```

2. **Run database migrations**:
   ```bash
   docker-compose exec backend npm run prisma:migrate
   ```

3. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - PostgreSQL: localhost:5432

## 📡 API Documentation

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### POST `/api/auth/login`
Login a user.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**: Same as register

#### POST `/api/auth/logout`
Logout the current user.

#### GET `/api/auth/me`
Get current user profile (requires authentication).

#### PUT `/api/auth/profile`
Update user profile (requires authentication).

**Request Body**:
```json
{
  "name": "Updated Name"
}
```

### Task Endpoints

#### POST `/api/tasks`
Create a new task (requires authentication).

**Request Body**:
```json
{
  "title": "Task Title",
  "description": "Task description",
  "dueDate": "2024-12-31T23:59:59.000Z",
  "priority": "High",
  "status": "ToDo",
  "assignedToId": "user-uuid" // optional
}
```

**Priority**: `Low`, `Medium`, `High`, `Urgent`
**Status**: `ToDo`, `InProgress`, `Review`, `Completed`

#### GET `/api/tasks`
Get all tasks with optional filters (requires authentication).

**Query Parameters**:
- `status`: Filter by status
- `priority`: Filter by priority
- `sortBy`: `dueDate`, `createdAt`, `priority`
- `sortOrder`: `asc`, `desc`

#### GET `/api/tasks/dashboard`
Get dashboard data (assigned tasks, created tasks, overdue tasks) (requires authentication).

#### GET `/api/tasks/:id`
Get a specific task by ID (requires authentication).

#### PUT `/api/tasks/:id`
Update a task (requires authentication).

**Request Body** (all fields optional):
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "dueDate": "2024-12-31T23:59:59.000Z",
  "priority": "Urgent",
  "status": "InProgress",
  "assignedToId": "user-uuid"
}
```

#### DELETE `/api/tasks/:id`
Delete a task (requires authentication, only creator can delete).

### Notification Endpoints

#### GET `/api/notifications`
Get notifications for current user (requires authentication).

**Query Parameters**:
- `includeRead`: `true` to include read notifications

#### PUT `/api/notifications/:id/read`
Mark a notification as read (requires authentication).

#### PUT `/api/notifications/read-all`
Mark all notifications as read (requires authentication).

### User Endpoints

#### GET `/api/users`
Get all users (for task assignment dropdown) (requires authentication).

## 🔌 Socket.io Events

### Client → Server

#### `task:update`
Emit when updating a task via socket.

```javascript
socket.emit('task:update', {
  taskId: 'task-uuid',
  updates: {
    status: 'InProgress',
    priority: 'High'
  }
});
```

### Server → Client

#### `task:updated`
Emitted when any task is updated.

```javascript
socket.on('task:updated', (data) => {
  console.log('Task updated:', data.task);
  console.log('Updated by:', data.updatedBy);
});
```

#### `notification:new`
Emitted when a new notification is created for the user.

```javascript
socket.on('notification:new', (notification) => {
  console.log('New notification:', notification);
});
```

## 🧪 Testing

### Backend Tests

Run unit tests:
```bash
cd backend
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

**Test Coverage**:
- Task Service: Task creation, updates, validation
- Auth Service: Registration, login, password hashing
- Socket Handler: Real-time event handling

## 🚢 Deployment

### Backend Deployment (Render/Railway)

1. **Set environment variables**:
   - `DATABASE_URL`: PostgreSQL connection string
   - `JWT_SECRET`: Strong secret key
   - `FRONTEND_URL`: Your frontend URL
   - `NODE_ENV`: `production`

2. **Build command**: `npm run build`
3. **Start command**: `npm start`

### Frontend Deployment (Vercel/Netlify)

1. **Set environment variables**:
   - `VITE_API_URL`: Your backend API URL

2. **Build command**: `npm run build`
3. **Output directory**: `dist`

## 🎨 Design Decisions

### Database Choice: PostgreSQL
- **Rationale**: PostgreSQL provides robust relational data integrity, excellent performance for complex queries, and strong support for enums and relationships. Perfect for a task management system with user assignments and audit logs.

### JWT Implementation
- **Storage**: HttpOnly cookies for security (prevents XSS attacks)
- **Expiration**: 7 days (configurable)
- **Validation**: Token verified on every authenticated request

### Service/Repository Pattern
- **Separation of Concerns**: Business logic in services, data access in repositories
- **Testability**: Easy to mock repositories for unit testing
- **Maintainability**: Clear boundaries between layers

### Socket.io Integration
- **Authentication**: JWT token verified on socket connection
- **Room-based**: Users join personal rooms for targeted notifications
- **Broadcasting**: Task updates broadcast to all connected clients

## 📝 Trade-offs & Assumptions

1. **Task Assignment**: Users can assign tasks to any registered user (no team/organization concept)
2. **Permissions**: Only task creators can delete tasks; any authenticated user can update
3. **Real-time Updates**: All task updates broadcast to all users (no granular permissions)
4. **Notifications**: Only assignment notifications implemented (can be extended)
5. **File Uploads**: Not implemented (can be added for task attachments)

## 🔒 Security Considerations

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens in HttpOnly cookies
- CORS configured for specific frontend origin
- Input validation on all endpoints using Zod
- SQL injection prevention via Prisma ORM
- XSS prevention through React's built-in escaping

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Socket.io Documentation](https://socket.io/docs/v4)
- [SWR Documentation](https://swr.vercel.app)
- [React Hook Form](https://react-hook-form.com)
- [Tailwind CSS](https://tailwindcss.com)

## 📄 License

This project is created as part of a technical assessment.


