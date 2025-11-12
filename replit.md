# Discord Welcome Bot Project

## Overview
This is a Node.js Discord bot that automatically plays a welcome sound when users join voice channels in a Discord server.

## Current State
- Bot is fully functional and running
- Successfully connects to Discord API
- Monitors voice channel join events
- Plays audio when users join voice channels

## Recent Changes (November 12, 2025)
- Initial project setup with Node.js and Discord.js v14
- Implemented voice channel monitoring using @discordjs/voice
- Added audio playback functionality with opusscript encoder
- Generated default welcome sound using FFmpeg
- Configured workflow for continuous bot operation
- Set up DISCORD_BOT_TOKEN secret for authentication

## Project Architecture

### Dependencies
- **discord.js** (v14.14.1): Main Discord API wrapper
- **@discordjs/voice** (v0.16.1): Voice connection and audio playback
- **opusscript**: Audio encoding for Discord voice
- **ffmpeg-static**: Audio file processing
- **libsodium-wrappers**: Encryption for voice connections

### Key Components
1. **index.js**: Main bot application
   - Client initialization with minimal intents (Guilds, GuildVoiceStates)
   - Voice state update event handler
   - Audio player and voice connection management
   - Automatic cleanup after sound playback

2. **sounds/**: Audio files directory
   - Contains welcome.mp3 (generated 800Hz tone)
   - Users can replace with custom sounds

### Bot Intents Used
- `Guilds`: Access to server information
- `GuildVoiceStates`: Monitor voice channel joins/leaves

### How It Works
1. Bot monitors `voiceStateUpdate` events
2. When a user joins a voice channel (no previous channel, new channel present)
3. Bot joins the same voice channel
4. Plays the welcome sound from `sounds/welcome.mp3`
5. Automatically disconnects after playback completes

## Configuration
- **Workflow**: `discord-bot` runs `node index.js` in console mode
- **Authentication**: Uses DISCORD_BOT_TOKEN from environment secrets
- **Audio Format**: MP3, processed through FFmpeg

## User Preferences
None specified yet.

## Next Steps Ideas
- Add multiple sound options with random selection
- Implement per-user or per-role custom sounds
- Add configuration file for customizable settings
- Create sound upload functionality
- Add cooldown to prevent spam
