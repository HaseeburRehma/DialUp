#!/bin/bash
set -e

echo "🔍 VoiceAI Deployment Script"
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Security Check
echo -e "${YELLOW}Step 1: Security Scan${NC}"
echo "Checking for potential malware..."

if sudo find / -name "config.json" -path "*/.*unix*" 2>/dev/null | grep -q .; then
    echo -e "${RED}⚠️  WARNING: Suspicious files found!${NC}"
    sudo find / -name "config.json" -path "*/.*unix*" 2>/dev/null
    echo "Please investigate these files before proceeding."
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✓ No suspicious files found${NC}"
fi

# Check for crypto miners
if sudo ps aux | grep -iE "(xmrig|minerd|cpuminer)" | grep -v grep > /dev/null; then
    echo -e "${RED}⚠️  WARNING: Potential crypto miner detected!${NC}"
    sudo ps aux | grep -iE "(xmrig|minerd|cpuminer)" | grep -v grep
    exit 1
else
    echo -e "${GREEN}✓ No crypto miners detected${NC}"
fi

# Step 2: Create helper script
echo -e "\n${YELLOW}Step 2: Creating process monitor script${NC}"
cat > check_procs.sh << 'EOF'
#!/bin/bash
while read line; do
  echo "Process event: $line"
  HEADERS=$(echo "$line" | head -n1)
  PROCESS=$(echo "$HEADERS" | grep -oP 'processname:\K\w+')
  
  if [[ "$PROCESS" == "whisper_backend" ]] || [[ "$PROCESS" == "express_backend" ]]; then
    echo "Critical process $PROCESS exited! Restarting..."
    supervisorctl restart "$PROCESS"
  fi
  
  echo "RESULT 2"
  echo "OK"
done < /dev/stdin
EOF
chmod +x check_procs.sh
echo -e "${GREEN}✓ Process monitor created${NC}"

# Step 3: Backup current setup
echo -e "\n${YELLOW}Step 3: Creating backup${NC}"
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp docker-compose.yml "$BACKUP_DIR/" 2>/dev/null || true
cp Dockerfile "$BACKUP_DIR/" 2>/dev/null || true
cp supervisord.conf "$BACKUP_DIR/" 2>/dev/null || true
echo -e "${GREEN}✓ Backup created in $BACKUP_DIR${NC}"

# Step 4: Stop existing containers
echo -e "\n${YELLOW}Step 4: Stopping existing containers${NC}"
docker-compose down -v
echo -e "${GREEN}✓ Containers stopped${NC}"

# Step 5: Clean old images
echo -e "\n${YELLOW}Step 5: Cleaning old images${NC}"
docker images | grep voiceai | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true
echo -e "${GREEN}✓ Old images removed${NC}"

# Step 6: Build new image
echo -e "\n${YELLOW}Step 6: Building new image (this may take several minutes)${NC}"
docker-compose build --no-cache
echo -e "${GREEN}✓ Image built successfully${NC}"

# Step 7: Start services
echo -e "\n${YELLOW}Step 7: Starting services${NC}"
docker-compose up -d
echo -e "${GREEN}✓ Services started${NC}"

# Step 8: Wait for services to initialize
echo -e "\n${YELLOW}Step 8: Waiting for services to initialize (60s)${NC}"
for i in {60..1}; do
    echo -ne "\rWaiting... $i seconds remaining "
    sleep 1
done
echo -e "\n${GREEN}✓ Initialization period complete${NC}"

# Step 9: Health checks
echo -e "\n${YELLOW}Step 9: Running health checks${NC}"

# Check container status
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✓ Container is running${NC}"
else
    echo -e "${RED}✗ Container is not running${NC}"
    docker-compose logs --tail=50
    exit 1
fi

# Check supervisor processes
echo "Checking supervisor processes..."
docker-compose exec -T app supervisorctl status || true

# Check health endpoints
echo "Checking health endpoints..."
if curl -f http://localhost:3000/health 2>/dev/null; then
    echo -e "${GREEN}✓ Express backend healthy${NC}"
else
    echo -e "${RED}✗ Express backend not responding${NC}"
fi

if curl -f http://localhost:4001/healthz 2>/dev/null; then
    echo -e "${GREEN}✓ Whisper backend healthy${NC}"
else
    echo -e "${RED}✗ Whisper backend not responding${NC}"
fi

# Step 10: Display logs
echo -e "\n${YELLOW}Step 10: Recent logs${NC}"
echo "================================"
docker-compose logs --tail=30

# Final status
echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}✓ Deployment complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "🌐 Your application should be available at:"
echo "   - Main app: http://localhost:3000"
echo "   - Health check: http://localhost:3000/health"
echo "   - Whisper health: http://localhost:4001/healthz"
echo ""
echo "📊 Useful commands:"
echo "   - View logs: docker-compose logs -f"
echo "   - Check status: docker-compose ps"
echo "   - Check processes: docker-compose exec app supervisorctl status"
echo "   - Restart: docker-compose restart"
echo "   - Stop: docker-compose down"
echo ""
echo "🔍 If you see 502 errors:"
echo "   1. Check logs: docker-compose logs -f app"
echo "   2. Check nginx config: sudo nginx -t"
echo "   3. Restart nginx: sudo systemctl restart nginx"
echo ""