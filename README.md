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
