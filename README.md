# NexNote - Hierarchical Todo/Note Manager

A full-stack productivity application for managing hierarchical todos and notes with real-time collaboration.

## Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, React Router, Socket.io Client
- **Backend**: Node.js, Express, Socket.io
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT (access + refresh tokens) with httpOnly cookies

## Features

- User authentication (register, login, logout, token refresh)
- Workspace management (create, edit, delete, add members)
- Hierarchical node structure (sections, tasks, notes)
- Real-time synchronization across devices using Socket.io
- Rich content blocks (text, image, video, audio, link, file)
- Tagging system
- Node linking for cross-references

## Database Schema

- `users` - User accounts
- `workspaces` - Workspaces for organizing content
- `workspace_members` - Workspace membership with roles (owner/editor/viewer)
- `nodes` - Hierarchical content nodes (sections, tasks, notes)
- `node_content` - Rich content blocks for nodes
- `tags` - Tags for categorizing nodes
- `node_tags` - Many-to-many relationship between nodes and tags
- `node_links` - Links between nodes for cross-references

## API Routes

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Workspaces
- `GET /api/workspaces` - Get user's workspaces
- `GET /api/workspaces/:id` - Get workspace details
- `POST /api/workspaces` - Create new workspace
- `PUT /api/workspaces/:id` - Update workspace
- `DELETE /api/workspaces/:id` - Delete workspace
- `POST /api/workspaces/:id/members` - Add member to workspace
- `DELETE /api/workspaces/:id/members/:userId` - Remove member from workspace

### Nodes
- `GET /api/nodes/workspace/:workspaceId` - Get all nodes in workspace
- `GET /api/nodes/:id` - Get single node
- `POST /api/nodes` - Create new node
- `PUT /api/nodes/:id` - Update node
- `DELETE /api/nodes/:id` - Delete node
- `GET /api/nodes/:id/children` - Get node children

### Content
- `GET /api/content/node/:nodeId` - Get content for a node
- `POST /api/content/node/:nodeId` - Add content to node
- `PUT /api/content/:id` - Update content
- `DELETE /api/content/:id` - Delete content

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Configure the `.env` file with your database credentials:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/nexnote
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
PORT=5000
NODE_ENV=development
```

5. Create the PostgreSQL database:
```sql
CREATE DATABASE nexnote;
```

6. Generate and run database migrations:
```bash
npm run db:generate
npm run db:migrate
```

7. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Development

### Backend Development

- `npm run dev` - Start backend with hot reload
- `npm run start` - Start backend in production mode
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio for database management

### Frontend Development

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Project Structure

```
NexNote/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.js       # Database schema definitions
│   │   │   └── index.js        # Database connection
│   │   ├── middleware/
│   │   │   └── auth.js         # JWT authentication middleware
│   │   ├── routes/
│   │   │   ├── auth.js         # Authentication routes
│   │   │   ├── nodes.js        # Node CRUD routes
│   │   │   ├── content.js      # Content routes
│   │   │   └── workspaces.js   # Workspace routes
│   │   ├── socket/
│   │   │   └── index.js        # Socket.io setup
│   │   └── index.js            # Main Express server
│   ├── drizzle.config.js       # Drizzle configuration
│   └── package.json
└── frontend/
    ├── src/
    │   ├── lib/
    │   │   ├── api.js          # Axios API client
    │   │   └── socket.js       # Socket.io client
    │   ├── pages/
    │   │   ├── Login.jsx       # Login page
    │   │   ├── Register.jsx    # Register page
    │   │   ├── Dashboard.jsx   # Dashboard page
    │   │   └── Workspace.jsx    # Workspace page
    │   ├── App.jsx             # Main App component
    │   ├── main.jsx            # React entry point
    │   └── index.css           # Global styles
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

## Security Notes

- JWT secrets should be changed in production
- Use environment variables for sensitive configuration
- Enable HTTPS in production
- Set secure cookie flags in production
- Implement rate limiting for API endpoints
- Add input validation and sanitization

## Deployment

### Backend Deployment (Railway.app)

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/nexnote.git
   git push -u origin main
   ```

2. **Deploy to Railway**:
   - Go to [railway.app](https://railway.app) and sign in with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select the `nexnote` repository
   - Railway will detect the `backend` directory and `railway.toml` config

3. **Add PostgreSQL Plugin**:
   - In your Railway project, click "New" → "Database" → "Add PostgreSQL"
   - Railway will provide a `DATABASE_URL` in the environment variables

4. **Configure Environment Variables**:
   Set these in Railway's environment variables:
   ```
   DATABASE_URL=<provided by Railway>
   JWT_SECRET=<generate a strong random string>
   JWT_REFRESH_SECRET=<generate a different strong random string>
   NODE_ENV=production
   CLIENT_URL=<your-vercel-app-url>
   EMAIL_HOST=smtp.mailtrap.io
   EMAIL_PORT=2525
   EMAIL_USER=<your-mailtrap-username>
   EMAIL_PASS=<your-mailtrap-password>
   EMAIL_FROM=noreply@nexnote.com
   FRONTEND_URL=<your-vercel-app-url>
   ```

5. **Run Migrations**:
   Railway will automatically run migrations on deploy, or you can run them manually via the Railway console.

### Frontend Deployment (Vercel)

1. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com) and sign in with GitHub
   - Click "Add New..." → "Project"
   - Import the `nexnote` repository
   - Select the `frontend` directory as the root directory

2. **Configure Environment Variables**:
   Set these in Vercel's environment variables:
   ```
   VITE_API_URL=<your-railway-backend-url>
   VITE_SOCKET_URL=<your-railway-backend-url>
   ```

3. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy the frontend

### Auto-Deploy Setup

Both Railway and Vercel are now connected to your GitHub repository. Any push to the `main` branch will automatically trigger deployments on both platforms.

### Testing Production

1. Test the auth flow end-to-end on production URLs
2. Verify CORS is working between Vercel and Railway
3. Test real-time features (Socket.io) in production
4. Verify email flows (verification, password reset, invites)

### Additional Notes

- The `vercel.json` file ensures SPA routing works correctly
- The `railway.toml` file configures Railway deployment settings
- The `Dockerfile` is used by Railway for containerization
- CORS is configured to allow requests from the Vercel domain in production

## License

MIT
