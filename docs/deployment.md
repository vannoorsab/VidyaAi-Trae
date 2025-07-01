# VidyAI Deployment Guide

## System Requirements

### Development Environment
- Node.js 18+
- Python 3.9+
- Docker Desktop
- Git
- 16GB RAM (minimum)
- CUDA-compatible GPU (recommended)

### Production Environment
- 4+ CPU cores
- 32GB RAM (recommended)
- 100GB SSD storage
- CUDA-compatible GPU with 8GB+ VRAM
- Ubuntu 22.04 LTS or Windows Server 2022

## Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/vidyai.git
cd vidyai
```

### 2. Environment Configuration

```bash
# Copy environment files
cp .env.example .env
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Configure the following services:
- Firebase project setup
- MongoDB Atlas cluster
- OpenAI API key
- ElevenLabs API key
- MinIO or S3 bucket

### 3. Run Setup Script

```bash
# Windows
.\scripts\setup.ps1

# Linux/macOS
./scripts/setup.sh
```

### 4. Start Development Servers

```bash
# Terminal 1: Frontend
cd client
npm run dev

# Terminal 2: Backend
cd server
npm run dev

# Terminal 3: AI Services
cd server/ai_services
python -m venv venv
source venv/bin/activate  # or .\venv\Scripts\Activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

## Production Deployment

### 1. Infrastructure Setup

#### Option A: Cloud Provider (Recommended)

**AWS Setup:**
```bash
# Install AWS CLI
aws configure

# Create ECS cluster
aws ecs create-cluster --cluster-name vidyai-cluster

# Create ECR repositories
aws ecr create-repository --repository-name vidyai-frontend
aws ecr create-repository --repository-name vidyai-backend
aws ecr create-repository --repository-name vidyai-ai-service
```

**Azure Setup:**
```bash
# Install Azure CLI
az login

# Create resource group
az group create --name vidyai --location eastus

# Create AKS cluster
az aks create --resource-group vidyai --name vidyai-cluster --node-count 3
```

#### Option B: Self-hosted

1. Configure firewall rules:
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 5000/tcp
```

2. Install Docker and Docker Compose:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. SSL Certificate Setup

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 3. Database Setup

#### MongoDB Setup

1. Create MongoDB Atlas cluster
2. Configure network access
3. Create database user
4. Update connection string in environment variables

#### Redis Setup

```bash
# Install Redis
sudo apt-get install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf

# Set password
requirepass your_strong_password

# Restart Redis
sudo systemctl restart redis
```

### 4. Production Build and Deployment

```bash
# Run deployment script
./scripts/deploy.ps1  # Windows
./scripts/deploy.sh   # Linux/macOS
```

### 5. Monitoring Setup

1. Access Prometheus:
```
http://your-domain:9090
```

2. Access Grafana:
```
http://your-domain:3001
Default credentials: admin/admin
```

3. Import dashboards:
- Node.js Application Dashboard
- Python Application Dashboard
- MongoDB Dashboard
- Redis Dashboard
- Nginx Dashboard

### 6. Backup Configuration

#### Database Backup

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/var/backups/vidyai

# MongoDB backup
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/mongodb_$TIMESTAMP"

# Redis backup
redis-cli -a "$REDIS_PASSWORD" save
cp /var/lib/redis/dump.rdb "$BACKUP_DIR/redis_$TIMESTAMP.rdb"

# Upload to S3
aws s3 sync $BACKUP_DIR s3://your-backup-bucket/
EOF

# Make script executable
chmod +x backup.sh

# Add to crontab
echo "0 0 * * * /path/to/backup.sh" | crontab -
```

### 7. Security Considerations

1. Enable firewall rules
2. Configure rate limiting
3. Set up DDoS protection
4. Enable security headers
5. Implement regular security updates
6. Monitor security logs

### 8. Performance Optimization

1. Enable Nginx caching:
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=10g inactive=60m use_temp_path=off;
```

2. Configure PM2 for Node.js:
```bash
pm2 start server/index.js -i max
```

3. Enable Redis caching:
```javascript
const CACHE_TTL = 3600; // 1 hour
const redisClient = redis.createClient();
```

### 9. Maintenance

#### Regular Tasks

1. Log rotation:
```bash
sudo nano /etc/logrotate.d/vidyai

/var/log/vidyai/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        systemctl reload nginx
    endscript
}
```

2. Update script:
```bash
./scripts/update.sh
```

#### Monitoring Alerts

Configure alert rules in Grafana:
1. High CPU/Memory usage
2. Error rate spikes
3. API latency increases
4. Disk space warnings
5. SSL certificate expiration

## Troubleshooting

### Common Issues

1. Connection Issues:
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f service_name
```

2. Performance Issues:
```bash
# Check resource usage
docker stats

# Monitor logs
tail -f /var/log/vidyai/*.log
```

3. Database Issues:
```bash
# Check MongoDB connection
mongosh "$MONGODB_URI" --eval "db.adminCommand('ping')"

# Check Redis connection
redis-cli -a "$REDIS_PASSWORD" ping
```

### Support

For additional support:
1. Check the [GitHub Issues](https://github.com/yourusername/vidyai/issues)
2. Join our [Discord Community](https://discord.gg/vidyai)
3. Contact support at support@vidyai.com