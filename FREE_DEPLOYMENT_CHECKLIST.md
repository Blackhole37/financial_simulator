# 🆓 FREE Deployment Checklist

## ✅ Pre-Deployment (All FREE)

### 1. MongoDB Atlas Setup (FREE)
- [ ] Sign up at [cloud.mongodb.com](https://cloud.mongodb.com)
- [ ] Create M0 cluster (FREE - 512MB)
- [ ] Create database user
- [ ] Get connection string
- [ ] Whitelist all IPs (0.0.0.0/0)

### 2. API Keys (Pay-per-use)
- [ ] OpenAI API key from [platform.openai.com](https://platform.openai.com)
- [ ] Groq API key from [console.groq.com](https://console.groq.com) (FREE tier available)
- [ ] AgentOps API key from [agentops.ai](https://agentops.ai) (optional, FREE tier)

### 3. Repository Setup
- [ ] Code pushed to GitHub
- [ ] `render-free-tier.yaml` in root directory
- [ ] `Backend/Financial_simulator/start_free_tier.py` exists

## 🚀 Deployment Steps

### Option A: Blueprint Deployment (Recommended)
1. [ ] Go to [dashboard.render.com](https://dashboard.render.com)
2. [ ] Click "New" → "Blueprint"
3. [ ] Connect GitHub repository
4. [ ] Select `render-free-tier.yaml`
5. [ ] Click "Apply"

### Option B: Manual Deployment
1. [ ] Go to [dashboard.render.com](https://dashboard.render.com)
2. [ ] Click "New" → "Web Service"
3. [ ] Connect GitHub repository
4. [ ] Configure:
   - Name: `gurukul-ai-free`
   - Build Command: `cd Backend/Financial_simulator && pip install -r requirements.txt`
   - Start Command: `cd Backend/Financial_simulator && python start_free_tier.py`

## 🔧 Environment Variables to Set

```bash
# Required
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/financial_simulator?retryWrites=true&w=majority
OPENAI_API_KEY=your_openai_api_key_here
GROQ_API_KEY=your_groq_api_key_here

# Optional
AGENTOPS_API_KEY=your_agentops_api_key_here

# Auto-configured for free tier
PORT=10000
USE_REDIS=false
MAX_WORKERS=1
```

## 🧪 Post-Deployment Testing

### Test Your Service
- [ ] Service URL: `https://your-service-name.onrender.com`
- [ ] Health check: `https://your-service-name.onrender.com/health`
- [ ] API docs: `https://your-service-name.onrender.com/docs`
- [ ] Root endpoint: `https://your-service-name.onrender.com/`

### Expected Response Times
- [ ] First request (cold start): 30-60 seconds
- [ ] Subsequent requests: 1-3 seconds
- [ ] After 15min inactivity: Service sleeps

## 💡 Keep Service Awake (Optional)

### Use UptimeRobot (FREE)
1. [ ] Sign up at [uptimerobot.com](https://uptimerobot.com)
2. [ ] Create HTTP monitor
3. [ ] URL: `https://your-service-name.onrender.com/health`
4. [ ] Interval: 5 minutes
5. [ ] This prevents service from sleeping

## 📊 Monitor Usage

### Render Dashboard
- [ ] Check build minutes used (500/month limit)
- [ ] Monitor bandwidth usage (100GB/month limit)
- [ ] Watch service hours (750/month limit)

### Expected Usage
- **Build time**: 5-10 minutes per deployment
- **Service hours**: 744 hours/month (if always on)
- **Bandwidth**: Depends on API usage

## 💰 Cost Breakdown

### Completely FREE Option
- Render Web Service: $0 (free tier)
- MongoDB Atlas: $0 (M0 cluster)
- **Total infrastructure: $0/month**

### API Costs (Pay-per-use)
- OpenAI API: ~$5-20/month (typical usage)
- Groq API: $0 (free tier available)
- AgentOps: $0 (free tier)
- **Total API costs: $5-20/month**

### **Grand Total: $5-20/month**

## 🆙 When to Upgrade

### Upgrade to Paid ($7/month) if:
- [ ] Service sleeps too often
- [ ] Need faster response times
- [ ] Exceed 750 hours/month
- [ ] Need custom domain
- [ ] Want to add Redis caching

### Add More Services ($7/month each) if:
- [ ] Want to deploy other agents
- [ ] Need service separation
- [ ] Require different configurations

## 🛠️ Troubleshooting

### Common Issues
- [ ] **Build fails**: Check requirements.txt, Python version
- [ ] **Service won't start**: Check environment variables
- [ ] **Database connection fails**: Verify MongoDB URI and IP whitelist
- [ ] **API errors**: Check API keys and quotas
- [ ] **Service sleeps**: Use UptimeRobot or upgrade to paid

### Getting Help
- [ ] Check Render build logs
- [ ] Test health endpoint
- [ ] Verify environment variables
- [ ] Check API key validity

## 🎉 Success Criteria

Your deployment is successful when:
- [ ] ✅ Service builds without errors
- [ ] ✅ Health endpoint returns 200 OK
- [ ] ✅ API documentation loads
- [ ] ✅ Can make API requests
- [ ] ✅ Database connection works
- [ ] ✅ Service stays within free tier limits

## 📱 Frontend Integration

Update your frontend to use the new URL:
```javascript
const API_BASE_URL = "https://your-service-name.onrender.com";
```

---

**Ready to deploy for FREE?** Follow this checklist step by step! 🚀
