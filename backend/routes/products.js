const express = require('express');
const supabase = require('../supabase');
const router = express.Router();

// Public GET – no authentication required
router.get('/', async (req, res) => {
const { data, error } = await supabase.from('products').select('*');
if (error) return res.status(500).json({ error: error.message });
res.json(data);
});

router.get('/:id', async (req, res) => {
const { data, error } = await supabase.from('products').select('*').eq('id', req.params.id).single();
if (error) return res.status(404).json({ error: 'Not found' });
res.json(data);
});

// Admin actions (add, update, delete) – add auth middleware later
router.post('/', async (req, res) => {
const { data, error } = await supabase.from('products').insert([req.body]).select().single();
if (error) return res.status(500).json({ error: error.message });
res.status(201).json(data);
});

router.put('/:id', async (req, res) => {
const { data, error } = await supabase.from('products').update(req.body).eq('id', req.params.id).select().single();
if (error) return res.status(500).json({ error: error.message });
res.json(data);
});

router.delete('/:id', async (req, res) => {
const { error } = await supabase.from('products').delete().eq('id', req.params.id);
if (error) return res.status(500).json({ error: error.message });
res.json({ message: 'Deleted' });
});

module.exports = router;
