# 🔄 Rollback System Setup Guide

This guide explains how to set up and configure the automatic rollback system for your deployments.

## 🎯 Overview

The rollback system provides:
- **Automatic failure detection** via health monitoring
- **Instant rollback** to last known good deployment
- **Comprehensive health checks** with 6 different tests
- **Team notifications** via GitHub issues
- **Manual rollback triggers** for emergency situations

## 📋 Prerequisites

### Required Files (Already Created):
- ✅ `.github/workflows/rollback-on-failure.yml` - Main rollback workflow
- ✅ `.github/workflows/deployment-monitor.yml` - Health monitoring
- ✅ `.github/workflows/ci-cd.yml` - Main CI/CD pipeline
- ✅ `rollback_demo.sh` - Demo script
- ✅ `scripts/create_bad_deployment.py` - Failure scenario generator

### Required GitHub Secrets:
```
RENDER_API_KEY          # Your Render API key
RENDER_SERVICE_ID       # Your Render service ID  
RENDER_SERVICE_URL      # Your service URL (optional)
GITHUB_TOKEN           # Automatically provided
```

## ⚙️ Setup Instructions

### 1. Configure GitHub Secrets

Go to your repository → Settings → Secrets and variables → Actions

#### Get Render API Key:
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click your profile → Account Settings
3. Go to API Keys → Create API Key
4. Copy and add as `RENDER_API_KEY`

#### Get Render Service ID:
1. Go to your service in Render Dashboard
2. Copy service ID from URL: `https://dashboard.render.com/web/srv-XXXXXXXXX`
3. Use the part after `srv-` as `RENDER_SERVICE_ID`

#### Set Service URL:
```
RENDER_SERVICE_URL=https://your-service-name.onrender.com
```

### 2. Enable GitHub Actions

1. Go to repository → Actions tab
2. Enable workflows if prompted
3. Verify all 3 workflows are present:
   - CI/CD Pipeline
   - Rollback on Failure
   - Deployment Health Monitor

### 3. Configure Health Monitoring

The health monitor runs every 5 minutes by default. To customize:

Edit `.github/workflows/deployment-monitor.yml`:
```yaml
on:
  schedule:
    # Change frequency (currently every 5 minutes)
    - cron: '*/5 * * * *'
```

### 4. Test the Setup

#### Option A: Run Demo Script
```bash
chmod +x rollback_demo.sh
./rollback_demo.sh
```

#### Option B: Manual Test
```bash
# Create a bad deployment
python scripts/create_bad_deployment.py import_error

# Commit and push
git add .
git commit -m "Test: Trigger rollback demo"
git push origin main

# Watch GitHub Actions for rollback
```

## 🔍 Health Check Configuration

### Current Health Checks:

1. **Basic Connectivity** (Critical)
   - Tests: `curl -f $SERVICE_URL`
   - Timeout: 30 seconds

2. **Health Endpoint** (Critical)
   - Tests: `curl -f $SERVICE_URL/health`
   - Expected: Contains "healthy", "ok", or "status"

3. **API Documentation** (Non-critical)
   - Tests: `curl -f $SERVICE_URL/docs`
   - Purpose: Verify API functionality

4. **Response Time** (Non-critical)
   - Tests: Response time < 10 seconds
   - Purpose: Performance monitoring

5. **HTTP Status** (Critical for 5xx)
   - Tests: Returns 200 status code
   - Critical: Only for server errors

6. **Service Uptime** (Non-critical)
   - Tests: Root endpoint returns content
   - Purpose: General availability

### Customize Health Checks:

Add custom checks to `.github/workflows/deployment-monitor.yml`:

```yaml
# Add after existing tests
- name: Custom Database Test
  run: |
    echo "🗄️ Testing database connectivity"
    if curl -f -s "$SERVICE_URL/api/db-health" | grep -q "connected"; then
      echo "✅ Database: PASS"
      ((PASSED_TESTS++))
    else
      echo "❌ Database: FAIL"
      ((CRITICAL_FAILURES++))
    fi

- name: Custom API Test
  run: |
    echo "🔌 Testing critical API endpoint"
    if curl -f -s "$SERVICE_URL/api/critical-endpoint" > /dev/null; then
      echo "✅ Critical API: PASS"
      ((PASSED_TESTS++))
    else
      echo "❌ Critical API: FAIL"
    fi
```

## 🔄 Rollback Configuration

### Rollback Triggers:

The rollback workflow triggers on:
1. **Failed CI/CD Pipeline** - Automatic
2. **Health Check Failure** - When critical tests fail
3. **Manual Trigger** - Emergency rollback
4. **Scheduled Monitor** - Continuous health monitoring

### Manual Rollback:

Trigger manual rollback via GitHub Actions:
1. Go to Actions → Rollback on Failure
2. Click "Run workflow"
3. Options:
   - **Rollback to specific commit**: Enter commit SHA
   - **Force rollback**: Override health checks

### Customize Rollback Behavior:

Edit `.github/workflows/rollback-on-failure.yml`:

```yaml
# Change rollback conditions
if: |
  needs.check-deployment-health.outputs.deployment_healthy == 'false' || 
  github.event.inputs.force_rollback == 'true' ||
  github.event.workflow_run.conclusion == 'failure'
```

## 📊 Monitoring and Alerts

### GitHub Issues:

The system automatically creates GitHub issues for:
- **DEGRADED** service status
- **UNHEALTHY** service status
- **Rollback completions**

### Customize Notifications:

Add Slack/Discord notifications to workflows:

```yaml
- name: Notify Slack
  if: steps.health-monitor.outputs.health_status == 'CRITICAL'
  run: |
    curl -X POST -H 'Content-type: application/json' \
      --data '{"text":"🚨 Service rollback triggered!"}' \
      ${{ secrets.SLACK_WEBHOOK_URL }}
```

## 🧪 Testing Different Failure Scenarios

### Available Scenarios:

```bash
# Import error (breaks build)
python scripts/create_bad_deployment.py import_error

# Syntax error (breaks compilation)
python scripts/create_bad_deployment.py syntax_error

# Runtime error (crashes on startup)
python scripts/create_bad_deployment.py runtime_error

# Dependency error (breaks installation)
python scripts/create_bad_deployment.py dependency_error

# Environment error (missing variables)
python scripts/create_bad_deployment.py env_error

# Restore original code
python scripts/create_bad_deployment.py restore
```

### Create Custom Scenarios:

Edit `scripts/create_bad_deployment.py` to add new failure types:

```python
def create_custom_error_scenario():
    """Your custom failure scenario"""
    # Add your custom failure logic here
    pass
```

## 📈 Performance Tuning

### Adjust Timeouts:

```yaml
# In health monitoring workflow
RESPONSE_TIME=$(timeout 30 curl -o /dev/null -s -w '%{time_total}' "$SERVICE_URL/health")
```

### Change Health Thresholds:

```yaml
# Modify health scoring logic
if [ $HEALTH_SCORE -ge 80 ]; then
  HEALTH_STATUS="HEALTHY"
elif [ $HEALTH_SCORE -ge 60 ]; then
  HEALTH_STATUS="DEGRADED"
else
  HEALTH_STATUS="UNHEALTHY"
fi
```

### Optimize Rollback Speed:

```yaml
# Reduce wait times for faster rollback
echo "⏳ Waiting 60 seconds for deployment to stabilize..."
sleep 60  # Reduce this for faster rollback
```

## 🔒 Security Considerations

### Protect Sensitive Data:
- Use GitHub Secrets for all API keys
- Never commit credentials to repository
- Use environment variables for configuration

### Access Control:
- Limit who can trigger manual rollbacks
- Use branch protection rules
- Require reviews for rollback workflow changes

## 🛠️ Troubleshooting

### Common Issues:

#### 1. Rollback Not Triggering
**Check:**
- GitHub Secrets are set correctly
- Workflows are enabled
- Health checks are failing as expected

#### 2. Health Checks Failing
**Check:**
- Service URL is correct
- Health endpoint exists and returns expected format
- Network connectivity from GitHub Actions

#### 3. Rollback Deployment Fails
**Check:**
- Render API key has correct permissions
- Service ID is correct
- Last known good commit exists

### Debug Steps:

1. **Check Workflow Logs**:
   - Go to Actions tab
   - Click on failed workflow
   - Expand failed steps

2. **Test Health Checks Manually**:
   ```bash
   curl -f https://your-service.onrender.com/health
   ```

3. **Verify Render Integration**:
   ```bash
   curl -H "Authorization: Bearer $RENDER_API_KEY" \
     "https://api.render.com/v1/services/$RENDER_SERVICE_ID"
   ```

## 🎯 Success Criteria

Your rollback system is working correctly when:
- ✅ Health monitoring runs every 5 minutes
- ✅ Bad deployments trigger automatic rollback
- ✅ Rollback completes within 5 minutes
- ✅ Service health is verified after rollback
- ✅ GitHub issues are created for failures
- ✅ Team is notified of rollback events

## 📚 Next Steps

1. **Run the demo** to see rollback in action
2. **Customize health checks** for your specific needs
3. **Set up team notifications** (Slack, Discord, email)
4. **Create runbooks** for manual intervention scenarios
5. **Monitor rollback metrics** and optimize as needed

---

**🎉 Your automatic rollback system is now ready to protect your deployments!**
