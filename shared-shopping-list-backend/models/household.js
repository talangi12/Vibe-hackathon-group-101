const mongoose = require('mongoose');

const HouseholdSchema = new mongoose.Schema({
  name: { type: String, required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'List' }],
  expenses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Expense' }],
  subscriptionActive: { type: Boolean, default: false },
});

module.exports = mongoose.model('Household', HouseholdSchema);