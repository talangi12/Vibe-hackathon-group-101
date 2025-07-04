const mongoose = require('mongoose');

const ListSchema = new mongoose.Schema({
  name: { type: String, required: true },
  household: { type: mongoose.Schema.Types.ObjectId, ref: 'Household' },
  items: [{
    name: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    price: { type: Number, default: 0 },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    inCart: { type: Boolean, default: false },
    purchased: { type: Boolean, default: false },
  }],
});

module.exports = mongoose.model('List', ListSchema);