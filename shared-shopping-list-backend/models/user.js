const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  households: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Household' }],
});

module.exports = mongoose.model('User', UserSchema);