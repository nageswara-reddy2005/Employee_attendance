const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/chat/query
router.post('/query', authMiddleware, chatController.handleQuery);

module.exports = router;
