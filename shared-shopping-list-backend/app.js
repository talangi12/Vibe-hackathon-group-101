const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const householdRoutes = require('./routes/household');
const listRoutes = require('./routes/list');
const expenseRoutes = require('./routes/expense');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/households', householdRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/expenses', expenseRoutes);

module.exports = app;