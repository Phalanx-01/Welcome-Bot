# Deploy Your Discord Bot to Railway

Follow these simple steps to deploy your Discord welcome bot to Railway.app (where voice features WILL work!):

## Step 1: Create Railway Account

1. Go to https://railway.app/
2. Click **"Start a New Project"**
3. Sign up with GitHub (recommended) or email

## Step 2: Deploy from GitHub (Recommended)

### A. Push your code to GitHub first:
```bash
# In this Replit project, run these commands in the Shell:
git init
git add .
git commit -m "Discord welcome bot"
git branch -M main
```

Then:
1. Create a new repository on GitHub.com
2. Copy the commands GitHub gives you to push
3. Run them in the Replit Shell

### B. Deploy on Railway:
1. In Railway, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository
4. Railway will automatically detect it's a Node.js app

## Step 3: Add Your Discord Bot Token

1. In your Railway project, go to the **Variables** tab
2. Click **"New Variable"**
3. Add: `DISCORD_BOT_TOKEN` with your bot token value
4. Click **"Add"**

## Step 4: Deploy!

Railway will automatically:
- Install dependencies
- Start your bot
- Keep it running 24/7

## Alternative: Deploy Directly (No GitHub)

If you don't want to use GitHub:

1. Download all files from this Replit project
2. In Railway, click **"New Project"** → **"Deploy from local directory"**
3. Install Railway CLI: `npm install -g @railway/cli`
4. In your local folder: `railway init` → `railway up`
5. Add your `DISCORD_BOT_TOKEN` in Railway dashboard

## Verify It's Working

1. Go to your Railway project dashboard
2. Click on **"Deployments"** to see logs
3. You should see: "Bot is ready! Logged in as Welcome Bot#XXXX"
4. Join a Discord voice channel
5. 🎵 **Your custom sound should play!**

## Free Tier Limits

Railway free tier includes:
- $5 of credit per month
- Typically enough for 24/7 bot operation
- No credit card required to start

## Troubleshooting

If the bot doesn't connect:
- Check the logs in Railway dashboard
- Verify your `DISCORD_BOT_TOKEN` is set correctly
- Make sure the bot is invited to your Discord server

## Files Included

All necessary files are ready:
- ✅ `index.js` - Main bot code
- ✅ `package.json` - Dependencies
- ✅ `sounds/welcome.mp3` - Your custom sound
- ✅ `Procfile` - Railway deployment config
- ✅ `railway.json` - Railway settings
- ✅ `.gitignore` - Excludes node_modules

---

Need help? Let me know and I'll guide you through any step!
