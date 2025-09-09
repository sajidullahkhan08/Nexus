# Business Nexus Platform

A comprehensive platform connecting entrepreneurs and investors for collaboration and growth.

## 🚀 Features

- **User Authentication**: Secure registration and login for entrepreneurs and investors
- **Profile Management**: Comprehensive profile creation with role-specific fields
- **Real-time Chat**: Instant messaging between users
- **Document Management**: Upload, share, and manage business documents
- **Meeting Scheduling**: Schedule and manage business meetings
- **Responsive Design**: Mobile-first design with modern UI

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls
- **Socket.IO Client** for real-time features

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Socket.IO** for real-time communication
- **Multer** for file uploads
- **Nodemailer** for email services

## 📦 Installation

### Prerequisites
- Node.js 18+
- MongoDB
- npm or yarn

### Frontend Setup
```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

## 🚀 Deployment

### Frontend (Vercel)

1. **Connect Repository**
   - Push code to GitHub
   - Connect repository to Vercel

2. **Environment Variables**
   ```bash
   VITE_API_URL=https://your-render-app.onrender.com/api
   VITE_SOCKET_URL=https://your-render-app.onrender.com
   ```

3. **Deploy**
   ```bash
   npm run deploy:vercel
   ```

### Backend (Render)

1. **Connect Repository**
   - Push backend code to GitHub
   - Connect repository to Render

2. **Environment Variables**
   ```bash
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your-jwt-secret
   JWT_REFRESH_SECRET=your-refresh-secret
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```

3. **Build Settings**
   - Build Command: `npm install`
   - Start Command: `npm start`

## 🔧 Environment Variables

### Frontend (.env.local)
```bash
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_APP_NAME=Business Nexus
```

### Backend (.env)
```bash
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/nexus-platform
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:5173
```

## 📁 Project Structure

```
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Page components
│   ├── context/            # React context providers
│   ├── services/           # API and utility services
│   ├── types/              # TypeScript type definitions
│   └── config/             # Configuration files
├── backend/
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   └── utils/          # Utility functions
│   └── uploads/            # File uploads directory
└── public/                 # Static assets
```

## 🔐 Authentication

The platform uses JWT tokens for authentication with the following flow:

1. User registers/logs in
2. Server returns access and refresh tokens
3. Access token stored in localStorage
4. Automatic token refresh on expiration
5. Secure logout removes all tokens

## 📡 Real-time Features

- **WebSocket Connection**: Socket.IO for real-time communication
- **Live Chat**: Instant messaging between users
- **Online Status**: Real-time user presence indicators
- **Typing Indicators**: Live typing status in chat

## 🗄️ Database Schema

### User Model
- Basic info: name, email, password, role
- Profile: bio, avatar, location
- Entrepreneur fields: startupName, pitchSummary, fundingNeeded, industry
- Investor fields: investmentInterests, investmentStage, portfolioCompanies
- Security: refreshTokens, email verification, 2FA

### Other Models
- Messages, Meetings, Documents, Collaborations

## 🧪 Testing

```bash
# Run frontend tests
npm run test

# Run backend tests
cd backend && npm run test

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📈 Performance

- **Code Splitting**: Automatic chunk splitting for optimal loading
- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Automatic image compression
- **Caching**: Efficient caching strategies
- **Compression**: Gzip compression enabled

## 🔒 Security

- **HTTPS**: SSL/TLS encryption
- **CORS**: Cross-origin resource sharing protection
- **Helmet**: Security headers
- **Rate Limiting**: API rate limiting
- **Input Validation**: Comprehensive input sanitization
- **JWT Security**: Secure token handling

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, email support@businessnexus.com or join our Discord community.

## 🔄 API Documentation

API documentation is available at `/api/docs` when the backend is running.

---

**Built with ❤️ for entrepreneurs and investors worldwide**