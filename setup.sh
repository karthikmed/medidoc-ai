#!/bin/bash

# Medidoc AI - Complete Setup Script
# This script sets up the entire development environment from scratch
# Works on macOS, Linux, and Windows (with WSL)

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Medidoc AI - Complete Setup${NC}"
echo "=================================="
echo ""

# Step 1: Check prerequisites
echo -e "${YELLOW}Step 1: Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "   Please install Node.js 18+ from: https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js $NODE_VERSION${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm --version)${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "   Please install Docker Desktop from: https://www.docker.com/products/docker-desktop"
    exit 1
fi
DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
echo -e "${GREEN}✅ Docker $DOCKER_VERSION${NC}"

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running${NC}"
    echo "   Please start Docker Desktop and try again"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"

# Check docker-compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${YELLOW}⚠️  docker-compose not found, but Docker Compose v2 should work${NC}"
fi

echo ""

# Step 2: Install dependencies
echo -e "${YELLOW}Step 2: Installing dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo "   Installing npm packages..."
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

echo ""

# Step 3: Clean up existing containers
echo -e "${YELLOW}Step 3: Cleaning up existing containers...${NC}"
if docker ps -a --format '{{.Names}}' | grep -q "^medidoc-postgres$"; then
    echo "   Stopping existing container..."
    docker stop medidoc-postgres 2>/dev/null || true
    docker rm medidoc-postgres 2>/dev/null || true
    echo -e "${GREEN}✅ Old container removed${NC}"
else
    echo -e "${GREEN}✅ No existing container found${NC}"
fi

# Remove volume if it exists (optional - comment out if you want to keep data)
if docker volume ls --format '{{.Name}}' | grep -q "^cdi_postgres_data$"; then
    echo "   Removing old volume for fresh start..."
    docker volume rm cdi_postgres_data 2>/dev/null || true
    echo -e "${GREEN}✅ Old volume removed${NC}"
fi

echo ""

# Step 4: Start database
echo -e "${YELLOW}Step 4: Starting PostgreSQL database...${NC}"

# Use docker compose (v2) or docker-compose (v1)
if docker compose version &> /dev/null; then
    docker compose up -d
else
    docker-compose up -d
fi

echo -e "${GREEN}✅ Container started${NC}"

echo ""

# Step 5: Wait for database
echo -e "${YELLOW}Step 5: Waiting for database to be ready...${NC}"
sleep 5

MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker exec medidoc-postgres pg_isready -U postgres &> /dev/null; then
        echo -e "${GREEN}✅ Database is ready${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo -e "${RED}❌ Database failed to start after $MAX_RETRIES attempts${NC}"
        echo "   Check logs with: docker logs medidoc-postgres"
        exit 1
    fi
    echo "   Waiting... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

echo ""

# Step 6: Create .env file
echo -e "${YELLOW}Step 6: Creating .env file...${NC}"
ENV_FILE=".env"
ENV_TEMPLATE="env.template"

if [ ! -f "$ENV_FILE" ]; then
    if [ -f "$ENV_TEMPLATE" ]; then
        cp "$ENV_TEMPLATE" "$ENV_FILE"
        echo -e "${GREEN}✅ Created .env from template${NC}"
        echo -e "${YELLOW}   Note: For clients, edit .env and replace localhost with server IP${NC}"
    else
        echo "DATABASE_URL=\"postgresql://postgres:postgres123@localhost:5432/medidoc_ai?schema=public\"" > "$ENV_FILE"
        echo -e "${GREEN}✅ Created .env file${NC}"
    fi
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

echo ""

# Step 7: Generate Prisma Client
echo -e "${YELLOW}Step 7: Generating Prisma Client...${NC}"
if npm run db:generate > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Prisma Client generated${NC}"
else
    echo -e "${RED}❌ Failed to generate Prisma Client${NC}"
    exit 1
fi

echo ""

# Step 8: Push schema to database
echo -e "${YELLOW}Step 8: Pushing schema to database...${NC}"
if npm run db:push > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Schema pushed successfully${NC}"
else
    echo -e "${RED}❌ Failed to push schema${NC}"
    echo "   Try running manually: npm run db:push"
    exit 1
fi

echo ""
echo "=================================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "Database Information:"
echo "  - Database: medidoc_ai"
echo "  - User: postgres"
echo "  - Password: postgres123"
echo "  - Host: localhost"
echo "  - Port: 5432"
echo ""
echo "Next Steps:"
echo "  1. Run: ${YELLOW}npm run dev${NC}"
echo "  2. Open: ${YELLOW}http://localhost:3000${NC}"
echo ""
echo "Useful Commands:"
echo "  - Start database: ${YELLOW}docker compose up -d${NC}"
echo "  - Stop database: ${YELLOW}docker stop medidoc-postgres${NC}"
echo "  - View database: ${YELLOW}npm run db:studio${NC}"
echo ""
