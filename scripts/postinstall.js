const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

try {
  // 1. Generate Prisma Client
  run('npx prisma generate');

  // 2. Install workspace dependencies cross-platform
  run('npm install --prefix frontend/customer');
  run('npm install --prefix frontend/admin');
  run('npm install --prefix backend');

  // 3. Copy .prisma directory to backend/node_modules/.prisma safely across platforms
  const src = path.resolve(__dirname, '../node_modules/.prisma');
  const dest = path.resolve(__dirname, '../backend/node_modules/.prisma');

  if (fs.existsSync(src)) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.cpSync(src, dest, { recursive: true, force: true });
    console.log('Successfully copied .prisma to backend/node_modules/.prisma');
  }
} catch (err) {
  console.error('Postinstall script notice:', err.message);
}