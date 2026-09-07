const { spawn } = require('child_process');
const path = require('path');

console.log("\x1b[36m%s\x1b[0m", "=====================================================================");
console.log("\x1b[32m%s\x1b[0m", "🚀 Starting CryptoVoyage AWS Cloud Platform & Web3 Frontend...");
console.log("\x1b[36m%s\x1b[0m", "=====================================================================");

// Start Backend Emulation Server
const backend = spawn('node', ['backend/local-dev-server.js'], {
  stdio: 'inherit',
  shell: true
});

// Start Frontend Dev Server
const frontend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, '..', 'frontend'),
  stdio: 'inherit',
  shell: true
});

const cleanup = () => {
  console.log("\nShutting down servers...");
  backend.kill();
  frontend.kill();
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
