const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const upload = require('../utils/cloudinaryStorage');

const JWT_SECRET = process.env.JWT_SECRET;

// Sign Up
router.post('/signup', upload.single('profilePicture'), async (req, res) => {
  try {
    const { username, email, password, channelName } = req.body;
    let profilePicture = req.file ? req.file.path : undefined;

    const user = new User({ username, email, password, channelName, profilePicture });
    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ user, token });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
});

// Sign In
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        channelName: user.channelName,
        profilePicture: user.profilePicture,
      },
      token
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;