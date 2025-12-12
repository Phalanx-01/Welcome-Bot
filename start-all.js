const { spawn } = require('child_process');

console.log('Starting all three Discord bots...\n');

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

// Start Nikos Bot
const nikosBot = spawn('node', ['nikos-bot.js'], {
  stdio: 'inherit',
  env: { ...process.env }
});

rodulisBot.on('error', (error) => {
  console.error('Rodulis Bot error:', error);
});

rodisBot.on('error', (error) => {
  console.error('Rodis Bot error:', error);
});

nikosBot.on('error', (error) => {
  console.error('Nikos Bot error:', error);
});

rodulisBot.on('exit', (code) => {
  console.log(`Rodulis Bot exited with code ${code}`);
  process.exit(code);
});

rodisBot.on('exit', (code) => {
  console.log(`Rodis Bot exited with code ${code}`);
  process.exit(code);
});

nikosBot.on('exit', (code) => {
  console.log(`Nikos Bot exited with code ${code}`);
  process.exit(code);
});

process.on('SIGINT', () => {
  console.log('\nShutting down all three bots...');
  rodulisBot.kill('SIGINT');
  rodisBot.kill('SIGINT');
  nikosBot.kill('SIGINT');
  process.exit(0);
});