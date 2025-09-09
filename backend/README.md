# Nexus Platform Backend

Node.js/Express backend for the Business Nexus platform - connecting entrepreneurs and investors.

## 🚀 Vercel Deployment (Recommended)

This backend is configured for seamless deployment on Vercel as serverless functions.

### Prerequisites
- Vercel account (https://vercel.com)
- MongoDB Atlas account
- GitHub repository
- Frontend deployed at: `https://nexus-1dgt-git-main-sajidullahkhan08s-projects.vercel.app`

### Quick Deploy

1. **Push Backend to GitHub**
   ```bash
   git add .
   git commit -m "Vercel backend deployment"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Go to Vercel Dashboard
   - Click "New Project"
   - Connect your GitHub repository
   - Select the `backend` directory as root
   - Vercel will auto-detect Node.js and use `vercel.json`

3. **Configure Environment Variables**
   ```bash
   # In Vercel Dashboard → Project Settings → Environment Variables
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your-secure-jwt-secret
   JWT_REFRESH_SECRET=your-secure-refresh-secret
   FRONTEND_URL=https://nexus-1dgt-git-main-sajidullahkhan08s-projects.vercel.app
   NODE_ENV=production
   ```

### Vercel Configuration

The `vercel.json` file contains:
- **Serverless functions**: API routes in `/api` directory
- **Build settings**: Node.js 18 runtime
- **Routes**: API routing and health checks
- **Environment**: Production configuration

### API Structure

Vercel expects API routes in the `api/` directory:
```
backend/
├── api/
│   ├── health.js          # Health check endpoint
│   ├── auth/
│   │   ├── register.js
│   │   ├── login.js
│   │   └── ...
│   ├── users/
│   │   ├── index.js
│   │   └── [id].js
│   └── ...
├── vercel.json
└── package.json
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB Atlas connection string | ✅ |
| `JWT_SECRET` | JWT signing secret | ✅ |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | ✅ |
| `FRONTEND_URL` | Frontend application URL | ✅ |
| `NODE_ENV` | Environment mode | ❌ |

### CORS Configuration

The backend is pre-configured to accept requests from:
- `https://nexus-1dgt-git-main-sajidullahkhan08s-projects.vercel.app` (your frontend)
- Any URL specified in `FRONTEND_URL` environment variable

### File Uploads

- **Serverless limitation**: Vercel has file size limits (5MB)
- **Alternative**: Use cloud storage (Cloudinary, AWS S3)
- **Local storage**: Limited to function execution time

### WebSocket Support

- **Serverless limitation**: WebSockets not fully supported
- **Alternative**: Use Socket.IO with polling fallback
- **Consider**: Railway or Render for WebSocket features

### Monitoring

Vercel provides:
- **Real-time logs**: Function execution logs
- **Analytics**: Request metrics and performance
- **Error tracking**: Automatic error monitoring
- **Deployments**: Deployment history and rollback

### Scaling

- **Automatic scaling**: Based on request volume
- **Cold starts**: Initial request may be slower
- **Concurrent executions**: Up to 1000 concurrent functions
- **Timeout**: 30 seconds max execution time

### Cost Optimization

- **Free tier**: 100GB bandwidth, 100 hours runtime
- **Hobby plan**: $7/month - more resources
- **Pro plan**: $20/month - advanced features

---

## 🚂 Railway Deployment (Alternative)

This backend can also be deployed on Railway.

### Prerequisites
- Railway account (https://railway.app)
- MongoDB Atlas account
- GitHub repository

### Quick Deploy

1. **Connect Repository**
   ```bash
   # Push backend to GitHub
   git add .
   git commit -m "Railway deployment"
   git push origin main
   ```

2. **Deploy on Railway**
   - Go to Railway Dashboard
   - Click "New Project"
   - Connect your GitHub repository
   - Railway will auto-detect Node.js and use `railway.json`

3. **Configure Environment Variables**
   ```bash
   # In Railway Dashboard → Variables
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your-secure-jwt-secret
   JWT_REFRESH_SECRET=your-secure-refresh-secret
   FRONTEND_URL=https://your-frontend.vercel.app
   NODE_ENV=production
   ```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB Atlas connection string | ✅ |
| `JWT_SECRET` | JWT signing secret | ✅ |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | ✅ |
| `FRONTEND_URL` | Frontend application URL | ✅ |
| `NODE_ENV` | Environment (production) | ✅ |
| `EMAIL_HOST` | SMTP host (optional) | ❌ |
| `EMAIL_USER` | SMTP username (optional) | ❌ |
| `EMAIL_PASS` | SMTP password (optional) | ❌ |

### Railway Configuration

The `railway.json` file contains:
- **Build settings**: Uses Nixpacks builder
- **Start command**: `npm start`
- **Health check**: `/health` endpoint
- **Environment variables**: Production configuration

### Database Setup

1. **MongoDB Atlas**
   - Create cluster
   - Create database user
   - Whitelist Railway IP (0.0.0.0/0 for Railway)
   - Get connection string

2. **Railway Database** (Alternative)
   - Railway provides PostgreSQL by default
   - Can add MongoDB plugin if needed

### File Uploads

- **Local storage**: Files stored in `/opt/render/project/src/uploads/`
- **Cloud storage**: Configure Cloudinary for production
- **Railway volume**: Can be added for persistent file storage

### Monitoring

Railway provides:
- **Logs**: Real-time application logs
- **Metrics**: CPU, memory, and network usage
- **Health checks**: Automatic health monitoring
- **Deployments**: Deployment history and rollback

### Troubleshooting

#### Build Issues
```bash
# Check Railway build logs
# Ensure package.json has correct scripts
# Verify Node.js version compatibility
```

#### Database Connection
```bash
# Verify MongoDB Atlas connection string
# Check IP whitelist (0.0.0.0/0 for Railway)
# Ensure database user has correct permissions
```

#### Environment Variables
```bash
# Use Railway dashboard to set variables
# Variables are encrypted and secure
# Changes require redeployment
```

### API Endpoints

Once deployed, your API will be available at:
```
https://your-app.railway.app/api
```

Key endpoints:
- `GET /health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/docs` - API documentation

### Security Features

- **CORS**: Configured for frontend domain
- **Helmet**: Security headers
- **Rate limiting**: API rate protection
- **JWT**: Secure authentication
- **Input validation**: Request sanitization

### Performance

- **Automatic scaling**: Railway scales based on traffic
- **Global CDN**: Fast content delivery
- **Persistent connections**: WebSocket support
- **Health monitoring**: Automatic restarts on failure

---

For more information, visit [Railway Documentation](https://docs.railway.app/).