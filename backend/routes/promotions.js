const express = require('express');
const supabase = require('../supabase');
const { authMiddleware, adminMiddleware } = require('../middleware');
const router = express.Router();

// Get active promotions (random one for popup)
router.get('/random', async (req, res) => {
const { data, error } = await supabase
.from('promotions')
.select('*')
.eq('is_active', true);
if (error) return res.status(500).json({ error: error.message });
const random = data.length ? data[Math.floor(Math.random() * data.length)] : null;
res.json(random);
});

// Get all promotions (admin)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
const { data, error } = await supabase.from('promotions').select('*').order('created_at', { ascending: false });
if (error) return res.status(500).json({ error: error.message });
res.json(data);
});

// Create/update/delete promotions (admin)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
const { data, error } = await supabase.from('promotions').insert([req.body]).select().single();
if (error) return res.status(500).json({ error: error.message });
res.status(201).json(data);
});

router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
const { data, error } = await supabase.from('promotions').update(req.body).eq('id', req.params.id).select().single();
if (error) return res.status(500).json({ error: error.message });
res.json(data);
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
const { error } = await supabase.from('promotions').delete().eq('id', req.params.id);
if (error) return res.status(500).json({ error: error.message });
res.json({ message: 'Deleted' });
});

module.exports = router;