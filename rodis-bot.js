const path = require('path');
const fs = require('fs');
const sodium = require('libsodium-wrappers');
const { waitForLock, acquireLock, releaseLock } = require('./bot-lock');

const { Client, GatewayIntentBits } = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  getVoiceConnection
} = require('@discordjs/voice');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

process.on('unhandledRejection', (error) => {
  if (error?.message?.includes('IP discovery')) {
    console.log('IP discovery error caught (networking issue)');
    return;
  }
  console.error('Unhandled rejection:', error);
});

async function initBot() {
  console.log('Initializing Rodis Discord bot...');
  try {
    await sodium.ready;
    console.log('Sodium encryption library ready');
  } catch (error) {
    console.log('Continuing without sodium optimization');
  }
}

client.once('ready', () => {
  console.log(`Rodis Bot is ready! Logged in as ${client.user.tag}`);
  console.log(`Monitoring messages in ${client.guilds.cache.size} server(s)`);
});

async function playRodisSound(channel, memberName, retryCount = 0) {
  const maxRetries = 2;
  const BOT_NAME = 'Rodis Bot';

  // Wait for other bots to finish playing
  console.log(`${BOT_NAME}: Checking if other bots are playing...`);
  await waitForLock(BOT_NAME);

  // Acquire lock before playing
  if (!acquireLock(BOT_NAME)) {
    console.error(`${BOT_NAME}: Failed to acquire lock`);
    return;
  }

  // Load rodis sound file
  const soundsDir = path.join(__dirname, 'sounds');
  let rodisSounds = [];

  try {
    // Read all files from sounds directory
    const files = fs.readdirSync(soundsDir);
    // Filter for MP3 files that start with 'rodis'
    rodisSounds = files.filter(file =>
      file.startsWith('rodis') && file.endsWith('.mp3')
    );

    // If no rodis-specific sounds found, fall back to welcome sounds
    if (rodisSounds.length === 0) {
      console.log('No rodis sounds found, using welcome sounds as fallback');
      rodisSounds = files.filter(file =>
        file.startsWith('welcome') && file.endsWith('.mp3')
      );
    }

    if (rodisSounds.length === 0) {
      console.error('No sound files found in sounds directory!');
      releaseLock(); // Release lock on error
      return;
    }

    console.log(`Found ${rodisSounds.length} sound(s) for Rodis: ${rodisSounds.join(', ')}`);
  } catch (readError) {
    console.error('Error reading sounds directory:', readError);
    releaseLock(); // Release lock on error
    return;
  }

  try {
    console.log(`[Attempt ${retryCount + 1}] Connecting to voice channel...`);

    const existingConnection = getVoiceConnection(channel.guild.id);
    if (existingConnection) {
      console.log('Destroying existing connection...');
      existingConnection.destroy();
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: false,
      selfMute: false,
    });

    connection.on('error', (error) => {
      console.error('Voice connection error:', error.message);
    });

    connection.on('debug', (message) => {
      console.log(`[DEBUG] ${message}`);
    });

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      console.log('Voice connection disconnected');
      try {
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5000),
        ]);
      } catch (error) {
        connection.destroy();
      }
    });

    console.log('Waiting for voice connection to be ready...');
    await entersState(connection, VoiceConnectionStatus.Ready, 20000);
    console.log(`✅ Voice connection ready for ${memberName}`);

    const player = createAudioPlayer();

    // Randomly select a sound
    const randomSound = rodisSounds[Math.floor(Math.random() * rodisSounds.length)];
    let soundPath = path.join(__dirname, 'sounds', randomSound);

    if (!fs.existsSync(soundPath)) {
      console.error(`Sound file not found: ${randomSound}`);
      // Try fallback to first sound if random selection doesn't exist
      const fallbackPath = path.join(__dirname, 'sounds', rodisSounds[0]);
      if (!fs.existsSync(fallbackPath)) {
        console.error('No sound files found!');
        connection.destroy();
        releaseLock(); // Release lock on error
        return;
      }
      // Use fallback
      console.log(`Using fallback sound: ${rodisSounds[0]}`);
      soundPath = fallbackPath;
    } else {
      console.log(`Playing sound: ${randomSound}`);
    }

    console.log('Creating audio resource...');
    const resource = createAudioResource(soundPath, {
      inlineVolume: true
    });

    if (resource.volume) {
      resource.volume.setVolume(1.0);
    }

    player.play(resource);
    connection.subscribe(player);
    console.log('Playing Rodis sound...');

    player.on(AudioPlayerStatus.Playing, () => {
      console.log('Audio is now playing!');
    });

    player.on(AudioPlayerStatus.Idle, () => {
      console.log('Audio playback finished');
      setTimeout(() => {
        connection.destroy();
        console.log('Disconnected from voice channel');
        releaseLock(); // Release lock when done playing
      }, 1000);
    });

    player.on('error', error => {
      console.error('Audio player error:', error);
      connection.destroy();
      releaseLock(); // Release lock on error
    });

  } catch (error) {
    console.error(`Connection attempt ${retryCount + 1} failed:`, error.message);

    if (retryCount < maxRetries && !error.message.includes('IP discovery')) {
      console.log(`Retrying in 2 seconds...`);
      releaseLock(); // Release lock before retry
      await new Promise(resolve => setTimeout(resolve, 2000));
      return playRodisSound(channel, memberName, retryCount + 1);
    }

    if (error.message.includes('IP discovery')) {
      console.error('❌ UDP networking not available - voice features disabled');
      console.error('This environment does not support Discord voice connections');
    }

    releaseLock(); // Release lock on final failure
  }
}


// Track recently departed users to prevent spam
const recentlyLeftUsers = new Map();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of recentlyLeftUsers.entries()) {
    if (now - timestamp > 60000) {
      recentlyLeftUsers.delete(key);
    }
  }
}, 300000);

// Play exit sound (uses rodulis_exit*.mp3 files)
async function playExitSound(channel, memberName) {
  const BOT_NAME = 'Rodis Bot';
  const soundsDir = path.join(__dirname, 'sounds');

  // Find exit sounds
  let exitSounds = [];
  try {
    const files = fs.readdirSync(soundsDir);
    exitSounds = files.filter(file => file.startsWith('rodulis_exit') && file.endsWith('.mp3'));

    if (exitSounds.length === 0) {
      console.log('👋 No rodulis_exit sounds found, skipping farewell');
      return;
    }
    console.log(`Found ${exitSounds.length} exit sound(s): ${exitSounds.join(', ')}`);
  } catch (error) {
    console.error('Error reading sounds directory:', error);
    return;
  }

  // Wait for lock
  await waitForLock(BOT_NAME);
  if (!acquireLock(BOT_NAME)) {
    console.error(`${BOT_NAME}: Failed to acquire lock for exit sound`);
    return;
  }

  try {
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: false,
      selfMute: false,
    });

    await entersState(connection, VoiceConnectionStatus.Ready, 20000);

    const player = createAudioPlayer();
    const randomSound = exitSounds[Math.floor(Math.random() * exitSounds.length)];
    const soundPath = path.join(__dirname, 'sounds', randomSound);

    console.log(`👋 Playing exit sound: ${randomSound} for ${memberName}`);
    const resource = createAudioResource(soundPath, { inlineVolume: true });
    if (resource.volume) resource.volume.setVolume(1.0);

    player.play(resource);
    connection.subscribe(player);

    player.on(AudioPlayerStatus.Idle, () => {
      setTimeout(() => {
        connection.destroy();
        releaseLock();
      }, 1000);
    });

    player.on('error', error => {
      console.error('Exit sound player error:', error);
      connection.destroy();
      releaseLock();
    });
  } catch (error) {
    console.error('Exit sound connection error:', error.message);
    releaseLock();
  }
}

// Listen for voice state updates (user leaves channel) - ONLY Rodulis plays farewell
client.on('voiceStateUpdate', async (oldState, newState) => {
  // Check if user left a voice channel (was in one, now is not or moved to different)
  if (oldState.channelId && oldState.channelId !== newState.channelId) {
    const member = oldState.member;
    const leftChannel = oldState.channel;

    // Skip bots
    if (member.user.bot) return;

    // Check if there are still users in the channel to hear the sound
    const remainingUsers = leftChannel.members.filter(m => !m.user.bot).size;
    if (remainingUsers === 0) {
      console.log(`👋 ${member.user.username} left ${leftChannel.name}, but no one left to hear farewell`);
      return;
    }

    // Check cooldown (1 minute per user per channel)
    const leaveKey = `${member.id}-${leftChannel.id}`;
    if (recentlyLeftUsers.has(leaveKey)) {
      console.log(`⏭️ Skipping farewell for ${member.user.username} - recently played`);
      return;
    }

    console.log(`👋 ${member.user.username} left ${leftChannel.name}! Playing farewell sound...`);
    recentlyLeftUsers.set(leaveKey, Date.now());

    await playExitSound(leftChannel, member.user.username);
  }
});

// Listen for the "rodis" keyword trigger
client.on('messageCreate', async (message) => {
  // Ignore bot messages
  if (message.author.bot) return;

  // Check if message contains the keyword "rodis" (case insensitive)
  if (message.content.toLowerCase().includes('rodis')) {
    console.log(`\n🔊 Keyword "rodis" triggered by ${message.author.tag}`);

    // Check if the user is in a voice channel
    const member = message.member;
    if (!member || !member.voice.channel) {
      console.log(`❌ User ${message.author.tag} is not in a voice channel`);
      message.reply('You need to be in a voice channel to trigger the sound!').catch(console.error);
      return;
    }

    console.log(`✅ User is in voice channel: ${member.voice.channel.name}`);
    await playRodisSound(member.voice.channel, message.author.tag);
  }
});


const token = process.env.RODIS_BOT_TOKEN;

if (!token) {
  console.error('ERROR: No Discord bot token found!');
  console.error('Please set RODIS_BOT_TOKEN environment variable.');
  process.exit(1);
}

initBot().then(() => {
  client.login(token).catch(error => {
    console.error('Failed to login:', error);
    process.exit(1);
  });
}).catch(error => {
  console.error('Failed to initialize bot:', error);
  process.exit(1);
});
