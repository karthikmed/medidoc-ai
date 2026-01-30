# 📚 Medidoc AI - Technical Documentation

Complete technical documentation for database, Docker, and infrastructure setup.

---

## 🗄️ Database Configuration

### Database Details

| Property | Value | Description |
|----------|-------|-------------|
| **Database Type** | PostgreSQL | Open-source relational database |
| **Database Name** | `medidoc_ai` | Main database for the application |
| **Database User** | `medidoc` | Database user with full privileges |
| **Database Password** | `medidoc123` | Password for database user |
| **Host** | `localhost` | Database host (local machine) |
| **Port** | `5432` (or `5433` if conflict) | PostgreSQL default port |
| **Schema** | `public` | Default PostgreSQL schema |
| **Version** | PostgreSQL 16 | Latest stable version |

### Connection String Format

```
postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?schema=[SCHEMA]
```

**Example:**
```
postgresql://medidoc:medidoc123@localhost:5432/medidoc_ai?schema=public
```

### Environment Variable

The connection string is stored in `.env` file:

```env
DATABASE_URL="postgresql://medidoc:medidoc123@localhost:5432/medidoc_ai?schema=public"
```

**Location:** Root directory of the project (`.env` file)

---

## 🐳 Docker Configuration

### Container Details

| Property | Value | Description |
|----------|-------|-------------|
| **Container Name** | `medidoc-postgres` | Docker container identifier |
| **Image** | `postgres:16` | Official PostgreSQL 16 Docker image |
| **Port Mapping** | `5432:5432` or `5433:5432` | Host:Container port mapping |
| **Volume** | `postgres_data` | Persistent data storage |
| **Network** | Default bridge network | Docker network configuration |

### Docker Compose Configuration

**File:** `docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    container_name: medidoc-postgres
    environment:
      POSTGRES_USER: medidoc
      POSTGRES_PASSWORD: medidoc123
      POSTGRES_DB: medidoc_ai
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U medidoc"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

### Docker Commands Reference

#### Start Database
```bash
# Using Docker Compose (recommended)
docker-compose up -d

# OR using Docker run
docker run --name medidoc-postgres \
  -e POSTGRES_PASSWORD=medidoc123 \
  -e POSTGRES_USER=medidoc \
  -e POSTGRES_DB=medidoc_ai \
  -e POSTGRES_HOST_AUTH_METHOD=trust \
  -p 5432:5432 \
  -d postgres:16
```

#### Stop Database
```bash
docker stop medidoc-postgres
# OR
docker-compose down
```

#### Start Database (after stopping)
```bash
docker start medidoc-postgres
# OR
docker-compose up -d
```

#### View Logs
```bash
docker logs medidoc-postgres
# OR
docker-compose logs postgres
```

#### Access Database Shell
```bash
docker exec -it medidoc-postgres psql -U medidoc -d medidoc_ai
```

#### Remove Container (⚠️ Deletes data)
```bash
docker rm -f medidoc-postgres
docker volume rm medidoc_postgres_data
```

---

## 📊 Database Schema

### Current Schema

**File:** `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
```

### Schema Details

- **Generator:** Prisma Client (JavaScript/TypeScript)
- **Provider:** PostgreSQL
- **Models:** Currently 1 model (`User`)
- **Table Mapping:** `User` model maps to `users` table

### Database Permissions

The `medidoc` user has:
- ✅ Full privileges on `medidoc_ai` database
- ✅ Full privileges on `public` schema
- ✅ All privileges on tables and sequences
- ✅ Default privileges for future objects

---

## 🔧 Prisma Configuration

### Prisma Commands

```bash
# Generate Prisma Client (after schema changes)
npm run db:generate

# Push schema changes to database (development)
npm run db:push

# Create migration (production)
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio
```

### Prisma Client Usage

**File:** `lib/prisma.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

**Usage in code:**
```typescript
import { prisma } from '@/lib/prisma';

// Example: Get all users
const users = await prisma.user.findMany();
```

---

## 🚀 Setup Instructions for New Developers

### Prerequisites

1. **Node.js** 18+ installed
2. **Docker Desktop** installed and running
3. **Git** installed

### Step-by-Step Setup

#### 1. Clone Repository
```bash
git clone <repository-url>
cd CDI
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Start Docker Database
```bash
# Option A: Using Docker Compose (recommended)
docker-compose up -d

# Option B: Using Docker run
docker run --name medidoc-postgres \
  -e POSTGRES_PASSWORD=medidoc123 \
  -e POSTGRES_USER=medidoc \
  -e POSTGRES_DB=medidoc_ai \
  -e POSTGRES_HOST_AUTH_METHOD=trust \
  -p 5432:5432 \
  -d postgres:16
```

#### 4. Wait for Database to Start
```bash
# Check if database is ready
docker exec medidoc-postgres pg_isready -U medidoc

# Or wait 5-10 seconds
sleep 5
```

#### 5. Grant Database Permissions
```bash
docker exec -i medidoc-postgres psql -U medidoc -d medidoc_ai << EOF
GRANT ALL PRIVILEGES ON DATABASE medidoc_ai TO medidoc;
GRANT ALL PRIVILEGES ON SCHEMA public TO medidoc;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO medidoc;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO medidoc;
EOF
```

#### 6. Create .env File
```bash
echo 'DATABASE_URL="postgresql://medidoc:medidoc123@localhost:5432/medidoc_ai?schema=public"' > .env
```

#### 7. Generate Prisma Client
```bash
npm run db:generate
```

#### 8. Push Schema to Database
```bash
npm run db:push
```

#### 9. Start Development Server
```bash
npm run dev
```

#### 10. Verify Setup
- Open http://localhost:3000
- Should see "Medidoc AI" on white screen
- Database is ready to use

---

## 🔍 Verification & Testing

### Verify Database Connection

```bash
# Check if container is running
docker ps | grep medidoc-postgres

# Test database connection
docker exec medidoc-postgres pg_isready -U medidoc

# Connect to database
docker exec -it medidoc-postgres psql -U medidoc -d medidoc_ai
```

### Verify Prisma Connection

```bash
# Generate client (should work without errors)
npm run db:generate

# Push schema (should create tables)
npm run db:push

# Open Prisma Studio (should show database)
npm run db:studio
```

---

## 🛠️ Troubleshooting

### Port 5432 Already in Use

**Problem:** Another service is using port 5432

**Solution 1:** Use different port
```bash
# Update docker-compose.yml to use port 5433
ports:
  - "5433:5432"

# Update .env
DATABASE_URL="postgresql://medidoc:medidoc123@localhost:5433/medidoc_ai?schema=public"
```

**Solution 2:** Stop conflicting service
```bash
# Find what's using port 5432
lsof -i :5432

# Stop it (replace PID with actual process ID)
kill <PID>
```

### Permission Denied Error

**Problem:** `P1010: User medidoc was denied access`

**Solution:** Grant permissions
```bash
docker exec -i medidoc-postgres psql -U medidoc -d medidoc_ai << EOF
GRANT ALL PRIVILEGES ON DATABASE medidoc_ai TO medidoc;
GRANT ALL PRIVILEGES ON SCHEMA public TO medidoc;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO medidoc;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO medidoc;
EOF
```

### Container Won't Start

**Problem:** Container exits immediately

**Solution:** Check logs
```bash
docker logs medidoc-postgres
```

Common issues:
- Port already in use
- Volume permission issues
- Insufficient memory

### Database Connection Timeout

**Problem:** Can't connect to database

**Solution:**
1. Verify Docker is running: `docker ps`
2. Verify container is running: `docker ps | grep medidoc-postgres`
3. Check port mapping: `docker port medidoc-postgres`
4. Verify .env file has correct DATABASE_URL

---

## 📁 File Structure

```
CDI/
├── .env                          # Environment variables (DATABASE_URL)
├── docker-compose.yml            # Docker Compose configuration
├── prisma/
│   └── schema.prisma            # Database schema definition
├── lib/
│   └── prisma.ts                # Prisma Client singleton
├── app/                         # Next.js application
└── package.json                 # Dependencies and scripts
```

---

## 🔐 Security Notes

### Development Environment
- Default password: `medidoc123` (change for production)
- Database accessible only on localhost
- No external access by default

### Production Considerations
- Change default password
- Use environment variables for sensitive data
- Enable SSL/TLS for database connections
- Use strong passwords
- Restrict database access
- Regular backups

---

## 📊 Database Statistics

### Current State
- **Tables:** 1 (`users`)
- **Models:** 1 (`User`)
- **Relations:** 0 (can be added as needed)

### Growth Plan
- Add more models as features are developed
- Use Prisma migrations for schema changes
- Maintain database documentation

---

## 🔄 Maintenance

### Regular Tasks

1. **Backup Database**
```bash
docker exec medidoc-postgres pg_dump -U medidoc medidoc_ai > backup.sql
```

2. **Restore Database**
```bash
docker exec -i medidoc-postgres psql -U medidoc medidoc_ai < backup.sql
```

3. **View Database Size**
```bash
docker exec medidoc-postgres psql -U medidoc -d medidoc_ai -c "SELECT pg_size_pretty(pg_database_size('medidoc_ai'));"
```

4. **Clean Up**
```bash
# Remove unused containers
docker container prune

# Remove unused volumes (⚠️ careful!)
docker volume prune
```

---

## 📞 Support & Resources

### Documentation
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)

### Quick Reference
- Database Name: `medidoc_ai`
- Database User: `medidoc`
- Database Password: `medidoc123`
- Container Name: `medidoc-postgres`
- Default Port: `5432`

---

## ✅ Checklist for New Setup

- [ ] Docker Desktop installed and running
- [ ] Dependencies installed (`npm install`)
- [ ] Database container started (`docker-compose up -d`)
- [ ] Database permissions granted
- [ ] `.env` file created with DATABASE_URL
- [ ] Prisma Client generated (`npm run db:generate`)
- [ ] Schema pushed to database (`npm run db:push`)
- [ ] Development server running (`npm run dev`)
- [ ] Application accessible at http://localhost:3000

---

**Last Updated:** $(date)
**Version:** 1.0.0
**Maintained By:** Development Team
