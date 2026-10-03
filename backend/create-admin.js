const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const parsedEnv = dotenv.parse(envContent);

if (!parsedEnv.DATABASE_URL || !parsedEnv.DATABASE_URL.startsWith('mysql://')) {
  throw new Error('DATABASE_URL in backend/.env is not a valid mysql:// URL.');
}

process.env.DATABASE_URL = parsedEnv.DATABASE_URL;

const readline = require('readline');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question, hidden = false) {
  return new Promise(resolve => {
    if (!hidden) {
      rl.question(question, resolve);
      return;
    }

    process.stdout.write(question);
    let password = '';

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    const onData = key => {
      if (key === '\r' || key === '\n') {
        process.stdin.setRawMode(false);
        process.stdin.removeListener('data', onData);
        process.stdout.write('\n');
        resolve(password);
      } else if (key === '\u0003') {
        process.exit();
      } else if (key === '\b' || key === '\x7f') {
        password = password.slice(0, -1);
      } else {
        password += key;
      }
    };

    process.stdin.on('data', onData);
  });
}

async function main() {
  console.log('\n?? Create Admin Account\n');

  const name = await ask('Admin name: ');
  const email = await ask('Admin email: ');
  const password = await ask('Admin password: ', true);

  if (!name || !email || !password) {
    console.log('? All fields are required.');
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    console.log('? A user with this email already exists.');
    process.exit(1);
  }

  const admin = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: 'ADMIN'
    }
  });

  console.log('\n? Admin account created successfully!');
  console.log(`Name: ${admin.name}`);
  console.log(`Email: ${admin.email}`);
  console.log(`Role: ${admin.role}`);
}

main()
  .catch(error => {
    console.error('\n? Failed:', error.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
    rl.close();
  });
