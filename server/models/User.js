const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const historySchema = new mongoose.Schema({
  type: String, // mood, mudra, exercise, game
  data: Object,
  timestamp: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: String,
  history: [historySchema],
  stats: {
    level: { type: Number, default: 1 },
    resilience: { type: Number, default: 0 }
  }
}, { timestamps: true });

// Pre-save password hash
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password check
userSchema.methods.comparePassword = async function(candPass) {
  return await bcrypt.compare(candPass, this.password);
};

module.exports = mongoose.model('User', userSchema);
