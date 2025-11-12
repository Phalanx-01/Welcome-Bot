const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const path = require('path');
const fs = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const activeConnections = new Map();

client.once('ready', () => {
  console.log(`Bot is ready! Logged in as ${client.user.tag}`);
  console.log(`Monitoring voice channels in ${client.guilds.cache.size} server(s)`);
});

client.on('voiceStateUpdate', async (oldState, newState) => {
  const memberName = newState.member.user.tag;
  
  if (!oldState.channelId && newState.channelId) {
    console.log(`${memberName} joined voice channel: ${newState.channel.name}`);
    
    try {
      const connection = joinVoiceChannel({
        channelId: newState.channelId,
        guildId: newState.guild.id,
        adapterCreator: newState.guild.voiceAdapterCreator,
      });

      connection.on(VoiceConnectionStatus.Ready, () => {
        console.log('Voice connection is ready!');
      });

      const player = createAudioPlayer();
      
      const soundPath = path.join(__dirname, 'sounds', 'welcome.mp3');
      
      if (!fs.existsSync(soundPath)) {
        console.error('Welcome sound file not found at:', soundPath);
        connection.destroy();
        return;
      }

      const resource = createAudioResource(soundPath);
      player.play(resource);
      connection.subscribe(player);

      player.on(AudioPlayerStatus.Idle, () => {
        setTimeout(() => {
          connection.destroy();
          console.log('Disconnected from voice channel after playing sound');
        }, 1000);
      });

      player.on('error', error => {
        console.error('Audio player error:', error);
        connection.destroy();
      });

    } catch (error) {
      console.error('Error joining voice channel or playing sound:', error);
    }
  }
  
  if (oldState.channelId && !newState.channelId) {
    console.log(`${memberName} left voice channel: ${oldState.channel.name}`);
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content === '!ping') {
    message.reply('Pong! Bot is online and monitoring voice channels.');
  }

  if (message.content === '!status') {
    const voiceChannels = message.guild.channels.cache.filter(c => c.type === 2);
    message.reply(`Monitoring ${voiceChannels.size} voice channel(s) in this server.`);
  }
});

const token = process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN;

if (!token) {
  console.error('ERROR: No Discord bot token found!');
  console.error('Please set DISCORD_TOKEN or DISCORD_BOT_TOKEN environment variable.');
  process.exit(1);
}

client.login(token).catch(error => {
  console.error('Failed to login:', error);
  process.exit(1);
});
