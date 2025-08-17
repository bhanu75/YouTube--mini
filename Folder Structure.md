Folder Structure



youtube-companion-dashboard/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── youtube.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── videoController.js
│   │   │   ├── commentController.js
│   │   │   ├── noteController.js
│   │   │   └── logController.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── errorHandler.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Note.js
│   │   │   └── EventLog.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── videos.js
│   │   │   ├── comments.js
│   │   │   ├── notes.js
│   │   │   └── logs.js
│   │   ├── utils/
│   │   │   ├── encryption.js
│   │   │   └── logger.js
│   │   └── app.js
│   ├── package.json
│   ├── .env.example
│   └── server.js
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── LoginButton.jsx
│   │   │   │   └── AuthCallback.jsx
│   │   │   ├── Dashboard/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   └── Sidebar.jsx
│   │   │   ├── Video/
│   │   │   │   ├── VideoDetails.jsx
│   │   │   │   └── VideoEditor.jsx
│   │   │   ├── Comments/
│   │   │   │   ├── CommentSection.jsx
│   │   │   │   ├── CommentForm.jsx
│   │   │   │   └── CommentItem.jsx
│   │   │   ├── Notes/
│   │   │   │   ├── NotesPanel.jsx
│   │   │   │   ├── NoteForm.jsx
│   │   │   │   └── NoteItem.jsx
│   │   │   └── Logs/
│   │   │       └── EventLogs.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── auth.js
│   │   │   └── youtube.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   └── useApi.js
│   │   ├── utils/
│   │   │   └── constants.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.js
│   ├── package.json
│   └── .env.example
├── .gitignore
├── README.md
└── docker-compose.yml (optional)
