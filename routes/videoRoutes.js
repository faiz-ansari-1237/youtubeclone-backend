// routes/videos.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../utils/cloudinaryStorage');
const Video = require('../models/Video');
const User = require('../models/User');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');

// Search for videos (MUST be above /videos/:id)
router.get('/search', async (req, res) => {
  const { q } = req.query;
  try {
    let videos = await Video.find({
      title: { $regex: q, $options: 'i' }
    }).populate('owner');

    const ownerMatches = await Video.find({})
      .populate('owner')
      .then(allVideos =>
        allVideos.filter(
          v =>
            v.owner &&
            v.owner.channelName &&
            v.owner.channelName.toLowerCase().includes(q.toLowerCase())
        )
      );

    const allResults = [
      ...videos,
      ...ownerMatches.filter(
        v => !videos.some(vid => vid._id.toString() === v._id.toString())
      ),
    ];

    res.json(allResults);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Place this BEFORE any route like '/:id'
router.get('/by-channels', auth, async (req, res) => {
  try {
    let ids = req.query.ids ? req.query.ids.split(',') : [];
    ids = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (!ids.length) return res.json([]);
    const videos = await Video.find({ owner: { $in: ids } })
      .populate('owner', 'username channelName profilePicture')
      .sort({ createdAt: -1 });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET a single video by ID (must be after /search)
router.get('/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate({
        path: 'owner',
        select: 'username channelName profilePicture subscribers',
      });
    if (!video) return res.status(404).json({ message: 'Video not found' });

    const videoObj = video.toObject();
    videoObj.likes = Array.isArray(videoObj.likes)
      ? videoObj.likes.map(id => id.toString())
      : [];

    res.json(videoObj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all videos
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.userId) {
      filter.owner = req.query.userId;
    }
    const videos = await Video.find(filter).populate('owner', 'username channelName profilePicture');
    res.json(videos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new video
router.post('/',
  auth,
  upload.any(),
  async (req, res) => {
    try {
      const { duration, title, description } = req.body;
      const videoFile = req.files.find(f => f.fieldname === 'video');
      const thumbnailFile = req.files.find(f => f.fieldname === 'thumbnail');
      const videoUrl = videoFile ? videoFile.path : undefined;
      const thumbnailUrl = thumbnailFile ? thumbnailFile.path : undefined;

      const video = new Video({
        title,
        description,
        videoUrl,
        thumbnailUrl,
        owner: req.user.id,
        duration: Number(duration),
      });
      await video.save();
      res.status(201).json(video);
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: err.message });
    }
  }
);

// Like or unlike a video
router.post('/:id/like', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });

    if (!Array.isArray(video.likes)) {
      video.likes = [];
    }

    const userId = req.user.id;
    const alreadyLiked = video.likes.map(id => id.toString()).includes(userId);

    if (alreadyLiked) {
      // Unlike
      video.likes = video.likes.filter(id => id.toString() !== userId);
    } else {
      // Like
      video.likes.push(userId);

      if (video.owner.toString() !== req.user.id) {
        await Notification.create({
          user: video.owner,
          message: `${req.user.username} liked your video "${video.title}"`,
          link: `/watch/${video._id}`,
        });
      }
    }

    await video.save();
    res.json({ liked: !alreadyLiked, likesCount: video.likes.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update video (title, description, etc.)
router.put('/:id', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });

    if (video.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Update fields
    if (req.body.title) video.title = req.body.title;
    if (req.body.description) video.description = req.body.description;

    await video.save();
    res.json(video);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete video
router.delete('/:id', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });

    if (video.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Video.findByIdAndDelete(req.params.id);
    res.json({ message: 'Video deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Increment view count for a video (logged-in users only)
router.post('/:id/view', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });

    const userId = req.user.id;
    if (!video.viewedBy.map(id => id.toString()).includes(userId)) {
      video.views += 1;
      video.viewedBy.push(userId);
      await video.save();
    }

    res.json({ views: video.views });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add to watch history when a video is viewed
router.post('/:id/history', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const videoId = req.params.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.watchHistory = user.watchHistory.filter(
      entry => entry.video.toString() !== videoId
    );

    user.watchHistory.unshift({ video: videoId, watchedAt: new Date() });

    if (user.watchHistory.length > 100) user.watchHistory.pop();

    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;