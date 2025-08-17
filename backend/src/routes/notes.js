
const express = require('express');
const router = express.Router();
const NoteController = require('../controllers/noteController');
const { authMiddleware } = require('../middleware/auth');
const { requestLogger } = require('../utils/logger');

// Apply authentication and logging to all note routes
router.use(authMiddleware);
router.use(requestLogger);

// Note routes
router.get('/', NoteController.getAllNotes);
router.get('/stats', NoteController.getNoteStats);
router.get('/tags', NoteController.getTags);
router.get('/search', NoteController.searchNotes);
router.get('/video/:videoId', NoteController.getNotesByVideo);
router.get('/:noteId', NoteController.getNoteById);
router.post('/', NoteController.createNote);
router.put('/:noteId', NoteController.updateNote);
router.delete('/:noteId', NoteController.deleteNote);
router.post('/bulk', NoteController.bulkOperation);

module.exports = router;
