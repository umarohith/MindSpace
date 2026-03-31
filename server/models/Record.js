const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['mood', 'mudra', 'exercise', 'game'], required: true },
  data: { type: Object, required: true }, // e.g. { moodId: 'stressed', label: 'Stressed' }
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Record', recordSchema);
