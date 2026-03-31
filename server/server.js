const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('./models/User');
const Record = require('./models/Record');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'aura-youth-secret';

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aura-youth')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Auth Middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error();
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) throw new Error();
    req.user = user;
    next();
  } catch (e) {
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

// --- AUTH ROUTES ---

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = new User({ name, email, password });
    await user.save();
    const token = jwt.sign({ id: user._id }, JWT_SECRET);
    res.status(201).send({ user, token });
  } catch (err) {
    res.status(400).send({ error: 'Register failed. Email might already exist.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).send({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id }, JWT_SECRET);
    res.send({ user, token });
  } catch (err) {
    res.status(500).send({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', auth, (req, res) => {
  res.send(req.user);
});

// --- RECORD ROUTES ---

app.get('/api/records', auth, async (req, res) => {
  try {
    const records = await Record.find({ userId: req.user._id }).sort({ timestamp: -1 });
    res.send(records);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post('/api/records', auth, async (req, res) => {
  try {
    const record = new Record({
      ...req.body,
      userId: req.user._id
    });
    await record.save();
    res.status(201).send(record);
  } catch (err) {
    res.status(400).send(err);
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://127.0.0.1:${PORT}`);
});
