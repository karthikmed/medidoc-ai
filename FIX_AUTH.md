# Fix Authentication Error

The error shows you're authenticated as `karthikmed` but trying to push to `karthikrkmed0180-glitch` account.

## Solution: Use Personal Access Token

### Step 1: Create Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click: **"Generate new token"** → **"Generate new token (classic)"**
3. Name: `medidoc-ai-push`
4. Expiration: Choose your preference (90 days, 1 year, etc.)
5. Select scope: Check **`repo`** (this gives full repository access)
6. Click: **"Generate token"**
7. **COPY THE TOKEN** (you won't see it again!)

### Step 2: Update Remote URL with Token

Replace `YOUR_TOKEN` with the token you just copied:

```bash
git remote set-url origin https://YOUR_TOKEN@github.com/karthikrkmed0180-glitch/medidoc-ai.git
```

Or use your username:

```bash
git remote set-url origin https://karthikrkmed0180-glitch:YOUR_TOKEN@github.com/karthikrkmed0180-glitch/medidoc-ai.git
```

### Step 3: Push

```bash
git push -u origin main
```

When asked for password, just press Enter (the token is in the URL).

---

## Alternative: Use SSH (Recommended for Long-term)

### Step 1: Generate SSH Key (if you don't have one)

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

Press Enter to accept defaults.

### Step 2: Add SSH Key to GitHub

1. Copy your public key:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```

2. Go to: https://github.com/settings/keys
3. Click: **"New SSH key"**
4. Title: `My Laptop`
5. Paste the key
6. Click: **"Add SSH key"**

### Step 3: Update Remote to Use SSH

```bash
git remote set-url origin git@github.com:karthikrkmed0180-glitch/medidoc-ai.git
```

### Step 4: Push

```bash
git push -u origin main
```

---

## Quick Fix (Easiest)

Use GitHub CLI if installed:

```bash
gh auth login
git push -u origin main
```
