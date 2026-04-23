const express = require('express');
const supabase = require('../supabase');
const { authMiddleware, adminMiddleware } = require('../middleware');
const router = express.Router();

// Get all discounts
router.get('/discounts', authMiddleware, adminMiddleware, async (req, res) => {
const { data, error } = await supabase.from('discounts').select('*');
if (error) return res.status(500).json({ error: error.message });
res.json(data);
});

// Create discount
router.post('/discounts', authMiddleware, adminMiddleware, async (req, res) => {
const { data, error } = await supabase.from('discounts').insert([req.body]).select().single();
if (error) return res.status(500).json({ error: error.message });
res.status(201).json(data);
});

// Validate discount code (public)
router.post('/validate', async (req, res) => {
const { code, cartTotal } = req.body;
const { data, error } = await supabase.from('discounts').select('*').eq('code', code).eq('is_active', true).single();
if (error || !data) return res.status(404).json({ error: 'Invalid or expired code' });
if (data.min_order && cartTotal < data.min_order) return res.status(400).json({ error: `Minimum order $${data.min_order}` });
if (data.usage_limit && data.used_count >= data.usage_limit) return res.status(400).json({ error: 'Code usage limit reached' });
let discountAmount = data.type === 'percentage' ? (data.value / 100) * cartTotal : data.value;
res.json({ discountAmount, code: data.code });
});

module.exports = router;