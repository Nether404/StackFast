# Developer Tools API - Deployment Guide

This guide covers deploying the Developer Tools API to both Vercel and Render platforms.

## Prerequisites

- Git repository with the API code
- Python 3.11+ environment
- All dependencies listed in `requirements.txt`

## Database Considerations

### SQLite (Development)
- The current setup uses SQLite for simplicity
- Works well for development and small-scale deployments
- Database file is included in the repository

### Production Database Options
For production deployments, consider upgrading to:
- **PostgreSQL** (recommended for Render)
- **PlanetScale** or **Supabase** (recommended for Vercel)
- **MongoDB Atlas** (for document-based storage)

## Vercel Deployment

Vercel is ideal for serverless deployments with automatic scaling.

### Step 1: Prepare for Vercel
1. Ensure `vercel.json` is in the project root
2. Update database configuration for serverless environment
3. Consider using a serverless-compatible database

### Step 2: Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name: developer-tools-api
# - Directory: ./
# - Override settings? No
```

### Step 3: Configure Environment Variables
In the Vercel dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add any required environment variables:
   - `FLASK_ENV=production`
   - Database connection strings (if using external DB)

### Step 4: Custom Domain (Optional)
1. In Vercel dashboard, go to "Domains"
2. Add your custom domain
3. Configure DNS settings as instructed

### Vercel Considerations
- **Pros:** Automatic scaling, global CDN, easy Git integration
- **Cons:** 10-second timeout limit, cold starts, serverless limitations
- **Best for:** APIs with variable traffic, global distribution needs

## Render Deployment

Render provides traditional server hosting with persistent connections.

### Step 1: Prepare for Render
1. Ensure `render.yaml` is in the project root (optional)
2. Push code to a Git repository (GitHub, GitLab, or Bitbucket)

### Step 2: Deploy to Render
1. Sign up/login to [Render](https://render.com)
2. Click "New +" and select "Web Service"
3. Connect your Git repository
4. Configure the service:
   - **Name:** developer-tools-api
   - **Environment:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python src/main.py`
   - **Plan:** Choose based on your needs (Free/Starter/Standard)

### Step 3: Configure Environment Variables
In the Render dashboard:
1. Go to your service settings
2. Navigate to "Environment"
3. Add environment variables:
   - `FLASK_ENV=production`
   - `PORT=5001` (or use Render's default)

### Step 4: Database Setup (Optional)
For production, create a PostgreSQL database:
1. In Render dashboard, click "New +" → "PostgreSQL"
2. Configure database settings
3. Update your Flask app to use the database URL

### Render Considerations
- **Pros:** Persistent connections, managed databases, predictable pricing
- **Cons:** No automatic global distribution, manual scaling
- **Best for:** Always-on services, database-heavy applications

## Database Migration for Production

### Option 1: PostgreSQL (Recommended for Render)
```python
# Update src/main.py
import os

# Replace SQLite configuration with:
database_url = os.environ.get('DATABASE_URL', 'sqlite:///database/app.db')
if database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
```

### Option 2: Serverless Database (Recommended for Vercel)
```python
# Example with PlanetScale
import os

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
    'DATABASE_URL',
    'sqlite:///database/app.db'  # fallback for development
)
```

## Environment Variables

### Required Variables
- `FLASK_ENV`: Set to "production" for production deployments

### Optional Variables
- `DATABASE_URL`: External database connection string
- `SECRET_KEY`: Flask secret key (generate a secure one for production)
- `CORS_ORIGINS`: Specific origins for CORS (if not allowing all)

## Post-Deployment Steps

### 1. Test the Deployment
```bash
# Test basic functionality
curl https://your-domain.com/api/tools/stats

# Test specific endpoints
curl https://your-domain.com/api/tools/1
curl https://your-domain.com/api/tools/categories
```

### 2. Monitor Performance
- Set up monitoring for API response times
- Monitor database performance (if using external DB)
- Set up error tracking (Sentry, etc.)

### 3. Set up CI/CD (Optional)
Both platforms support automatic deployments from Git:
- **Vercel:** Automatic deployments on Git push
- **Render:** Automatic deployments on Git push (configure in settings)

## Scaling Considerations

### Vercel Scaling
- Automatic scaling based on traffic
- No configuration needed
- Pay-per-use model

### Render Scaling
- Manual scaling (upgrade plan for more resources)
- Horizontal scaling available on higher plans
- Consider load balancing for high traffic

## Security Best Practices

1. **Environment Variables:** Never commit secrets to Git
2. **HTTPS:** Both platforms provide HTTPS by default
3. **CORS:** Configure appropriate CORS settings for production
4. **Rate Limiting:** Consider implementing rate limiting for public APIs
5. **Authentication:** Add API authentication for admin endpoints

## Troubleshooting

### Common Issues
1. **Import Errors:** Ensure all dependencies are in `requirements.txt`
2. **Database Errors:** Check database connection strings and permissions
3. **Timeout Errors:** Optimize database queries and consider caching
4. **CORS Issues:** Verify CORS configuration for your frontend domain

### Logs and Debugging
- **Vercel:** View logs in Vercel dashboard → Functions tab
- **Render:** View logs in Render dashboard → Logs tab

## Cost Estimation

### Vercel Pricing
- **Hobby:** Free tier with usage limits
- **Pro:** $20/month per user with higher limits
- **Enterprise:** Custom pricing

### Render Pricing
- **Free:** Limited resources, good for testing
- **Starter:** $7/month for basic production use
- **Standard:** $25/month for higher performance

## Backup and Recovery

### Database Backups
- **Render PostgreSQL:** Automatic daily backups
- **External Databases:** Configure backup policies
- **SQLite:** Regular file backups if using SQLite

### Code Backups
- Git repository serves as code backup
- Both platforms deploy from Git, ensuring version control

## Monitoring and Analytics

Consider integrating:
- **Application Performance Monitoring:** New Relic, Datadog
- **Error Tracking:** Sentry, Rollbar
- **API Analytics:** Custom logging, third-party services

This deployment guide should help you successfully deploy the Developer Tools API to either platform based on your specific needs and requirements.

