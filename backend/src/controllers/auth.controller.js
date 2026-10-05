const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { generateToken } = require('../middleware/auth.middleware');

// POST /api/auth/register
async function register(req, res) {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email: email.toLowerCase() }, { phone: phone || undefined }] },
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email or phone' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone: phone || null,
        password: hashedPassword,
        role: 'CUSTOMER',
      },
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'Failed to register account' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, identifier: rawIdentifier, password } = req.body;
    const inputIdentifier = (rawIdentifier || email || '').trim();

    if (!inputIdentifier || !password) {
      return res.status(400).json({ success: false, message: 'Email or mobile number and password are required' });
    }

    const cleanedDigits = inputIdentifier.replace(/\D/g, '');
    const searchConditions = [
      { email: inputIdentifier.toLowerCase() },
      { phone: inputIdentifier },
    ];

    if (cleanedDigits) {
      searchConditions.push({ phone: cleanedDigits });
      if (cleanedDigits.length === 10) {
        searchConditions.push({ phone: `+91${cleanedDigits}` });
        searchConditions.push({ phone: `91${cleanedDigits}` });
      } else if (cleanedDigits.length === 12 && cleanedDigits.startsWith('91')) {
        searchConditions.push({ phone: cleanedDigits.slice(2) });
      }
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: searchConditions,
      },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Logged in successfully',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Failed to login' });
  }
}

// GET /api/auth/me
async function getProfile(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch user profile' });
  }
}

module.exports = {
  register,
  login,
  getProfile,
};