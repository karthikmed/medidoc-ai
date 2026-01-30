# Medidoc AI

Medical Documentation Assistant built with Next.js, PostgreSQL, and Prisma.

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **PostgreSQL** - Database
- **Prisma** - ORM for database management
- **Tailwind CSS** - Styling

## Quick Start

### Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop)

### One-Command Setup

```bash
./setup.sh
```

That's it! The script will:
- ✅ Check prerequisites
- ✅ Install dependencies
- ✅ Start PostgreSQL database
- ✅ Create database schema
- ✅ Set up environment variables

### Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:studio` - Open Prisma Studio (database GUI)

## Database Information

- **Database Name:** `medidoc_ai`
- **Database User:** `postgres`
- **Database Password:** `postgres123`
- **Host:** `localhost`
- **Port:** `5432`
- **Container:** `medidoc-postgres`

## Project Structure

```
.
├── app/              # Next.js App Router
│   ├── layout.tsx    # Root layout
│   ├── page.tsx      # Home page
│   └── globals.css   # Global styles
├── lib/              # Utility functions
│   └── prisma.ts     # Prisma Client singleton
├── prisma/           # Prisma schema and migrations
│   └── schema.prisma # Database schema
├── docker-compose.yml # Docker configuration
├── setup.sh          # One-command setup script
├── .cursorrules      # Cursor IDE coding rules
└── CODING_STANDARDS.md # Coding standards documentation
```

## Docker Commands

```bash
# Start database
docker compose up -d

# Stop database
docker stop medidoc-postgres

# Start database (after stopping)
docker start medidoc-postgres

# View database logs
docker logs medidoc-postgres

# Access database shell
docker exec -it medidoc-postgres psql -U postgres -d medidoc_ai
```

## Troubleshooting

### Database won't start
- Make sure Docker Desktop is running
- Check if port 5432 is available: `lsof -i :5432`
- View logs: `docker logs medidoc-postgres`

### Permission errors
- Run `./setup.sh` again to recreate the database
- Make sure Docker has proper permissions

### Port already in use
- Stop other PostgreSQL instances
- Or modify `docker-compose.yml` to use a different port

## Coding Standards

This project follows comprehensive coding standards defined in:
- `.cursorrules` - IDE enforcement rules
- `CODING_STANDARDS.md` - Detailed documentation

## Documentation

- **[TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md)** - Complete technical details
- **[DATABASE_SUMMARY.md](./DATABASE_SUMMARY.md)** - Quick database reference

## License

MIT
