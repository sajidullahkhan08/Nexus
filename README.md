# Nexus Platform - Full Stack Application

A comprehensive collaboration platform connecting investors and entrepreneurs with real-time communication, meeting scheduling, document management, and secure payment processing.

## 🚀 Features

### Core Functionality
- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Profiles**: Separate dashboards for entrepreneurs and investors
- **Real-time Chat**: WebSocket-powered messaging system
- **Video Calling**: WebRTC integration for face-to-face meetings
- **Meeting Scheduling**: Calendar system with conflict detection
- **Document Management**: Secure file upload, sharing, and e-signature support
- **Payment Processing**: Mock payment system with transaction tracking
- **Security**: Rate limiting, input sanitization, CORS protection

### Tech Stack

**Frontend:**
- React 18 with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Socket.IO client for real-time features
- Axios for API communication
- React Hot Toast for notifications

**Backend:**
- Node.js with Express.js
- MongoDB with Mongoose ODM
- Socket.IO for real-time communication
- JWT for authentication
- Multer for file uploads
- Nodemailer for email services
- Stripe integration for payments
- Comprehensive security middleware

## 🏗️ Project Structure

```
nexus-platform/
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── context/           # React context providers
│   ├── services/          # API and socket services
│   ├── config/            # Configuration files
│   └── types/             # TypeScript type definitions
├── backend/               # Backend Node.js application
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Custom middleware
│   │   ├── services/      # Business logic
│   │   ├── utils/         # Utility functions
│   │   └── config/        # Database configuration
│   └── uploads/           # File storage
└── docs/                  # Documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nexus-platform
   ```

2. **Install dependencies for both frontend and backend**
   ```bash
   npm run full:install
   ```

3. **Environment Setup**
   
   **Frontend (.env):**
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   ```
   
   **Backend (backend/.env):**
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/nexus-platform
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   FRONTEND_URL=http://localhost:5173
   ```

4. **Start the development servers**
   ```bash
   # Start both frontend and backend concurrently
   npm run full:dev
   
   # Or start them separately:
   npm run dev              # Frontend only
   npm run backend:dev      # Backend only
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000/api
   - API Documentation: http://localhost:5000/api/docs

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user

### User Management
- `GET /api/users` - Get all users (with filters)
- `GET /api/users/entrepreneurs` - Get entrepreneurs
- `GET /api/users/investors` - Get investors
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/avatar` - Update user avatar
- `DELETE /api/users/account` - Delete user account

### Meeting Management
- `POST /api/meetings` - Create meeting
- `GET /api/meetings` - Get user meetings
- `GET /api/meetings/:id` - Get meeting by ID
- `PUT /api/meetings/:id` - Update meeting
- `PUT /api/meetings/:id/respond` - Respond to invitation
- `POST /api/meetings/:id/join` - Join meeting
- `POST /api/meetings/:id/leave` - Leave meeting
- `DELETE /api/meetings/:id` - Delete meeting

## 🔌 WebSocket Events

### Chat Events
- `send_message` - Send a message
- `new_message` - Receive a message
- `mark_read` - Mark message as read
- `typing_start` / `typing_stop` - Typing indicators

### Video Call Events
- `join_call` / `leave_call` - Call management
- `offer` / `answer` / `ice_candidate` - WebRTC signaling
- `toggle_audio` / `toggle_video` - Media controls

### Meeting Events
- `join_meeting` / `leave_meeting` - Meeting room management
- `participant_joined` / `participant_left` - Participant updates
- `start_screen_share` / `stop_screen_share` - Screen sharing
- `meeting_message` - Meeting chat

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Rate Limiting**: Prevents API abuse with configurable limits
- **Input Sanitization**: Removes XSS attempts and malicious input
- **CORS Protection**: Configured for specific frontend domains
- **Password Hashing**: bcrypt with configurable salt rounds
- **Security Headers**: Helmet.js for security headers
- **Role-based Authorization**: Separate permissions for entrepreneurs and investors

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Render/Railway)

**Render:**
1. Connect GitHub repository
2. Set environment variables
3. Deploy with automatic builds

**Railway:**
1. Connect repository
2. Configure environment variables
3. Deploy with one-click deployment

### Environment Variables for Production

**Frontend:**
```env
VITE_API_URL=https://your-backend-domain.com/api
VITE_SOCKET_URL=https://your-backend-domain.com
```

**Backend:**
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nexus-platform
JWT_SECRET=your-production-jwt-secret
FRONTEND_URL=https://your-frontend-domain.com
```

## 🧪 Testing

```bash
# Frontend tests
npm test

# Backend tests
cd backend && npm test

# Run tests with coverage
npm run test:coverage
```

## 📱 Demo Flow

1. **Registration/Login**: Create account as entrepreneur or investor
2. **Profile Setup**: Complete profile with role-specific information
3. **Discovery**: Browse and search for potential collaborators
4. **Connection**: Send collaboration requests
5. **Communication**: Real-time chat and messaging
6. **Meeting Scheduling**: Schedule and join video meetings
7. **Document Sharing**: Upload and share business documents
8. **E-signatures**: Sign documents electronically
9. **Payment Processing**: Handle transactions and payments
10. **Dashboard Management**: Track all activities and connections

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Email: support@nexusplatform.com
- Documentation: [API Docs](http://localhost:5000/api/docs)

## 🔄 Development Workflow

### Adding New Features

1. **Backend First**: Create models, controllers, and routes
2. **API Testing**: Test endpoints with Postman or similar
3. **Frontend Integration**: Update services and components
4. **Real-time Features**: Add Socket.IO events if needed
5. **Testing**: Write and run tests
6. **Documentation**: Update API docs and README

### Code Quality

- ESLint and Prettier for code formatting
- TypeScript for type safety
- Comprehensive error handling
- Input validation and sanitization
- Security best practices

---

Built with ❤️ for the startup ecosystem