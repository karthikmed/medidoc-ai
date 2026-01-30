# 📊 Database Configuration Summary

Quick reference for database and Docker setup.

---

## 🗄️ Database Information

### Connection Details

```
Database Name:    medidoc_ai
Database User:    medidoc
Database Password: medidoc123
Host:            localhost
Port:            5432
Schema:          public
```

### Connection String

```
postgresql://medidoc:medidoc123@localhost:5432/medidoc_ai?schema=public
```

### Environment Variable

**File:** `.env`

```env
DATABASE_URL="postgresql://medidoc:medidoc123@localhost:5432/medidoc_ai?schema=public"
```

---

## 🐳 Docker Information

### Container Details

```
Container Name:  medidoc-postgres
Image:           postgres:16
Port Mapping:    5432:5432
Volume:          postgres_data
```

### Docker Commands

```bash
# Start database
docker-compose up -d

# Stop database
docker stop medidoc-postgres

# Start database (after stopping)
docker start medidoc-postgres

# View logs
docker logs medidoc-postgres

# Access database shell
docker exec -it medidoc-postgres psql -U medidoc -d medidoc_ai
```

---

## 📋 Quick Setup (One Command)

```bash
./setup.sh
```

This will:
1. ✅ Check prerequisites
2. ✅ Install dependencies
3. ✅ Start database
4. ✅ Grant permissions
5. ✅ Create .env file
6. ✅ Generate Prisma Client
7. ✅ Push schema to database

---

## 🔍 Verification

### Check Database is Running
```bash
docker ps | grep medidoc-postgres
```

### Test Connection
```bash
docker exec medidoc-postgres pg_isready -U medidoc
```

### View Database in Browser
```bash
npm run db:studio
```

---

## 📚 Full Documentation

For complete technical documentation, see:
- **[TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md)** - Complete technical details
- **[README.md](./README.md)** - Project overview and setup

---

**Last Updated:** $(date)
