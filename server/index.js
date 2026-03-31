const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const morgan = require('morgan');
require('dotenv').config();

const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'aura-youth-secret-key';

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(morgan('dev'));

// MongoDB Connection
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aura-youth';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected (127.0.0.1)'))
  .catch(err => console.error('❌ DB Error:', err.message));

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

// --- ROUTES ---

// 1. Health check
app.get('/ping', (req, res) => res.send('pong'));

// 2. Auth: Register
app.post('/api/auth/register', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).send({ error: 'Database is not connected. Please start your local MongoDB!' });
  }
  
  try {
    const { name, email, password } = req.body;
    
    // Check if exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).send({ error: 'This email is already in use. Please log in instead.' });
    }

    const user = new User({ name, email, password });
    await user.save();
    
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).send({ user, token });
  } catch (err) {
    console.error('Register ERROR:', err);
    res.status(500).send({ error: 'Server registration error. Please check your DB connection.' });
  }
});

// 3. Auth: Login
app.post('/api/auth/login', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).send({ error: 'Database is not connected. Please start your local MongoDB!' });
  }
  
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).send({ error: 'Invalid email or password.' });
    }
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.send({ user, token });
  } catch (err) {
    res.status(500).send({ error: 'Login failure.' });
  }
});

// 4. History: Fetch
app.get('/api/history', auth, async (req, res) => {
  res.send(req.user.history);
});

// 5. History: Add
app.post('/api/history', auth, async (req, res) => {
  try {
    const { type, data } = req.body;
    req.user.history.push({ type, data });
    await req.user.save();
    res.status(201).send(req.user.history[req.user.history.length - 1]);
  } catch (err) {
    res.status(400).send({ error: 'Record save failed.' });
  }
});

// Start
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Aura Backend is Live on http://127.0.0.1:${PORT}`);
});
