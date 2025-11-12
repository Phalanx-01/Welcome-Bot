# Discord Welcome Bot

A Node.js Discord bot that plays a sound when someone joins a voice channel.

## Features

- Automatically detects when users join voice channels
- Plays a welcome sound when someone joins
- Automatically disconnects after playing the sound
- Works across all voice channels in your Discord server

## Setup Instructions

### 1. Discord Developer Portal Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application or select an existing one
3. Go to the **Bot** section in the left sidebar
4. Click **Reset Token** to get your bot token (save this securely)
5. Scroll down to **Privileged Gateway Intents** and make sure these are enabled:
   - **Server Members Intent** (optional, but recommended)
   - **Message Content Intent** (optional, for future features)

### 2. Invite the Bot to Your Server

1. In the Discord Developer Portal, go to **OAuth2** > **URL Generator**
2. Select these scopes:
   - `bot`
   - `applications.commands`
3. Select these bot permissions:
   - **View Channels**
   - **Connect** (to join voice channels)
   - **Speak** (to play audio)
4. Copy the generated URL and open it in your browser
5. Select your server and authorize the bot

### 3. Add Your Bot Token

The bot token has already been added to your Replit Secrets as `DISCORD_BOT_TOKEN`.

### 4. Run the Bot

The bot is configured to run automatically. You can restart it anytime using the workflow controls.

## How It Works

When a user joins any voice channel in your Discord server:
1. The bot detects the join event
2. The bot connects to the same voice channel
3. The bot plays the welcome sound (`sounds/welcome.mp3`)
4. The bot disconnects after the sound finishes

## Customizing the Welcome Sound

You can replace the welcome sound by uploading your own audio file:

1. Upload your audio file (MP3, WAV, or other formats supported by FFmpeg) to the `sounds/` folder
2. Rename it to `welcome.mp3` (or update the filename in `index.js`)
3. Restart the bot workflow

### Creating a Custom Sound

You can use FFmpeg to create custom sounds. Examples:

```bash
# Generate a simple beep
ffmpeg -f lavfi -i "sine=frequency=800:duration=1" sounds/welcome.mp3 -y

# Generate a two-tone sound
ffmpeg -f lavfi -i "sine=frequency=600:duration=0.3" -f lavfi -i "sine=frequency=800:duration=0.3" -filter_complex concat=n=2:v=0:a=1 sounds/welcome.mp3 -y
```

## Troubleshooting

### Bot doesn't join voice channels
- Make sure the bot has **Connect** and **Speak** permissions
- Check that the bot is online (you should see it online in your server)
- Review the console logs for any error messages

### No sound plays
- Verify the `sounds/welcome.mp3` file exists
- Check the console logs for audio player errors
- Make sure FFmpeg is installed (it should be available automatically)

### Bot goes offline
- Check if the `DISCORD_BOT_TOKEN` secret is set correctly
- Review the console logs for login errors
- Verify the token is valid in the Discord Developer Portal

## Technical Details

- **Framework**: Discord.js v14
- **Voice Library**: @discordjs/voice
- **Audio Encoder**: opusscript
- **Audio Processing**: FFmpeg
- **Runtime**: Node.js 20

## File Structure

```
.
├── index.js           # Main bot code
├── package.json       # Dependencies
├── sounds/            # Audio files directory
│   └── welcome.mp3    # Default welcome sound
└── README.md          # This file
```
