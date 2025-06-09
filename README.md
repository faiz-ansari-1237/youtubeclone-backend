# YouTube Clone Backend

This is the backend API for the YouTube Clone project, built with Node.js, Express, and MongoDB.

## Features

- User authentication (JWT)
- Video upload, update, delete
- Comments, likes, subscriptions
- Notifications
- RESTful API

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- MongoDB Atlas account

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

3. Create a `.env` file in the root with the following:
   ```
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_jwt_secret
   ```

4. Start the server:
   ```
   npm start
   ```

## Deployment

- Deploy on [Render](https://render.com/) or similar Node.js hosting.
- Set environment variables (`MONGODB_URI`, `JWT_SECRET`) in your hosting dashboard.

## API Endpoints

- `/api/auth` - Authentication routes
- `/api/users` - User routes
- `/api/videos` - Video routes
- `/api/comments` - Comment routes

## License

MIT