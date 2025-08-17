
const express = require('express');
const router = express.Router();
const VideoController = require('../controllers/videoController');
const { authMiddleware } = require('../middleware/auth');
const { requestLogger } = require('../utils/logger');

// Apply authentication and logging to all video routes
router.use(authMiddleware);
router.use(requestLogger);

// Video routes
router.get('/my-videos', VideoController.getUserVideos);
router.get('/:videoId', VideoController.getVideoDetails);
router.put('/:videoId', VideoController.updateVideoDetails);
router.get('/:videoId/analytics', VideoController.getVideoAnalytics);

module.exports = router;
