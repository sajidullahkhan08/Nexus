# Nexus Platform Backend

Node.js/Express backend for the Business Nexus platform - connecting entrepreneurs and investors.

## 🚀 Railway Deployment

This backend is configured for seamless deployment on Railway.

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