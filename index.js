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
const path = require('path');
const fs = require('fs');
const sodium = require('libsodium-wrappers');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
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
  await sodium.ready;
  console.log('Sodium encryption library initialized');
}

client.once('ready', () => {
  console.log(`Bot is ready! Logged in as ${client.user.tag}`);
  console.log(`Monitoring voice channels in ${client.guilds.cache.size} server(s)`);
});

async function playWelcomeSound(channel, memberName, retryCount = 0) {
  const maxRetries = 2;
  
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
    const soundPath = path.join(__dirname, 'sounds', 'welcome.mp3');
    
    if (!fs.existsSync(soundPath)) {
      console.error('Welcome sound file not found!');
      connection.destroy();
      return;
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
