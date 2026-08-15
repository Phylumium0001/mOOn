const router = require('express').Router();
const prisma = require('../prismaClient');
const { protect, requireRole } = require('../middleware/auth');

// Custom function to fix campus formatting (replace spaces with underscores and remove commas)
const fixCampus = (campus) => {
  return campus.replaceAll(" ", '_').replace(",", '');
};

// Build Prisma WHERE filter for the campus/scope preference
const buildScopeFilter = ({ scope, campus, region }) => {
  if (scope === 'nationwide') {
    return { isActive: true, isVerified: true };
  }
  if (scope === 'region' && region) {
    return {
      isActive: true,
      OR: [
        { scope: 'nationwide', isVerified: true },
        { scope: 'region', region },
        { scope: 'campus', campus }
      ]
    };
  }
  // Default: campus mode
  return {
    isActive: true,
    OR: [
      { scope: 'campus', campus },
      { scope: 'nationwide', isVerified: true },
      { scope: 'region' }
    ]
  };
};

// GET /api/shops
router.get('/', async (req, res) => {
  const { scope, campus, region, category } = req.query;
  try {
    const where = buildScopeFilter({ scope, campus, region });
    if (category) where.category = category;

    const shops = await prisma.shop.findMany({
      where,
      include: { owner: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, count: shops.length, shops });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/shops/vendor/mine
router.get('/vendor/mine', protect, requireRole('vendor'), async (req, res) => {
  try {
    const shop = await prisma.shop.findUnique({
      where: { ownerId: req.user.id },
      include: { owner: { select: { id: true, name: true, email: true } } }
    });
    if (!shop) return res.status(404).json({ success: false, message: 'No shop found.' });
    res.json({ success: true, shop });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/shops/:id
router.get('/:id', async (req, res) => {
  try {
    const shop = await prisma.shop.findUnique({
      where: { id: req.params.id },
      include: { owner: { select: { id: true, name: true, email: true, phone: true } } }
    });
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found.' });
    res.json({ success: true, shop });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/shops
router.post('/', protect, requireRole('vendor', 'admin'), async (req, res) => {
  try {
    const existing = await prisma.shop.findUnique({ where: { ownerId: req.user.id } });
    if (existing && req.user.role === 'vendor') {
      return res.status(400).json({ success: false, message: 'You already have a shop.' });
    }

    const {
      name, description, category, scope, campus, region,
      contactPhone, contactEmail, deliveryFee, minOrderAmount, estimatedDeliveryTime
    } = req.body;
    
    const shop = await prisma.shop.create({
      data: {
        ownerId: req.user.id,
        name, description, category,
        scope: scope || 'campus',
        campus: fixCampus(campus) || req.user.campus,
        region, contactPhone, contactEmail,
        deliveryFee: parseFloat(deliveryFee) || 0,
        minOrderAmount: parseFloat(minOrderAmount) || 0,
        estimatedDeliveryTime: estimatedDeliveryTime || '30-45 mins'
      }
    });
    res.status(201).json({ success: true, shop });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/shops/:id
router.patch('/:id', protect, requireRole('vendor', 'admin'), async (req, res) => {
  try {
    const shop = await prisma.shop.findUnique({ where: { id: req.params.id } });
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found.' });
    if (shop.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not your shop.' });
    }

    const {
      name, description, category, scope, campus, region,
      contactPhone, contactEmail, deliveryFee, minOrderAmount, estimatedDeliveryTime, isActive
    } = req.body;

    const updated = await prisma.shop.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
        ...(scope && { scope }),
        ...(campus && { campus }),
        ...(region !== undefined && { region }),
        ...(contactPhone !== undefined && { contactPhone }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(deliveryFee !== undefined && { deliveryFee: parseFloat(deliveryFee) }),
        ...(minOrderAmount !== undefined && { minOrderAmount: parseFloat(minOrderAmount) }),
        ...(estimatedDeliveryTime && { estimatedDeliveryTime }),
        ...(isActive !== undefined && { isActive })
      }
    });
    res.json({ success: true, shop: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
