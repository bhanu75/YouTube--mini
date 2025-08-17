
const express = require('express');
const router = express.Router();
const LogController = require('../controllers/logController');
const { authMiddleware } = require('../middleware/auth');
const { requestLogger } = require('../utils/logger');

// Apply authentication to all log routes
router.use(authMiddleware);

// Note: We don't apply requestLogger to logs routes to avoid circular logging

// Log routes
router.get('/', LogController.getUserLogs);
router.get('/stats', LogController.getActivityStats);
router.get('/errors', LogController.getErrorLogs);
router.get('/export', LogController.exportLogs);
router.get('/type/:eventType', LogController.getLogsByEventType);
router.post('/clear', LogController.clearOldLogs);

module.exports = router;
