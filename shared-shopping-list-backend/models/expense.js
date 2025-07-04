const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  household: { type: mongoose.Schema.Types.ObjectId, ref: 'Household' },
  total: { type: Number, required: true },
  split: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: { type: Number, required: true },
    paid: { type: Boolean, default: false },
  }],
  settled: { type: Boolean, default: false },
});

module.exports = mongoose.model('Expense', ExpenseSchema);