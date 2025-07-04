const express = require('express');
const router = express.Router();
const householdController = require('../controllers/household');
const authMiddleware = require('../middleware/auth');

// Make sure these are proper function references
router.post('/', authMiddleware, householdController.createHousehold);
router.post('/:householdId/members', authMiddleware, householdController.addMember);

module.exports = router;