
const express = require('express');
const router = express.Router();
const CommentController = require('../controllers/commentController');
const { authMiddleware } = require('../middleware/auth');
const { requestLogger } = require('../utils/logger');

// Apply authentication and logging to all comment routes
router.use(authMiddleware);
router.use(requestLogger);

// Comment routes
router.get('/video/:videoId', CommentController.getVideoComments);
router.get('/video/:videoId/stats', CommentController.getCommentStats);
router.get('/:commentId', CommentController.getComment);
router.post('/', CommentController.addComment);
router.post('/:commentId/reply', CommentController.replyToComment);
router.delete('/:commentId', CommentController.deleteComment);

module.exports = router;
