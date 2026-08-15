const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const prisma = require('../prismaClient');
const { protect } = require('../middleware/auth');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const safeUser = (u) => {
  const { password, ...rest } = u;
  return rest;
};

// POST /api/auth/register
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('campus').notEmpty().withMessage('Campus is required')
], async (req, res) => {
  
  const errors = validationResult(req);
  console.log('Validation errors:', errors.array());
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { name, email, password, phone, campus, shopScope, region, role } = req.body;
  console.log('Registering user:', { name, email, campus, shopScope, region, role });

  const fixCampus = (campus) => {
    return campus.replaceAll(" ", '_').replace(",", '');
  };

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ success: false, message: 'Email already registered.' });

    const allowedRoles = ['customer', 'vendor'];
    const userRole = allowedRoles.includes(role) ? role : 'customer';
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name, email,
        password: hashedPassword,
        phone,
        campus: fixCampus(campus),
        shopScope: shopScope || 'campus',
        region,
        role: userRole
      }
    });

    const token = signToken(user.id);
    res.status(201).json({ success: true, token, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = signToken(user.id);
    res.json({ success: true, token, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

// PATCH /api/auth/preferences
router.patch('/preferences', protect, async (req, res) => {
  const { campus, shopScope, region, deliveryAddresses } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(campus && { campus }),
        ...(shopScope && { shopScope }),
        ...(region !== undefined && { region }),
        ...(deliveryAddresses && { deliveryAddresses })
      }
    });
    res.json({ success: true, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
