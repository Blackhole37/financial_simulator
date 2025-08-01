# 🆓 FREE Deployment Guide for Gurukul AI Agents

## 🎯 Yes, You Can Deploy for FREE!

You can deploy your Gurukul AI agents on Render's free tier! Here are your options:

## 🆓 What's Free on Render

✅ **1 Web Service** - 750 hours/month (enough for 24/7 operation)
✅ **Static Sites** - Unlimited
✅ **Bandwidth** - 100GB/month
✅ **Build Minutes** - 500 minutes/month

❌ **Redis** - Requires paid plan ($7/month)
❌ **Multiple Web Services** - Only 1 free web service
❌ **Custom Domains** - Requires paid plan

## 🚀 Free Deployment Options

### Option 1: Single Service (Recommended)
Deploy your most important service - the **Financial Simulator**

### Option 2: Combined Service
All services combined into one (experimental)

## 📋 Free Tier Setup - Financial Simulator

### Step 1: External Services (FREE)
1. **MongoDB Atlas** - Sign up at [cloud.mongodb.com](https://cloud.mongodb.com)
   - Create FREE M0 cluster (512MB storage)
   - Get connection string
   - Whitelist all IPs (0.0.0.0/0)

2. **API Keys** - Get these free/paid API keys:
   - OpenAI API key (pay-per-use, ~$5-20/month typical usage)
   - Groq API key (free tier available)
   - AgentOps API key (optional, free tier available)

### Step 2: Deploy to Render FREE

1. **Go to Render Dashboard**
   - Visit [dashboard.render.com](https://dashboard.render.com)
   - Sign up with GitHub (free)

2. **Create Web Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Choose "Deploy from a Git repository"

3. **Configure Service**
   ```
   Name: gurukul-ai-free
   Environment: Python 3
   Build Command: cd Backend/Financial_simulator && pip install -r requirements.txt
   Start Command: cd Backend/Financial_simulator && python start_free_tier.py
   ```

4. **Set Environment Variables**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/financial_simulator?retryWrites=true&w=majority
   OPENAI_API_KEY=your_openai_api_key
   GROQ_API_KEY=your_groq_api_key
   AGENTOPS_API_KEY=your_agentops_api_key
   PORT=10000
   USE_REDIS=false
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for build to complete (~5-10 minutes)

### Step 3: Alternative - Use Blueprint

Use the pre-configured free tier blueprint:

1. **Upload render-free-tier.yaml to your repository root**
2. **Go to Render Dashboard**
3. **Click "New" → "Blueprint"**
4. **Connect repository and select render-free-tier.yaml**
5. **Set environment variables**
6. **Deploy**

## 🌐 Your Free Service URL

After deployment, your service will be available at:
```
https://gurukul-ai-free.onrender.com
```

Test endpoints:
- Health: `https://gurukul-ai-free.onrender.com/health`
- Docs: `https://gurukul-ai-free.onrender.com/docs`
- Root: `https://gurukul-ai-free.onrender.com/`

## ⚠️ Free Tier Limitations

### Service Limitations
- **Sleep after 15 minutes** of inactivity
- **Cold start** takes 30-60 seconds after sleep
- **750 hours/month** total (enough for 24/7 if only 1 service)
- **512MB RAM** limit
- **No persistent disk** storage

### Workarounds Implemented
- ✅ **Redis disabled** - Uses in-memory cache instead
- ✅ **Optimized startup** - Faster cold starts
- ✅ **Minimal dependencies** - Reduced build time
- ✅ **Health checks** - Keeps service awake if pinged regularly

## 💡 Tips to Maximize Free Tier

### Keep Service Awake
Use a service like [UptimeRobot](https://uptimerobot.com) (free) to ping your service every 5 minutes:
```
https://gurukul-ai-free.onrender.com/health
```

### Optimize Usage
- Use during development/testing
- Upgrade to paid when ready for production
- Monitor usage in Render dashboard

### Cost After Free Tier
If you exceed free limits:
- **Starter Plan**: $7/month per service
- **Redis**: $7/month additional
- **Total for full setup**: ~$35/month

## 🔧 Free Tier Configuration Files

### Files Created for Free Deployment:
- `render-free-tier.yaml` - Free tier blueprint
- `Backend/Financial_simulator/start_free_tier.py` - Optimized startup
- `Backend/combined_service/` - Combined service option

### Environment Variables for Free Tier:
```bash
# Required
MONGODB_URI=your_mongodb_atlas_connection_string
OPENAI_API_KEY=your_openai_api_key
GROQ_API_KEY=your_groq_api_key

# Optional
AGENTOPS_API_KEY=your_agentops_api_key

# Free tier specific
PORT=10000
USE_REDIS=false
MAX_WORKERS=1
```

## 🆙 Upgrade Path

When ready to scale:

1. **Add Redis** ($7/month) - Enable caching
2. **Add more services** ($7/month each) - Deploy other agents
3. **Custom domain** ($1/month) - Professional URL
4. **Larger plans** ($25+/month) - More resources

## 🛠️ Troubleshooting Free Tier

### Common Issues:
1. **Service sleeps** - Use UptimeRobot to keep awake
2. **Cold starts** - First request after sleep is slow
3. **Memory limits** - Optimize code, reduce dependencies
4. **Build timeouts** - Simplify requirements.txt

### Solutions:
- Monitor resource usage in Render dashboard
- Use health check endpoint for monitoring
- Optimize startup time
- Consider upgrading if limits are hit

## 🎉 You're Ready for FREE Deployment!

Your Gurukul AI Financial Simulator can run completely free on Render with:
- ✅ MongoDB Atlas (free tier)
- ✅ Render Web Service (free tier)
- ✅ API keys (pay-per-use)

**Total monthly cost: $0 + API usage** (typically $5-20/month for OpenAI)

Choose your deployment method and get started! 🚀
