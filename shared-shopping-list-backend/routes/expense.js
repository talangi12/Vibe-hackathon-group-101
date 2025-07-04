const express = require('express');
const router = express.Router();
const { splitExpenses } = require('../controllers/expense');
const auth = require('../middleware/auth');

router.post('/:listId/split', auth, splitExpenses);

module.exports = router;