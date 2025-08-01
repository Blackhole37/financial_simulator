# Complete Render Deployment Guide for Gurukul AI Agents

## 🎯 Quick Start

Your Gurukul AI backend is now ready for deployment on Render! This guide covers deploying all 4 services:

1. **Financial Simulator** - Financial planning with LangGraph
2. **API Data Service** - RAG and OCR functionality  
3. **Pipeline Service** - Lesson generation with TTS
4. **TTS Service** - Text-to-speech generation

## 🚀 Deployment Steps

### Step 1: Prerequisites Setup

#### MongoDB Atlas (Required)
1. Sign up at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free M0 cluster
3. Create database user with read/write permissions
4. Get connection string and replace `<password>` with your password
5. Whitelist IP addresses (use 0.0.0.0/0 for development)

#### API Keys (Get these ready)
- **OpenAI API Key**: [platform.openai.com](https://platform.openai.com)
- **Groq API Key**: [console.groq.com](https://console.groq.com)
- **HuggingFace Token**: [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
- **AgentOps API Key** (optional): [agentops.ai](https://agentops.ai)

### Step 2: Choose Deployment Method

#### Option A: Deploy All Services Together (Recommended)
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Blueprint"
3. Connect your GitHub repository
4. Select `render-all-services.yaml` from the root directory
5. Render will create all 4 services + Redis automatically

#### Option B: Deploy Services Individually
Deploy each service separately using their individual `render.yaml` files:
- `Backend/Financial_simulator/render.yaml`
- `Backend/api_data/render.yaml`
- `Backend/pipline-24-master/render.yaml`
- `Backend/tts_service/render.yaml`

### Step 3: Configure Environment Variables

In each service's settings, add these environment variables:

#### All Services Need:
```
PORT=8000  # (or 8001, 8002, 8003 depending on service)
HOST=0.0.0.0
CORS_ORIGINS=*
```

#### Financial Simulator:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/financial_simulator?retryWrites=true&w=majority
OPENAI_API_KEY=your_openai_api_key
GROQ_API_KEY=your_groq_api_key
AGENTOPS_API_KEY=your_agentops_api_key (optional)
```

#### API Data Service:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gurukul_api_data?retryWrites=true&w=majority
HUGGINGFACE_API_TOKEN=your_huggingface_token
OPENAI_API_KEY=your_openai_api_key (optional)
```

#### Pipeline Service:
```
OPENAI_API_KEY=your_openai_api_key
HUGGINGFACE_API_TOKEN=your_huggingface_token
```

#### TTS Service:
```
# No external API keys required!
```

### Step 4: Deploy and Test

1. **Monitor Build Logs**: Watch for any build errors in Render dashboard
2. **Check Health Endpoints**: Test each service's health endpoint
3. **Verify Service Communication**: Ensure services can communicate with each other

## 🔍 Testing Your Deployment

After deployment, test these endpoints:

### Financial Simulator
- Health: `https://gurukul-financial-simulator.onrender.com/health`
- Docs: `https://gurukul-financial-simulator.onrender.com/docs`

### API Data Service  
- Health: `https://gurukul-api-data-service.onrender.com/health`
- Docs: `https://gurukul-api-data-service.onrender.com/docs`

### Pipeline Service
- Root: `https://gurukul-pipeline-service.onrender.com/`
- Docs: `https://gurukul-pipeline-service.onrender.com/docs`

### TTS Service
- Health: `https://gurukul-tts-service.onrender.com/api/health`
- Root: `https://gurukul-tts-service.onrender.com/`

## 🔧 Files Created for Deployment

### Per Service:
- `render.yaml` - Render configuration
- `start_production.py` - Production startup script
- `.env.example` - Environment variables template
- `Procfile` - Alternative startup configuration
- `requirements.txt` - Python dependencies (where missing)

### Master Files:
- `render-all-services.yaml` - Deploy all services together
- `DEPLOYMENT_STRATEGY.md` - Detailed deployment strategy
- `RENDER_DEPLOYMENT_COMPLETE.md` - This complete guide

## 💰 Cost Breakdown

### Minimum Cost (Starter Plans)
- 4 Web Services: $28/month ($7 each)
- 1 Redis Service: $7/month
- **Total: $35/month**

### Free Tier Option
- Deploy 1 service on free tier (750 hours/month)
- Use external Redis service or disable Redis features
- **Total: $0/month** (with limitations)

## 🛠️ Troubleshooting

### Build Issues
- Check Python version compatibility
- Verify all dependencies in requirements.txt
- Monitor build logs for specific errors

### Runtime Issues
- Check environment variables are set correctly
- Verify API keys are valid and have sufficient quota
- Test database connections using health endpoints

### Service Communication
- Use HTTPS URLs for inter-service communication
- Check CORS settings if frontend can't connect
- Verify all services are running and healthy

## 📱 Frontend Integration

Update your frontend to use the deployed service URLs:

```javascript
// Replace localhost URLs with your Render URLs
const API_ENDPOINTS = {
  financial: "https://gurukul-financial-simulator.onrender.com",
  data: "https://gurukul-api-data-service.onrender.com", 
  pipeline: "https://gurukul-pipeline-service.onrender.com",
  tts: "https://gurukul-tts-service.onrender.com"
};
```

## 🎉 You're Ready!

Your Gurukul AI agents are now production-ready and can be deployed to Render. The deployment includes:

✅ **Production-ready configurations**
✅ **Health checks and monitoring**
✅ **Environment-based configuration**
✅ **Error handling and fallbacks**
✅ **Scalable architecture**
✅ **Cost-effective deployment options**

Choose your deployment method and follow the steps above to get your AI agents live on Render!
