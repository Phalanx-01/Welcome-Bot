const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, entersState, VoiceConnectionStatus, AudioPlayerStatus } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');
const { waitForLock, acquireLock, releaseLock } = require('./bot-lock');

// Create Discord client with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Initialize libsodium for voice encryption (optional but recommended)
const sodium = require('libsodium-wrappers');

async function initBot() {
  try {
    await sodium.ready;
    console.log('✅ Libsodium initialized for Nikos Bot (encryption optimization ready)');
  } catch (error) {
    console.log('ℹ️  Proceeding without libsodium encryption optimization (Nikos Bot)');
  }
}

// Special user sound mapping
const USER_SOUND_MAP = {
  'liakos74': 'nikos_liakos.mp3',
  'P_Theo04': 'nikos_theo.mp3',
  'ektelestis2012': 'nikos_ektelestis.mp3',
  'valtonera1972': 'nikos_valtonera.mp3'
};

// Track if we've already played for a user join (to coordinate with Rodulis)
const recentlyJoinedUsers = new Map();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of recentlyJoinedUsers.entries()) {
    if (now - timestamp > 60000) { // Remove entries older than 1 minute
      recentlyJoinedUsers.delete(key);
    }
  }
}, 300000);

// Function to get appropriate sound file for a user
function getSoundForUser(username) {
  // Check if user has a special sound
  if (USER_SOUND_MAP[username]) {
    const specialSoundPath = path.join(__dirname, 'sounds', USER_SOUND_MAP[username]);
    if (fs.existsSync(specialSoundPath)) {
      console.log(`🎵 Using special sound for ${username}: ${USER_SOUND_MAP[username]}`);
      return USER_SOUND_MAP[username];
    }
  }

  // Otherwise, return a random standard nikos sound
  const soundFiles = fs.readdirSync(path.join(__dirname, 'sounds'))
    .filter(file => file.startsWith('nikos') && file.endsWith('.mp3') && !file.includes('_'));

  if (soundFiles.length === 0) {
    console.error('⚠️ No nikos sounds found in sounds directory!');
    // Fallback to any MP3 file
    const allSounds = fs.readdirSync(path.join(__dirname, 'sounds'))
      .filter(file => file.endsWith('.mp3'));
    return allSounds.length > 0 ? allSounds[Math.floor(Math.random() * allSounds.length)] : null;
  }

  return soundFiles[Math.floor(Math.random() * soundFiles.length)];
}

// Play sound function
async function playNikosSound(voiceChannel, triggerSource = 'Unknown', username = null) {
  try {
    // Wait for lock (coordinate with other bots)
    const lockAcquired = await waitForLock('Nikos Bot');
    if (!lockAcquired) {
      console.log('⏳ Could not acquire lock after 30 seconds, skipping playback');
      return;
    }

    // Acquire lock
    await acquireLock('Nikos Bot');
    console.log(`🔒 Lock acquired by Nikos Bot (triggered by: ${triggerSource})`);

    // Get appropriate sound file
    const soundFile = getSoundForUser(username);
    if (!soundFile) {
      console.error('❌ No sound file available');
      await releaseLock();
      return;
    }

    const soundPath = path.join(__dirname, 'sounds', soundFile);

    // Create voice connection
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    try {
      // Wait for connection to be ready
      await entersState(connection, VoiceConnectionStatus.Ready, 20000);
      console.log(`🎤 Nikos Bot connected to voice channel: ${voiceChannel.name}`);

      // Create audio player and resource
      const player = createAudioPlayer();
      const resource = createAudioResource(soundPath, { volume: 1.0 });

      // Play the audio
      player.play(resource);
      connection.subscribe(player);

      console.log(`🔊 Playing: ${soundFile} (triggered by: ${triggerSource})`);

      // Handle player events
      player.on(AudioPlayerStatus.Idle, async () => {
        console.log('✅ Audio playback finished (Nikos Bot)');
        try {
          connection.destroy();
          console.log('🔌 Disconnected from voice channel (Nikos Bot)');
        } catch (error) {
          console.error('Error destroying connection:', error);
        }
        await releaseLock();
        console.log('🔓 Lock released by Nikos Bot');
      });

      player.on('error', async error => {
        console.error('❌ Audio player error (Nikos Bot):', error);
        try {
          connection.destroy();
        } catch (e) {
          console.error('Error destroying connection after player error:', e);
        }
        await releaseLock();
      });

    } catch (error) {
      console.error('❌ Voice connection error (Nikos Bot):', error);
      connection.destroy();
      await releaseLock();
    }
  } catch (error) {
    console.error('❌ Error in playNikosSound:', error);
    await releaseLock();
  }
}

// Bot ready event
client.once('ready', () => {
  console.log(`✨ Nikos Bot is ready! Logged in as ${client.user.tag}`);
  console.log(`📊 Monitoring ${client.guilds.cache.size} server(s) for voice events and messages`);
  console.log('🎯 Special sounds configured for: liakos74, P_Theo04, ektelestis2012, valtonera1972');

  // Start 10-minute auto-play interval
  startAutoPlayInterval();
});

// Voice state update event (user joins voice channel)
client.on('voiceStateUpdate', async (oldState, newState) => {
  // Check if user joined a voice channel (was not in one before, now is in one)
  if (!oldState.channelId && newState.channelId) {
    const member = newState.member;
    const voiceChannel = newState.channel;

    // Skip if it's a bot
    if (member.user.bot) return;

    // Create a unique key for this user join
    const joinKey = `${member.id}-${voiceChannel.id}`;

    // Check if we recently handled this user (within 1 minute)
    if (recentlyJoinedUsers.has(joinKey)) {
      console.log(`⏭️ Skipping ${member.user.username} - already handled recently`);
      return;
    }

    console.log(`🎊 ${member.user.username} joined ${voiceChannel.name}!`);

    // Mark this user as recently joined
    recentlyJoinedUsers.set(joinKey, Date.now());

    // Wait a random time between 1-3 seconds (to coordinate with Rodulis)
    const delay = Math.random() * 2000 + 1000;
    console.log(`⏰ Waiting ${Math.round(delay)}ms before playing sound...`);
    await new Promise(resolve => setTimeout(resolve, delay));

    // Play sound for this user
    await playNikosSound(voiceChannel, `${member.user.username} joined`, member.user.username);
  }
});

// Message event (listen for "nikos" keyword)
client.on('messageCreate', async message => {
  // Ignore messages from bots
  if (message.author.bot) return;

  // Check if message contains "nikos" (case-insensitive)
  if (message.content.toLowerCase().includes('nikos')) {
    // Check if the message author is in a voice channel
    const voiceChannel = message.member?.voice?.channel;

    if (voiceChannel) {
      console.log(`💬 ${message.author.username} triggered Nikos Bot with keyword in ${message.channel.name}`);
      await playNikosSound(voiceChannel, `Keyword by ${message.author.username}`, message.author.username);
    } else {
      console.log(`💬 ${message.author.username} said "nikos" but is not in a voice channel`);
    }
  }
});

// Auto-play function (every 10 minutes)
function startAutoPlayInterval() {
  const INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

  console.log('⏲️ Starting 10-minute auto-play interval for Nikos Bot');

  setInterval(async () => {
    try {
      // Find a voice channel with users
      const voiceChannel = findVoiceChannelWithUsers();

      if (voiceChannel) {
        const userCount = voiceChannel.members.filter(member => !member.user.bot).size;
        console.log(`⏰ 10-minute timer triggered! Found ${userCount} user(s) in ${voiceChannel.name}`);

        // Pick a random user from the channel for sound selection
        const users = voiceChannel.members.filter(member => !member.user.bot);
        const randomUser = users.random();
        const username = randomUser ? randomUser.user.username : null;

        await playNikosSound(voiceChannel, 'Auto-play (10 min)', username);
      } else {
        console.log('⏰ 10-minute timer triggered, but no users in voice channels');
      }
    } catch (error) {
      console.error('❌ Error in auto-play interval:', error);
    }
  }, INTERVAL_MS);

  console.log(`✅ Auto-play scheduled: Every ${INTERVAL_MS / 1000 / 60} minutes`);
}

// Find a voice channel with users
function findVoiceChannelWithUsers() {
  const voiceChannels = [];

  // Iterate through all guilds the bot is in
  client.guilds.cache.forEach(guild => {
    // Get all voice channels in this guild
    guild.channels.cache
      .filter(channel => channel.isVoiceBased() && channel.id !== guild.afkChannelId)
      .forEach(channel => {
        // Count non-bot members
        const userCount = channel.members.filter(member => !member.user.bot).size;
        if (userCount > 0) {
          voiceChannels.push({ channel, userCount });
        }
      });
  });

  if (voiceChannels.length === 0) {
    return null;
  }

  // Randomly select one of the channels with users
  const selected = voiceChannels[Math.floor(Math.random() * voiceChannels.length)];
  return selected.channel;
}

// Error handling
process.on('unhandledRejection', error => {
  if (error.message && error.message.includes('Used disallowed intents')) {
    console.error('❌ Bot token does not have necessary intents enabled. Please enable MESSAGE CONTENT intent in Discord Developer Portal.');
  } else if (error.message && error.message.includes('TOKEN_INVALID')) {
    console.error('❌ Invalid bot token. Please check NIKOS_BOT_TOKEN in your .env file.');
  } else if (error.message && (error.message.includes('ECONNREFUSED') || error.message.includes('EAI_AGAIN'))) {
    // Ignore network errors that are often transient
    return;
  } else {
    console.error('Unhandled promise rejection:', error);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Nikos Bot shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

// Get bot token
const token = process.env.NIKOS_BOT_TOKEN;

if (!token) {
  console.error('❌ ERROR: No Discord bot token found!');
  console.error('Please set NIKOS_BOT_TOKEN environment variable.');
  process.exit(1);
}

// Login to Discord after initialization
initBot().then(() => {
  client.login(token).catch(error => {
    console.error('❌ Failed to login:', error.message);
    process.exit(1);
  });
}).catch(error => {
  console.error('❌ Failed to initialize bot:', error);
  process.exit(1);
});