# 🚀 Quick Deploy Checklist for Gurukul AI Agents

## ✅ Pre-Deployment Checklist

### 1. External Services
- [ ] MongoDB Atlas cluster created
- [ ] MongoDB Atlas connection string obtained  
- [ ] MongoDB Atlas IP whitelist configured (0.0.0.0/0)
- [ ] Database user created with read/write permissions

### 2. API Keys Ready
- [ ] OpenAI API key obtained
- [ ] Groq API key obtained
- [ ] HuggingFace API token obtained
- [ ] AgentOps API key obtained (optional)

### 3. Repository Setup
- [ ] All code pushed to GitHub
- [ ] All deployment files included
- [ ] Repository is public or Render has access

## 🎯 Deployment Steps

### Option 1: Deploy All Services (Recommended)
1. [ ] Go to [Render Dashboard](https://dashboard.render.com)
2. [ ] Click "New" → "Blueprint"
3. [ ] Connect GitHub repository
4. [ ] Select `render-all-services.yaml`
5. [ ] Click "Apply"

### Option 2: Deploy Individual Services
1. [ ] Deploy Financial Simulator using `Backend/Financial_simulator/render.yaml`
2. [ ] Deploy API Data Service using `Backend/api_data/render.yaml`
3. [ ] Deploy Pipeline Service using `Backend/pipline-24-master/render.yaml`
4. [ ] Deploy TTS Service using `Backend/tts_service/render.yaml`

## 🔧 Environment Variables to Set

### Financial Simulator
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/financial_simulator?retryWrites=true&w=majority
OPENAI_API_KEY=your_openai_api_key
GROQ_API_KEY=your_groq_api_key
AGENTOPS_API_KEY=your_agentops_api_key
```

### API Data Service
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gurukul_api_data?retryWrites=true&w=majority
HUGGINGFACE_API_TOKEN=your_huggingface_token
OPENAI_API_KEY=your_openai_api_key
```

### Pipeline Service
```
OPENAI_API_KEY=your_openai_api_key
HUGGINGFACE_API_TOKEN=your_huggingface_token
```

### TTS Service
```
# No external API keys required!
```

## 🧪 Post-Deployment Testing

### Test Health Endpoints
- [ ] Financial Simulator: `/health`
- [ ] API Data Service: `/health`
- [ ] Pipeline Service: `/`
- [ ] TTS Service: `/api/health`

### Test API Documentation
- [ ] Financial Simulator: `/docs`
- [ ] API Data Service: `/docs`
- [ ] Pipeline Service: `/docs`
- [ ] TTS Service: `/docs`

## 🌐 Your Service URLs

After deployment, your services will be available at:

- **Financial Simulator**: `https://gurukul-financial-simulator.onrender.com`
- **API Data Service**: `https://gurukul-api-data-service.onrender.com`
- **Pipeline Service**: `https://gurukul-pipeline-service.onrender.com`
- **TTS Service**: `https://gurukul-tts-service.onrender.com`

## 💰 Expected Costs

### All Services (Starter Plans)
- 4 Web Services: $28/month
- 1 Redis Service: $7/month
- **Total: $35/month**

### Single Service (Free Tier)
- 1 Web Service: $0/month
- **Total: $0/month** (750 hours limit)

## 🆘 Need Help?

If you encounter issues:

1. **Check build logs** in Render dashboard
2. **Verify environment variables** are set correctly
3. **Test database connections** using health endpoints
4. **Check API key validity** and quotas
5. **Review service logs** for runtime errors

## 📚 Documentation Files

- `RENDER_DEPLOYMENT_COMPLETE.md` - Complete deployment guide
- `DEPLOYMENT_STRATEGY.md` - Detailed deployment strategy
- `render-all-services.yaml` - Master deployment configuration
- Individual service `render.yaml` files in each service directory

---

**Ready to deploy?** Follow this checklist step by step! 🎉
