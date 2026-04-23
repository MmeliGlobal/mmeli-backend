const express = require('express');
const supabase = require('../supabase');
const { authMiddleware, adminMiddleware } = require('../middleware');
const router = express.Router();

router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
const { data, error } = await supabase.from('inventory').select('*, products(name)');
if (error) return res.status(500).json({ error: error.message });
res.json(data);
});

router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
const { data, error } = await supabase.from('inventory').insert([req.body]).select().single();
if (error) return res.status(500).json({ error: error.message });
res.status(201).json(data);
});

router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
const { quantity } = req.body;
const { data, error } = await supabase.from('inventory').update({ quantity, updated_at: new Date() }).eq('id', req.params.id).select().single();
if (error) return res.status(500).json({ error: error.message });
res.json(data);
});

module.exports = router;