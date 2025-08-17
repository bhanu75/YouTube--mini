
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const { requestLogger } = require('../utils/logger');

// Apply request logging to all auth routes
router.use(requestLogger);

// Public routes (no authentication required)
router.get('/', AuthController.getAuthUrl);
router.get('/callback', AuthController.handleCallback);

// Protected routes (authentication required)
router.use(authMiddleware);

router.get('/me', AuthController.getCurrentUser);
router.post('/refresh', AuthController.refreshToken);
router.post('/logout', AuthController.logout);
router.put('/settings', AuthController.updateSettings);
router.delete('/account', AuthController.deleteAccount);

module.exports = router;
