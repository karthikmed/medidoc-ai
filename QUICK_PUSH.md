# Quick Push to GitHub

## Step 1: Create Repository on GitHub

1. Go to: https://github.com/new
2. Repository name: `medidoc-ai`
3. Description: `Medical Documentation Assistant built with Next.js, PostgreSQL, and Prisma`
4. Choose **Public** or **Private**
5. **DO NOT** check any boxes (no README, .gitignore, or license)
6. Click **Create repository**

## Step 2: Run the Push Script

```bash
./push-to-github.sh
```

The script will:
- Initialize git (if needed)
- Add all files
- Create commit
- Ask for your repository URL
- Push to GitHub

## Or Manual Commands

If you prefer manual steps:

```bash
# 1. Initialize git
git init

# 2. Add all files
git add .

# 3. Create commit
git commit -m "Initial commit: Medidoc AI"

# 4. Add remote (replace with your repo URL)
git remote add origin https://github.com/karthikrkmed0180-glitch/medidoc-ai.git

# 5. Push
git branch -M main
git push -u origin main
```

## Your GitHub Info

- **Username:** `karthikrkmed0180-glitch`
- **Repository URL format:** `https://github.com/karthikrkmed0180-glitch/REPO_NAME.git`

## Authentication

If asked for credentials:
- **Username:** `karthikrkmed0180-glitch`
- **Password:** Use a Personal Access Token (not your GitHub password)
  - Create token: https://github.com/settings/tokens
  - Select scope: `repo`

---

**That's it! Your code will be on GitHub! 🎉**
