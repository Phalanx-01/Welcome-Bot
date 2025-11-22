# Discord Multi-Bot Setup Guide

This guide will help you set up and run both Discord bots:
1. **Rodulis Bot** - Plays sounds when users join voice channels + responds to "rodulis" keyword
2. **Rodis Bot** - Responds only to "rodis" keyword

## Features

### Rodulis Bot (index.js)
- Automatically plays a random welcome sound when someone joins a voice channel
- Responds to the keyword "rodulis" typed in chat
- Uses welcome*.mp3 sounds from the sounds folder

### Rodis Bot (rodis-bot.js)
- Responds to the keyword "rodis" typed in chat
- Uses rodis*.mp3 sounds (or falls back to welcome sounds)
- Waits for Rodulis Bot to finish playing before starting

### Smart Synchronization
Both bots use a locking mechanism to ensure they don't play sounds simultaneously:
- When one bot is playing, the other will wait
- After the first bot finishes, the second bot can play
- Maximum wait time: 30 seconds

## Prerequisites

1. **Two Discord Bot Accounts**
   - You need to create TWO separate bot applications in Discord Developer Portal
   - Both bots need to be added to your Discord server

2. **Bot Permissions**
   - Both bots need: `Connect`, `Speak`, `View Channels`, `Send Messages`
   - Both bots need the following intents enabled in Discord Developer Portal:
     - SERVER MEMBERS INTENT
     - MESSAGE CONTENT INTENT
     - PRESENCE INTENT (optional)

## Setup Instructions

### Step 1: Create Discord Bot Applications

1. Go to https://discord.com/developers/applications
2. Click "New Application" and name it "Rodulis Bot"
3. Go to "Bot" section → Click "Reset Token" → Copy the token (save it securely)
4. Scroll to "Privileged Gateway Intents" and enable:
   - **MESSAGE CONTENT INTENT** ✓
   - SERVER MEMBERS INTENT (optional)
5. Repeat steps 1-4 for the second bot named "Rodis Bot"

### Step 2: Invite Both Bots to Your Server

For each bot:
1. Go to OAuth2 → URL Generator
2. Select scopes: `bot`
3. Select bot permissions: `Connect`, `Speak`, `View Channels`, `Send Messages`
4. Copy the generated URL and open it in your browser
5. Select your server and authorize the bot

### Step 3: Set Environment Variables

You need to set two environment variables with your bot tokens:

**On Windows (PowerShell):**
```powershell
$env:DISCORD_TOKEN="your-rodulis-bot-token-here"
$env:RODIS_BOT_TOKEN="your-rodis-bot-token-here"
```

**On Windows (Command Prompt):**
```cmd
set DISCORD_TOKEN=your-rodulis-bot-token-here
set RODIS_BOT_TOKEN=your-rodis-bot-token-here
```

**On Linux/Mac:**
```bash
export DISCORD_TOKEN="your-rodulis-bot-token-here"
export RODIS_BOT_TOKEN="your-rodis-bot-token-here"
```

**Permanent Setup (Recommended):**
Create a `.env` file in the project directory:
```
DISCORD_TOKEN=your-rodulis-bot-token-here
RODIS_BOT_TOKEN=your-rodis-bot-token-here
```

### Step 4: Add Sound Files

Place your sound files in the `sounds/` directory:

- **For Rodulis Bot:** Name files as `welcome*.mp3` (e.g., welcome1.mp3, welcome2.mp3)
- **For Rodis Bot:** Name files as `rodis*.mp3` (e.g., rodis1.mp3, rodis2.mp3)
  - If no rodis sounds exist, it will use welcome sounds as fallback

The bots will randomly select from available sounds.

## Running the Bots

### Option 1: Run Each Bot in Separate Terminals

**Terminal 1 - Rodulis Bot:**
```bash
npm run start:rodulis
```

**Terminal 2 - Rodis Bot:**
```bash
npm run start:rodis
```

### Option 2: Run Manually with Node

**Terminal 1:**
```bash
node index.js
```

**Terminal 2:**
```bash
node rodis-bot.js
```

## Testing the Bots

1. **Test Rodulis Bot:**
   - Join a voice channel → Bot should play a welcome sound automatically
   - Type "rodulis" in any text channel while in a voice channel → Bot plays a sound

2. **Test Rodis Bot:**
   - Type "rodis" in any text channel while in a voice channel → Bot plays a sound

3. **Test Synchronization:**
   - Type "rodulis" in chat
   - Quickly type "rodis" in chat
   - Rodis Bot should wait for Rodulis Bot to finish before playing

## Troubleshooting

### Bot doesn't respond to keywords
- Make sure MESSAGE CONTENT INTENT is enabled in Discord Developer Portal
- Restart the bot after enabling the intent
- Check that you're in a voice channel when typing the keyword

### Bots play simultaneously
- Make sure both bots are running from the same directory
- Check that the `.bot-playing.lock` file can be created/deleted in the directory
- Verify both bots are using the same `bot-lock.js` module

### Voice connection errors
- Ensure the bot has `Connect` and `Speak` permissions
- Check that ffmpeg-static is installed: `npm install`
- Some hosting environments don't support UDP voice connections

### "No token found" error
- Verify environment variables are set correctly
- Use the correct variable names: `DISCORD_TOKEN` for Rodulis, `RODIS_BOT_TOKEN` for Rodis
- Try setting them in the same terminal session where you run the bot

## File Structure

```
NodeJs/
├── index.js              # Rodulis Bot (main bot)
├── rodis-bot.js          # Rodis Bot (keyword-only bot)
├── bot-lock.js           # Shared locking mechanism
├── sounds/
│   ├── welcome1.mp3      # Sounds for Rodulis Bot
│   ├── welcome2.mp3
│   ├── rodis1.mp3        # Sounds for Rodis Bot (optional)
│   └── rodis2.mp3
├── package.json
└── SETUP.md              # This file
```

## Advanced: Running Both Bots with PM2 (Optional)

For production environments, you can use PM2 to manage both bots:

```bash
# Install PM2 globally
npm install -g pm2

# Start both bots
pm2 start index.js --name rodulis-bot
pm2 start rodis-bot.js --name rodis-bot

# View status
pm2 status

# View logs
pm2 logs

# Stop bots
pm2 stop all

# Restart bots
pm2 restart all
```

## Support

If you encounter issues:
1. Check the console output for error messages
2. Verify all prerequisites are met
3. Ensure both bots have the correct permissions
4. Check that sound files exist in the sounds directory
