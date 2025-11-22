# Railway.com Deployment Guide

## Setup for Railway.com

Railway runs both bots in a single service, allowing them to share the lock file for synchronization.

## Deployment Steps:

### Step 1: Connect Your Repository to Railway

1. Go to https://railway.app
2. Click "New Project"
3. Choose "Deploy from GitHub repo"
4. Select your repository

### Step 2: Set Environment Variables

In your Railway project dashboard:

1. Go to **Variables** tab
2. Add these environment variables:

```
DISCORD_TOKEN=your-rodulis-bot-token-here
RODIS_BOT_TOKEN=your-rodis-bot-token-here
```

⚠️ **IMPORTANT:** Never commit bot tokens to git! Always use environment variables.

### Step 3: Configure Start Command

Railway will automatically detect `npm start` which now runs both bots using `start-both.js`.

**Or manually set the start command:**
```
node start-both.js
```

### Step 4: Deploy

1. Click **Deploy**
2. Wait for deployment to complete
3. Check the logs to verify both bots are running

## Expected Logs:

You should see output like:
```
Starting both Discord bots...

Bot is ready! Logged in as Rodulis Bot#1234
Monitoring voice channels in 1 server(s)

Rodis Bot is ready! Logged in as Rodis Bot#5678
Monitoring messages in 1 server(s)
```

## Troubleshooting on Railway:

### Bots not starting:
- Check environment variables are set correctly
- View logs in Railway dashboard
- Ensure both tokens are valid

### Voice features not working:
- Railway supports UDP, so voice should work
- Check bot permissions in Discord
- Verify ffmpeg-static is in dependencies

### Memory issues:
- Railway free tier has memory limits
- Running both bots uses ~200-300MB
- Upgrade plan if needed

## File Structure for Railway:

```
NodeJs/
├── index.js              # Rodulis Bot
├── rodis-bot.js          # Rodis Bot
├── bot-lock.js           # Shared locking
├── start-both.js         # Launcher for both bots
├── package.json          # Updated with start script
└── sounds/               # Your MP3 files
    ├── welcome*.mp3
    └── rodis*.mp3
```

## Alternative: Run as Separate Railway Services

If you want to run them separately:

**Service 1 (Rodulis):**
- Start command: `node index.js`
- Env var: `DISCORD_TOKEN`

**Service 2 (Rodis):**
- Start command: `node rodis-bot.js`
- Env var: `RODIS_BOT_TOKEN`

⚠️ **Note:** Lock file won't work across services. You'd need Redis or a database for synchronization.

## Testing on Railway:

Once deployed:
1. Join a voice channel in Discord
2. Type "rodulis" - first bot plays
3. Type "rodis" - second bot waits, then plays
4. Both bots should coordinate via the lock file

## Monitoring:

Check Railway logs to see:
- Lock acquisition/release messages
- Audio playback status
- Connection status
- Any errors

## Support:

If deployment fails:
1. Check Railway build logs
2. Verify all files are committed to git
3. Ensure `sounds/` folder has at least one MP3 file
4. Check that dependencies are installed
