const express = require('express');
const supabase = require('../supabase');
const { authMiddleware, adminMiddleware } = require('../middleware');
const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
const { order_id, reason, images } = req.body;
const { data, error } = await supabase.from('returns').insert([{ order_id, user_id: req.user.id, reason, images }]).select().single();
if (error) return res.status(500).json({ error: error.message });
res.status(201).json(data);
});

router.get('/my-returns', authMiddleware, async (req, res) => {
const { data, error } = await supabase.from('returns').select('*, orders(tracking_code, total)').eq('user_id', req.user.id);
if (error) return res.status(500).json({ error: error.message });
res.json(data);
});

router.put('/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
const { status, refund_amount, refund_method } = req.body;
const { data, error } = await supabase.from('returns').update({ status, refund_amount, refund_method }).eq('id', req.params.id).select().single();
if (error) return res.status(500).json({ error: error.message });
res.json(data);
});

module.exports = router;