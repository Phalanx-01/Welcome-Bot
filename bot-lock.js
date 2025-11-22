const fs = require('fs');
const path = require('path');

const LOCK_FILE = path.join(__dirname, '.bot-playing.lock');
const LOCK_CHECK_INTERVAL = 500; // Check every 500ms
const MAX_WAIT_TIME = 30000; // Max wait 30 seconds

/**
 * Checks if any bot is currently playing
 */
function isLocked() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const lockData = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
      // Check if lock is stale (older than 2 minutes)
      const lockAge = Date.now() - lockData.timestamp;
      if (lockAge > 120000) {
        console.log('Removing stale lock file');
        releaseLock();
        return false;
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error checking lock:', error);
    return false;
  }
}

/**
 * Acquires the lock for a bot
 */
function acquireLock(botName) {
  try {
    const lockData = {
      bot: botName,
      timestamp: Date.now()
    };
    fs.writeFileSync(LOCK_FILE, JSON.stringify(lockData), 'utf8');
    console.log(`🔒 Lock acquired by ${botName}`);
    return true;
  } catch (error) {
    console.error('Error acquiring lock:', error);
    return false;
  }
}

/**
 * Releases the lock
 */
function releaseLock() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
      console.log('🔓 Lock released');
    }
  } catch (error) {
    console.error('Error releasing lock:', error);
  }
}

/**
 * Waits until the lock is available
 */
async function waitForLock(botName, maxWaitTime = MAX_WAIT_TIME) {
  const startTime = Date.now();

  while (isLocked()) {
    const elapsed = Date.now() - startTime;
    if (elapsed > maxWaitTime) {
      console.log(`⏱️ ${botName} waited too long, proceeding anyway`);
      return false;
    }

    const lockData = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
    console.log(`⏳ ${botName} waiting for ${lockData.bot} to finish... (${Math.floor(elapsed/1000)}s)`);

    await new Promise(resolve => setTimeout(resolve, LOCK_CHECK_INTERVAL));
  }

  return true;
}

module.exports = {
  isLocked,
  acquireLock,
  releaseLock,
  waitForLock
};
