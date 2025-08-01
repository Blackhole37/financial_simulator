# Gurukul AI Agents - Render Deployment Strategy

## 🎯 Overview

This document outlines the deployment strategy for all Gurukul AI backend services on Render. You can deploy services individually or all together using the provided configurations.

## 🏗️ Services Architecture

### 1. Financial Simulator (Port 8002)
- **Purpose**: Financial planning and simulation with LangGraph
- **Dependencies**: MongoDB Atlas, Redis, OpenAI API, Groq API
- **Features**: Financial advice, PDF processing, chat history

### 2. API Data Service (Port 8001)
- **Purpose**: RAG (Retrieval Augmented Generation) and OCR functionality
- **Dependencies**: MongoDB Atlas, HuggingFace API
- **Features**: Document processing, image OCR, subject/lecture data

### 3. Pipeline Service (Port 8000)
- **Purpose**: Lesson generation with AI and TTS integration
- **Dependencies**: OpenAI API, HuggingFace API
- **Features**: Lesson creation, TTS generation, knowledge base

### 4. TTS Service (Port 8003)
- **Purpose**: Text-to-speech audio generation
- **Dependencies**: None (uses pyttsx3)
- **Features**: Audio file generation, voice synthesis

## 🚀 Deployment Options

### Option 1: Deploy All Services Together (Recommended)

Use the master configuration file to deploy all services at once:

1. **Use the master render.yaml**:
   ```
   render-all-services.yaml
   ```

2. **Set up in Render**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Select `render-all-services.yaml`

3. **Configure Environment Variables** (see section below)

### Option 2: Deploy Services Individually

Each service has its own deployment configuration:

- **Financial Simulator**: `Backend/Financial_simulator/render.yaml`
- **API Data Service**: `Backend/api_data/render.yaml`
- **Pipeline Service**: `Backend/pipline-24-master/render.yaml`
- **TTS Service**: `Backend/tts_service/render.yaml`

## 🔧 Environment Variables Setup

### Required for All Deployments

#### MongoDB Atlas (Required for Financial Simulator & API Data Service)
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority
```

#### OpenAI API Key (Required for Financial Simulator & Pipeline Service)
```
OPENAI_API_KEY=your_openai_api_key_here
```

### Service-Specific Variables

#### Financial Simulator
```
GROQ_API_KEY=your_groq_api_key_here
AGENTOPS_API_KEY=your_agentops_api_key_here (optional)
```

#### API Data Service & Pipeline Service
```
HUGGINGFACE_API_TOKEN=your_huggingface_token_here
```

## 📋 Pre-Deployment Checklist

### 1. External Services Setup
- [ ] MongoDB Atlas cluster created
- [ ] MongoDB Atlas connection string obtained
- [ ] MongoDB Atlas IP whitelist configured (0.0.0.0/0 for development)

### 2. API Keys Ready
- [ ] OpenAI API key
- [ ] Groq API key (for Financial Simulator)
- [ ] HuggingFace API token (for AI models)
- [ ] AgentOps API key (optional)

### 3. Repository Preparation
- [ ] All code pushed to GitHub
- [ ] All deployment files included in repository
- [ ] Requirements.txt files updated

## 🌐 Service URLs After Deployment

After deployment, your services will be available at:

- **Financial Simulator**: `https://gurukul-financial-simulator.onrender.com`
- **API Data Service**: `https://gurukul-api-data-service.onrender.com`
- **Pipeline Service**: `https://gurukul-pipeline-service.onrender.com`
- **TTS Service**: `https://gurukul-tts-service.onrender.com`

## 🔗 Service Communication

Services can communicate with each other using their Render URLs:

```javascript
// Example: Frontend calling different services
const FINANCIAL_API = "https://gurukul-financial-simulator.onrender.com";
const DATA_API = "https://gurukul-api-data-service.onrender.com";
const PIPELINE_API = "https://gurukul-pipeline-service.onrender.com";
const TTS_API = "https://gurukul-tts-service.onrender.com";
```

## 💰 Cost Estimation

### Free Tier Limitations
- **Web Services**: 750 hours/month (enough for 1 service)
- **Redis**: Not available on free tier

### Paid Plans (Starter - $7/month each)
- **4 Web Services**: $28/month
- **1 Redis Service**: $7/month
- **Total**: ~$35/month

### Cost Optimization
- Start with 1-2 critical services
- Scale up as needed
- Use MongoDB Atlas free tier
- Consider combining services if possible

## 🔍 Health Checks & Monitoring

Each service includes health check endpoints:

- **Financial Simulator**: `/health`
- **API Data Service**: `/health`
- **Pipeline Service**: `/` (root endpoint)
- **TTS Service**: `/api/health`

## 🛠️ Troubleshooting

### Common Issues

1. **Build Failures**
   - Check requirements.txt compatibility
   - Verify Python version requirements
   - Monitor build logs in Render dashboard

2. **Database Connection Issues**
   - Verify MongoDB Atlas connection string
   - Check IP whitelist settings
   - Ensure database user permissions

3. **API Key Issues**
   - Verify all required API keys are set
   - Check API key validity and quotas
   - Ensure keys are marked as "secret" in Render

4. **Service Communication Issues**
   - Use HTTPS URLs for service-to-service communication
   - Check CORS settings
   - Verify service health endpoints

## 📚 Additional Resources

- [Render Documentation](https://docs.render.com)
- [MongoDB Atlas Setup Guide](https://docs.atlas.mongodb.com)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [HuggingFace API Documentation](https://huggingface.co/docs/api-inference)

---

**Ready to deploy?** Choose your deployment option and follow the detailed steps above!
