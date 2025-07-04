const express = require('express');
const router = express.Router();
const { createList, addItem } = require('../controllers/list');
const auth = require('../middleware/auth');

// POST /api/lists (Create list)
router.post('/', auth, createList);

// POST /api/lists/:listId/items (Add item)
router.post('/:listId/items', auth, addItem);

module.exports = router;