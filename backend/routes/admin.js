const express = require('express');
const supabase = require('../supabase');
const { authMiddleware, adminMiddleware } = require('../middleware');

const router = express.Router();

router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [orders, products, users, quotations, shipments] = await Promise.all([
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('quotations').select('*', { count: 'exact', head: true }),
      supabase.from('shipments').select('*', { count: 'exact', head: true })
    ]);
    res.json({
      orders: orders.count,
      products: products.count,
      users: users.count,
      quotations: quotations.count,
      shipments: shipments.count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;