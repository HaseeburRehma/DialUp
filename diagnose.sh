#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     VoiceAI Diagnostic Tool           ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""

# 1. Container Status
echo -e "${YELLOW}📦 Container Status${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker-compose ps
echo ""

# 2. Supervisor Status
echo -e "${YELLOW}⚙️  Supervisor Processes${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker-compose exec -T app supervisorctl status 2>/dev/null || echo -e "${RED}Cannot connect to supervisor${NC}"
echo ""

# 3. Health Checks
echo -e "${YELLOW}🏥 Health Checks${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Express
if curl -f -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Express Backend (3000)${NC}"
    curl -s http://localhost:3000/health | jq '.' 2>/dev/null || curl -s http://localhost:3000/health
else
    echo -e "${RED}✗ Express Backend (3000) - NOT RESPONDING${NC}"
fi

# Whisper
if curl -f -s http://localhost:4001/healthz > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Whisper Backend (4001)${NC}"
else
    echo -e "${RED}✗ Whisper Backend (4001) - NOT RESPONDING${NC}"
fi
echo ""

# 4. Port Listening
echo -e "${YELLOW}🔌 Port Status${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
netstat -tlnp 2>/dev/null | grep -E ":(3000|4001|4000)" || ss -tlnp | grep -E ":(3000|4001|4000)"
echo ""

# 5. Memory Usage
echo -e "${YELLOW}💾 Memory Usage${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
echo ""

# 6. Recent Errors
echo -e "${YELLOW}❌ Recent Errors (last 20 lines)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker-compose logs --tail=20 2>&1 | grep -iE "(error|failed|exception|502|500)" || echo "No recent errors found"
echo ""

# 7. Nginx Status
echo -e "${YELLOW}🌐 Nginx Status${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if command -v nginx &> /dev/null; then
    sudo nginx -t 2>&1 | head -5
    echo ""
    sudo systemctl status nginx --no-pager -l | head -10
else
    echo "Nginx not installed or not in PATH"
fi
echo ""

# 8. Disk Space
echo -e "${YELLOW}💿 Disk Space${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
df -h / /tmp | grep -v tmpfs
echo ""

# 9. Docker Images
echo -e "${YELLOW}🖼️  Docker Images${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker images | grep -E "(REPOSITORY|voiceai)"
echo ""

# 10. Recent Logs
echo -e "${YELLOW}📋 Last 30 Log Lines${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker-compose logs --tail=30
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Diagnostic Complete           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo "💡 Next steps:"
echo "   - If services are down: docker-compose restart"
echo "   - View live logs: docker-compose logs -f"
echo "   - Rebuild: ./deploy.sh"
echo ""