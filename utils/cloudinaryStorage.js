const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let resourceType = 'image';
    if (file.mimetype.startsWith('video/')) resourceType = 'video';
    return {
      folder: 'youtube-clone',
      resource_type: resourceType,
      allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'mp4', 'webp', 'mov', 'avi', 'mkv'],
    };
  },
});

const upload = multer({ storage });

module.exports = upload;