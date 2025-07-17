// server/routes/auth.js
const express = require('express');
const createError = require('http-errors');
const { connect } = require('../utils/db');
const User = require('../models/User');
const { hashPassword } = require('../utils/auth')

const router = express.Router();

// signup
router.post('/signup', async (req,res,next) => {
  try {
    await connect();
    const { name, username, email, password } = req.body;
    const hashed = await hashPassword(password)
    const user = await User.create({ name, username, email, password:hashed });
    req.session.user = { id: user._id, username, name, email };
    res.status(201).json({ message: 'Signup successful' });
  } catch(err) {
    if (err.code === 11000) {
      return next(createError(400, 'Username or email already in use'));
    }
    next(err);
  }
});

// signin
router.post('/signin', async (req,res,next) => {
  try {
    await connect();
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await user.verifyPassword(password))) {
      throw createError(401, 'Invalid username or password');
    }
    req.session.user = { id: user._id, username: user.username, name: user.name };
    res.json({ message: 'Sign in successful' });
  } catch(err) {
    next(err);
  }
});

module.exports = router;
