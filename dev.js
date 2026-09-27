import { spawn } from 'node:child_process';

// Pass through any arguments passed to dev.js (such as --port 3000 --host 0.0.0.0)
const viteArgs = process.argv.slice(2);
if (!viteArgs.includes('--port') && !viteArgs.some(a => a.startsWith('--port='))) {
  viteArgs.push('--port=3000');
}
if (!viteArgs.includes('--host') && !viteArgs.some(a => a.startsWith('--host='))) {
  viteArgs.push('--host=0.0.0.0');
}

console.log('Starting LearnSphere backend (port 5000) and frontend Vite server (port 3000)...');

const backend = spawn('node', ['server/server.js'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: '5000',
    BACKEND_PORT: '5000',
  },
});

const frontend = spawn('npx', ['vite', ...viteArgs], {
  stdio: 'inherit',
  env: process.env,
});

let isShuttingDown = false;
const cleanExit = (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`Shutting down LearnSphere dev services (${signal})...`);
  try { backend.kill('SIGTERM'); } catch {}
  try { frontend.kill('SIGTERM'); } catch {}
  setTimeout(() => process.exit(0), 500);
};

process.on('SIGINT', () => cleanExit('SIGINT'));
process.on('SIGTERM', () => cleanExit('SIGTERM'));

backend.on('exit', (code, signal) => {
  if (!isShuttingDown && code !== 0) {
    console.error(`Backend exited with code ${code} signal ${signal}`);
  }
});

frontend.on('exit', (code, signal) => {
  if (!isShuttingDown) {
    cleanExit(`Frontend exited with code ${code}`);
  }
});
