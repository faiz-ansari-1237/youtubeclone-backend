# YouTube Clone Backend

This is the backend API for the YouTube Clone project, built with Node.js, Express, and MongoDB.

## Features

- User authentication (JWT)
- Video upload, update, delete
- Comments, likes, subscriptions
- Notifications
- RESTful API
- Cloudinary integration for media uploads

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- MongoDB Atlas account
- Cloudinary account (for media uploads)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/faiz-ansari-1237/youtubeclone-backend.git
   cd youtube-clone-backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root with the following variables:
   ```
   MONGODB_URI=your_mongodb_atlas_connection_string
   PORT=5000
   JWT_SECRET=your_jwt_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

   > **Note:**  
   > Replace the values above with your actual credentials.  
   > Do **not** commit your `.env` file to version control.

4. Start the server:
   ```
   npm start
   ```

## Deployment

- Deploy on [Render](https://render.com/) or similar Node.js hosting.
- Set all environment variables (`MONGODB_URI`, `PORT`, `JWT_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) in your hosting dashboard.

## API Endpoints

- `/api/auth` - Authentication routes
- `/api/users` - User routes
- `/api/videos` - Video routes
- `/api/comments` - Comment routes

## License

MIT
