const path = require('path');
const fs = require('fs');
const sodium = require('libsodium-wrappers');

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
  console.log('Initializing Discord bot...');
  try {
    await sodium.ready;
    console.log('Sodium encryption library ready');
  } catch (error) {
    console.log('Continuing without sodium optimization');
  }
}

client.once('ready', () => {
  console.log(`Bot is ready! Logged in as ${client.user.tag}`);
  console.log(`Monitoring voice channels in ${client.guilds.cache.size} server(s)`);
});

async function playWelcomeSound(channel, memberName, retryCount = 0) {
  const maxRetries = 2;

  // Dynamically load all welcome sounds from the sounds folder
  const soundsDir = path.join(__dirname, 'sounds');
  let welcomeSounds = [];

  try {
    // Read all files from sounds directory
    const files = fs.readdirSync(soundsDir);
    // Filter for MP3 files that start with 'welcome'
    welcomeSounds = files.filter(file =>
      file.startsWith('welcome') && file.endsWith('.mp3')
    );

    if (welcomeSounds.length === 0) {
      console.error('No welcome sounds found in sounds directory!');
      return;
    }

    console.log(`Found ${welcomeSounds.length} welcome sound(s): ${welcomeSounds.join(', ')}`);
  } catch (readError) {
    console.error('Error reading sounds directory:', readError);
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

    // Randomly select a welcome sound
    const randomSound = welcomeSounds[Math.floor(Math.random() * welcomeSounds.length)];
    let soundPath = path.join(__dirname, 'sounds', randomSound);

    if (!fs.existsSync(soundPath)) {
      console.error(`Welcome sound file not found: ${randomSound}`);
      // Try fallback to first sound if random selection doesn't exist
      const fallbackPath = path.join(__dirname, 'sounds', welcomeSounds[0]);
      if (!fs.existsSync(fallbackPath)) {
        console.error('No welcome sound files found!');
        connection.destroy();
        return;
      }
      // Use fallback
      console.log(`Using fallback sound: ${welcomeSounds[0]}`);
      soundPath = fallbackPath;
    } else {
      console.log(`Playing welcome sound: ${randomSound}`);
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
    console.log('Playing welcome sound...');

    player.on(AudioPlayerStatus.Playing, () => {
      console.log('Audio is now playing!');
    });

    player.on(AudioPlayerStatus.Idle, () => {
      console.log('Audio playback finished');
      setTimeout(() => {
        connection.destroy();
        console.log('Disconnected from voice channel');
      }, 1000);
    });

    player.on('error', error => {
      console.error('Audio player error:', error);
      connection.destroy();
    });

  } catch (error) {
    console.error(`Connection attempt ${retryCount + 1} failed:`, error.message);
    
    if (retryCount < maxRetries && !error.message.includes('IP discovery')) {
      console.log(`Retrying in 2 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return playWelcomeSound(channel, memberName, retryCount + 1);
    }
    
    if (error.message.includes('IP discovery')) {
      console.error('❌ UDP networking not available - voice features disabled');
      console.error('This environment does not support Discord voice connections');
    }
  }
}

client.on('voiceStateUpdate', async (oldState, newState) => {
  if (newState.member.user.bot) return;

  const memberName = newState.member.user.tag;

  if (oldState.channelId !== newState.channelId && newState.channelId) {
    console.log(`\n🎵 ${memberName} joined voice channel: ${newState.channel.name}`);
    await playWelcomeSound(newState.channel, memberName);
  }

  if (oldState.channelId && !newState.channelId) {
    console.log(`${memberName} left voice channel: ${oldState.channel.name}`);
  }
});

// Listen for the "rodulis" keyword trigger
client.on('messageCreate', async (message) => {
  // Ignore bot messages
  if (message.author.bot) return;

  // Check if message contains the keyword "rodulis" (case insensitive)
  if (message.content.toLowerCase().includes('rodulis')) {
    console.log(`\n🔊 Keyword "rodulis" triggered by ${message.author.tag}`);

    // Check if the user is in a voice channel
    const member = message.member;
    if (!member || !member.voice.channel) {
      console.log(`❌ User ${message.author.tag} is not in a voice channel`);
      message.reply('You need to be in a voice channel to trigger the sound!').catch(console.error);
      return;
    }

    console.log(`✅ User is in voice channel: ${member.voice.channel.name}`);
    await playWelcomeSound(member.voice.channel, message.author.tag);
  }
});


const token = process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN;

if (!token) {
  console.error('ERROR: No Discord bot token found!');
  console.error('Please set DISCORD_TOKEN or DISCORD_BOT_TOKEN environment variable.');
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
