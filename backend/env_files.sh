# ============================================
# BACKEND .env FILE
# ============================================
# File: backend/.env

PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/youtube-companion
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/youtube-companion

# JWT Secret (generate random string)
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random_123456789

# Encryption Key (exactly 32 characters)
ENCRYPTION_KEY=12345678901234567890123456789012

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/callback

# YouTube API Key (optional, for public data)
YOUTUBE_API_KEY=your_youtube_api_key_here

# CORS Origin
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ============================================
# BACKEND .env.example FILE
# ============================================
# File: backend/.env.example

PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/youtube-companion

# JWT Secret (generate a random string)
JWT_SECRET=your_jwt_secret_here

# Encryption Key (exactly 32 characters)
ENCRYPTION_KEY=your_32_character_encryption_key

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/callback

# YouTube API Key
YOUTUBE_API_KEY=your_youtube_api_key

# CORS Origin
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ============================================
# FRONTEND .env FILE
# ============================================
# File: frontend/.env

REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com

# ============================================
# FRONTEND .env.example FILE
# ============================================
# File: frontend/.env.example

REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# ============================================
# TAILWIND CONFIG FILE
# ============================================
# File: frontend/tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        youtube: {
          red: '#FF0000',
          dark: '#282828',
          light: '#f9f9f9',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

# ============================================
# GITIGNORE FILE
# ============================================
# File: .gitignore

# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Production builds
backend/dist/
frontend/build/

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.test

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless/

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Database files
*.sqlite
*.db

# Temporary files
tmp/
temp/

# ============================================
# README.md FILE
# ============================================
# File: README.md

# YouTube Companion Dashboard

A comprehensive dashboard for managing YouTube videos, comments, notes, and tracking activities.

## 🚀 Features

- **Authentication**: Secure Google OAuth integration
- **Video Management**: View and edit video details
- **Comment System**: Add, reply, and manage comments
- **Notes**: Create and organize video-related notes
- **Activity Logging**: Track all dashboard activities
- **Responsive Design**: Works on desktop and mobile

## 🛠️ Tech Stack

- **Frontend**: React, Tailwind CSS, React Router
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: Google OAuth 2.0
- **API Integration**: YouTube Data API v3

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Google Cloud Console account
- YouTube Data API enabled

## ⚙️ Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/youtube-companion-dashboard.git
cd youtube-companion-dashboard
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 4. Set up Environment Variables
- Copy `.env.example` to `.env` in both backend and frontend folders
- Fill in your Google OAuth credentials and MongoDB URI
- Generate JWT secret and encryption key

### 5. Start MongoDB
```bash
# Local MongoDB
mongod

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 6. Run the Application
```bash
# Backend (Terminal 1)
cd backend
npm run dev

# Frontend (Terminal 2)  
cd frontend
npm start
```

### 7. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🔐 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/api/auth/callback`
6. Copy Client ID and Secret to your `.env` file

## 📚 API Documentation

### Authentication
- `GET /api/auth` - Get authentication URL
- `GET /api/auth/callback` - OAuth callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Videos
- `GET /api/videos/:videoId` - Get video details
- `PUT /api/videos/:videoId` - Update video details

### Comments
- `GET /api/comments/:videoId` - Get video comments
- `POST /api/comments` - Add comment
- `POST /api/comments/:commentId/reply` - Reply to comment
- `DELETE /api/comments/:commentId` - Delete comment

### Notes
- `GET /api/notes` - Get all notes
- `POST /api/notes` - Create note
- `PUT /api/notes/:noteId` - Update note
- `DELETE /api/notes/:noteId` - Delete note

### Logs
- `GET /api/logs` - Get activity logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues, please create an issue on GitHub or contact the maintainers.