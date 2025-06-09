// routes/users.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Video = require('../models/Video');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const upload = require('../utils/cloudinaryStorage');
const bcrypt = require('bcrypt');

// GET all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/subscriptions', auth, async (req, res) => {
  try {
    const subscriptions = await User.find({ subscribers: req.user.id }, 'username channelName profilePicture');
    res.json(subscriptions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET a user profile by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('subscribers', 'username channelName profilePicture');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new user
router.post('/', async (req, res) => {
  const user = new User({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    profilePicture: req.body.profilePicture
  });

  try {
    const newUser = await user.save();

    const userObj = newUser.toObject();
    delete userObj.password;

    res.status(201).json(userObj);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT (Update) a user by ID
router.put('/:id', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const updates = {};
    if (req.body.username) updates.username = req.body.username;
    if (req.body.channelName) updates.channelName = req.body.channelName;
    if (req.file && req.file.path) updates.profilePicture = req.file.path;

    if (req.body.password && req.body.password.length >= 6) {
      updates.password = await bcrypt.hash(req.body.password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    ).select('-password');

    res.json({ user: updatedUser });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a user by ID
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await User.deleteOne({ _id: req.params.id });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Subscribe or unsubscribe to a user
router.post('/:id/subscribe', auth, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    if (!Array.isArray(targetUser.subscribers)) targetUser.subscribers = [];

    const isSubscribed = targetUser.subscribers.includes(currentUser._id);

    if (isSubscribed) {
      // Unsubscribe
      targetUser.subscribers = targetUser.subscribers.filter(
        id => id.toString() !== currentUser._id.toString()
      );
    } else {
      // Subscribe
      targetUser.subscribers.push(currentUser._id);

      const channelOwner = await User.findById(req.params.id);
      if (channelOwner._id.toString() !== req.user.id) {
        await Notification.create({
          user: channelOwner._id,
          message: `${req.user.username} subscribed to your channel`,
          link: `/profile/${req.user.id}`,
        });
      }
    }

    await targetUser.save();
    res.json({
      subscribed: !isSubscribed,
      subscribersCount: targetUser.subscribers.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user's watch history
router.get('/me/history', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'watchHistory.video',
        populate: { path: 'owner', select: 'channelName profilePicture' }
      });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.watchHistory);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all videos liked by the current user
router.get('/me/liked-videos', auth, async (req, res) => {
  try {
    const videos = await Video.find({ likes: req.user.id })
      .populate('owner', 'channelName profilePicture');
    res.json(videos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add to watch later
router.post('/me/watch-later/:videoId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.watchLater.includes(req.params.videoId)) {
      user.watchLater.unshift(req.params.videoId);
      await user.save();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Remove from watch later
router.delete('/me/watch-later/:videoId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.watchLater = user.watchLater.filter(
      id => id.toString() !== req.params.videoId
    );
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get watch later list
router.get('/me/watch-later', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'watchLater',
      populate: { path: 'owner', select: 'channelName profilePicture' }
    });
    res.json(user.watchLater);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get notifications for the current user
router.get('/me/notifications', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(20);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark notifications as read
router.post('/me/notifications/mark-read', auth, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id, read: false }, { $set: { read: true } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;