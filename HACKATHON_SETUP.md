# Hackathon Setup - Shared Database

## For SERVER (One Person - Runs Database)

### Step 1: Start Database
```bash
docker-compose up -d
```

### Step 2: Find Your IP Address
```bash
# macOS/Linux:
ifconfig | grep "inet " | grep -v 127.0.0.1

# Or:
ipconfig getifaddr en0
```

**Copy your IP address** (e.g., `192.168.1.100`)

### Step 3: Create .env File
```bash
cp env.template .env
```

The `.env` file should have:
```
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/medidoc_ai?schema=public"
```

### Step 4: Setup Database
```bash
npm run db:generate
npm run db:push
```

### Step 5: Start Server
```bash
npm run dev
```

**Share your IP address with the team!**

---

## For CLIENTS (Everyone Else)

### Step 1: Get Server IP
Ask the server person for their IP address (e.g., `192.168.1.100`)

### Step 2: Create .env File
```bash
cp env.template .env
```

### Step 3: Edit .env
Replace `localhost` with server's IP:
```
DATABASE_URL="postgresql://postgres:postgres123@192.168.1.100:5432/medidoc_ai?schema=public"
```
(Replace `192.168.1.100` with actual server IP)

### Step 4: Install & Start
```bash
npm install
npm run db:generate
npm run dev
```

### Step 5: Access App
Open: `http://SERVER_IP:3000` (e.g., `http://192.168.1.100:3000`)

---

## Quick Commands

**Server:**
```bash
docker-compose up -d
cp env.template .env
# .env already has localhost
npm run db:generate && npm run db:push
npm run dev
```

**Clients:**
```bash
cp env.template .env
# Edit .env: replace localhost with server IP
npm install
npm run db:generate
npm run dev
# Access: http://SERVER_IP:3000
```

---

## Troubleshooting

**Can't connect to database?**
- Check firewall allows port 5432
- Verify server IP is correct
- Make sure server is on same Wi-Fi

**Database not accessible?**
- Server: Check `docker ps` shows container running
- Server: Check `docker logs medidoc-postgres`
