# Nexus Platform Backend

A comprehensive backend API for the Nexus Platform - connecting investors and entrepreneurs through secure collaboration tools.

## Features

- **Authentication & Authorization**: JWT-based auth with refresh tokens, role-based access control
- **User Management**: Separate profiles for entrepreneurs and investors
- **Real-time Communication**: WebSocket support for chat and video calls
- **Meeting Scheduling**: Calendar integration with conflict detection
- **Document Management**: Secure file upload and sharing
- **Payment Integration**: Mock payment system with transaction tracking
- **Security**: Rate limiting, input sanitization, CORS protection

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.IO
- **Authentication**: JWT
- **File Upload**: Multer
- **Email**: Nodemailer
- **Security**: Helmet, express-rate-limit
- **Validation**: express-validator

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Clone and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/nexus-platform
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-refresh-secret
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   FRONTEND_URL=http://localhost:5173
   ```

4. **Create upload directories**
   ```bash
   mkdir -p uploads/avatars uploads/documents
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | User login |
| POST | `/auth/refresh-token` | Refresh access token |
| POST | `/auth/logout` | User logout |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password |
| GET | `/auth/me` | Get current user |

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | Get all users (with filters) |
| GET | `/users/entrepreneurs` | Get entrepreneurs |
| GET | `/users/investors` | Get investors |
| GET | `/users/:id` | Get user by ID |
| PUT | `/users/profile` | Update user profile |
| PUT | `/users/avatar` | Update user avatar |
| DELETE | `/users/account` | Delete user account |

### Meeting Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/meetings` | Create meeting |
| GET | `/meetings` | Get user meetings |
| GET | `/meetings/:id` | Get meeting by ID |
| PUT | `/meetings/:id` | Update meeting |
| PUT | `/meetings/:id/respond` | Respond to invitation |
| POST | `/meetings/:id/join` | Join meeting |
| POST | `/meetings/:id/leave` | Leave meeting |
| DELETE | `/meetings/:id` | Delete meeting |

## WebSocket Events

### Chat Events
- `send_message` - Send a message
- `new_message` - Receive a message
- `mark_read` - Mark message as read
- `typing_start` - User started typing
- `typing_stop` - User stopped typing

### Video Call Events
- `join_call` - Join video call
- `leave_call` - Leave video call
- `offer` - WebRTC offer
- `answer` - WebRTC answer
- `ice_candidate` - ICE candidate
- `toggle_audio` - Toggle audio
- `toggle_video` - Toggle video

### Meeting Events
- `join_meeting` - Join meeting room
- `leave_meeting` - Leave meeting room
- `participant_joined` - New participant joined
- `participant_left` - Participant left
- `start_screen_share` - Start screen sharing
- `stop_screen_share` - Stop screen sharing
- `meeting_message` - Meeting chat message

## Database Models

### User Model
```javascript
{
  name: String,
  email: String,
  password: String,
  role: 'entrepreneur' | 'investor',
  avatarUrl: String,
  bio: String,
  isOnline: Boolean,
  // Role-specific fields...
}
```

### Meeting Model
```javascript
{
  title: String,
  description: String,
  organizer: ObjectId,
  participants: [{ user: ObjectId, status: String }],
  startTime: Date,
  endTime: Date,
  status: String,
  roomId: String
}
```

## Security Features

- **Rate Limiting**: Prevents abuse with configurable limits
- **Input Sanitization**: Removes XSS attempts
- **CORS Protection**: Configured for frontend domain
- **Helmet**: Security headers
- **JWT**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable rounds

## Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nexus-platform
JWT_SECRET=your-production-jwt-secret
FRONTEND_URL=https://your-frontend-domain.com
```

### Deployment Platforms

**Render**
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically

**Railway**
1. Connect repository
2. Configure environment
3. Deploy with one click

**Heroku**
1. Create Heroku app
2. Set config vars
3. Deploy via Git

## Development

### Project Structure
```
backend/
├── src/
│   ├── config/          # Database and app configuration
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic services
│   ├── utils/           # Utility functions
│   └── server.js        # Main server file
├── uploads/             # File uploads
├── .env.example         # Environment template
└── package.json
```

### Adding New Features

1. **Create Model** (if needed)
   ```javascript
   // src/models/NewModel.js
   const mongoose = require('mongoose');
   const schema = new mongoose.Schema({...});
   module.exports = mongoose.model('NewModel', schema);
   ```

2. **Create Controller**
   ```javascript
   // src/controllers/newController.js
   const NewModel = require('../models/NewModel');
   const createNew = async (req, res) => {...};
   module.exports = { createNew };
   ```

3. **Create Routes**
   ```javascript
   // src/routes/new.js
   const express = require('express');
   const { createNew } = require('../controllers/newController');
   const router = express.Router();
   router.post('/', createNew);
   module.exports = router;
   ```

4. **Register Routes**
   ```javascript
   // src/server.js
   const newRoutes = require('./routes/new');
   app.use('/api/new', newRoutes);
   ```

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License.