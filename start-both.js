const { spawn } = require('child_process');

console.log('Starting both Discord bots...\n');

// Start Rodulis Bot
const rodulisBot = spawn('node', ['index.js'], {
  stdio: 'inherit',
  env: { ...process.env }
});

// Start Rodis Bot
const rodisBot = spawn('node', ['rodis-bot.js'], {
  stdio: 'inherit',
  env: { ...process.env }
});

rodulisBot.on('error', (error) => {
  console.error('Rodulis Bot error:', error);
});

rodisBot.on('error', (error) => {
  console.error('Rodis Bot error:', error);
});

rodulisBot.on('exit', (code) => {
  console.log(`Rodulis Bot exited with code ${code}`);
  process.exit(code);
});

rodisBot.on('exit', (code) => {
  console.log(`Rodis Bot exited with code ${code}`);
  process.exit(code);
});

process.on('SIGINT', () => {
  console.log('\nShutting down both bots...');
  rodulisBot.kill('SIGINT');
  rodisBot.kill('SIGINT');
  process.exit(0);
});
